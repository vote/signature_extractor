import base64
import json
import os
import re
import secrets
import time
from typing import Any, Dict
from urllib.parse import parse_qsl

import boto3
import cv2
import numpy as np
import requests
import sentry_sdk
from botocore.exceptions import ClientError
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration
from smalluuid import SmallUUID
from twilio.request_validator import RequestValidator
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse

from extractor.extract import extract_signature, qualify_signature

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE"])

twilio = Client(os.environ["TWILIO_SID"], os.environ["TWILIO_AUTH_TOKEN"])

PHONE_RE = re.compile(r"^\+1\d{10}$")
FROM_PHONE = os.environ["TWILIO_PHONE_NUMBER"]

sentry_sdk.init(
    dsn=os.environ["SENTRY_DSN"],
    environment=os.environ["SENTRY_ENVIRONMENT"],
    integrations=[AwsLambdaIntegration()],
)


def cors_response(
    status_code: int,
    content_type: str,
    body: str,
    is_base_64: bool = False,
    extra_headers: Dict[str, str] = {},
) -> Dict[str, Any]:
    resp: Dict[str, Any] = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": content_type,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
            "Access-Control-Allow-Headers": "Content-Type, Accept",
        },
        "body": body,
    }

    if is_base_64:
        resp["isBase64Encoded"] = True

    if len(extra_headers) > 0:
        resp["headers"]["Access-Control-Expose-Headers"] = ", ".join(
            extra_headers.keys()
        )

        resp["headers"].update(extra_headers)

    return resp


def json_success_response(body: Any) -> Dict[str, Any]:
    return cors_response(200, "application/json", json.dumps(body))


def json_error_response(message: str, status_code: int = 422) -> Dict[str, Any]:
    return cors_response(
        status_code, "application/json", json.dumps({"error": message})
    )


def extract(event: Any, context: Any):
    input_bytes = base64.b64decode(event["body"])
    input_arr = np.frombuffer(input_bytes, dtype=np.uint8)
    input_image = cv2.imdecode(
        input_arr, cv2.IMREAD_COLOR + cv2.IMREAD_IGNORE_ORIENTATION
    )

    final_size = None
    val = event["headers"].get("x-voteamerica-resize-to")
    if val:
        final_size = tuple([int(d) for d in val.split("x")])
    bw = True if event["headers"].get("x-voteamerica-bw") == "1" else False

    output_image = extract_signature(input_image, final_size=final_size, bw=bw)
    _, output_arr = cv2.imencode(".jpg", output_image)
    output_bytes = output_arr.tobytes()

    warnings = qualify_signature(output_image, bw=bw)

    # Save the input and output to S3 with an assigned ID for diagnostics
    uuid = str(SmallUUID())

    client = boto3.client("s3")
    client.put_object(
        Bucket=os.environ["S3_BUCKET"],
        Key=f"{os.environ['S3_PREFIX']}/sigs/{uuid}-input.jpg",
        Body=input_bytes,
    )
    client.put_object(
        Bucket=os.environ["S3_BUCKET"],
        Key=f"{os.environ['S3_PREFIX']}/sigs/{uuid}-output.jpg",
        Body=output_bytes,
    )

    return cors_response(
        200,
        "image/jpeg",
        base64.b64encode(output_bytes).decode("utf-8"),
        is_base_64=True,
        extra_headers={
            "X-VoteAmerica-Signature-UUID": uuid,
            "X-VoteAmerica-Signature-Warnings": ",".join(warnings),
        },
    )


# POST /mms/init
# { "phone": "+16175551234" }
#
# Sends a text for the user to reply to, and returns a token that can be used
# to poll GET /mms/check
def post_mms_init(event: Any, context: Any):
    token = secrets.token_urlsafe(32)

    try:
        body = json.loads(event["body"])
    except Exception as e:
        print(e)
        return json_error_response("Invalid JSON body")

    if not body.get("phone"):
        return json_error_response('Missing "phone" from body')

    phone = body["phone"]
    if not PHONE_RE.match(phone):
        return json_error_response("Phone number must be a US number in E.164 format")

    # Insert the token. Note that this will delete the existing signature image
    # for this so you can't steal an existing signature by re-requesting a token.
    table.put_item(
        Item={"ttl": int(time.time()) + 60 * 60 * 24, "phone": phone, "token": token,}
    )

    twilio.messages.create(
        body="Okay, let's get your signature. Reply with a picture of your signature on a plain, white background. Message and data rates may apply. If you didn't request this message, reply STOP.",
        from_=os.environ["TWILIO_PHONE_NUMBER"],
        to=phone,
    )

    return json_success_response({"token": token, "from_phone": FROM_PHONE})


# GET /mms/check?phone=<phone>&token=<token>
#
# Returns a 404 if the user has not yet replied with a signature, or the
# signature (as a binary response) if they have.
def get_mms_check(event: Any, context: Any):
    phone = event["queryStringParameters"].get("phone")
    if not phone:
        return json_error_response('Missing "phone" from query parameters')

    token = event["queryStringParameters"].get("token")
    if not token:
        return json_error_response('Missing "token" from query parameters')

    record = table.get_item(Key={"phone": phone}).get("Item")
    if not record:
        print(f"No such phone number: {phone}")
        return json_error_response("Wrong phone or token")

    if not record.get("token") or not secrets.compare_digest(record["token"], token):
        print(f"Invalid token: {token}")
        return json_error_response("Wrong phone or token")

    if not record.get("media_url"):
        return json_error_response("No signature yet", status_code=404)

    file = requests.get(record["media_url"])
    return cors_response(
        200,
        file.headers["Content-Type"],
        base64.b64encode(file.content).decode("utf-8"),
        is_base_64=True,
    )


def twilio_mms(event: Any, context: Any):
    # keep_blank_values is really important here! If we don't pass it, the
    # Twilio signature validation will fail.
    body = dict(parse_qsl(event["body"], keep_blank_values=True))

    validator = RequestValidator(os.environ["TWILIO_AUTH_TOKEN"])

    request_valid = validator.validate(
        os.environ["TWILIO_CALLBACK_URL"], body, event["headers"]["X-Twilio-Signature"]
    )

    if not request_valid:
        print("Invalid signature", event)
        return {"statusCode": "400"}

    resp = MessagingResponse()

    if body["NumMedia"] != "1":
        resp.message(
            "Please send a picture of your signature on a plain white background."
        )
    else:
        try:
            table.update_item(
                Key={"phone": body["From"]},
                UpdateExpression="SET media_url = :media_url",
                ConditionExpression="attribute_exists(phone)",
                ExpressionAttributeValues={":media_url": body["MediaUrl0"]},
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                resp.message(
                    "Sorry, we don't recognize this number. Please go to VoteAmerica.com to get your absentee ballot."
                )
            else:
                raise e
        else:
            resp.message(
                "We've received your signature. The page should update momentarily."
            )

    return {
        "statusCode": 200,
        "body": str(resp),
        "headers": {"Content-Type": "text/xml",},
    }
