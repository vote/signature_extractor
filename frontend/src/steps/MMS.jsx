import React, { useState, useCallback } from 'react';
import { useRef } from 'react';
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';
import { useEffect } from 'react';
import { blobToDataURL } from '../blobUtil';
import { preprocessImage } from '../preprocessImage';
import { trackError, trackEvent } from '../instrumentation';

const POLL_FREQUENCY_MILLIS = 2000;

function MMSReceive({ phoneNumber, onReceivePhoto }) {
  const completeCallback = useRef(onReceivePhoto);

  const [error, setError] = useState(null);
  const [fromPhone, setFromPhone] = useState(null);

  useEffect(() => {
    completeCallback.current = onReceivePhoto;
  }, [onReceivePhoto]);

  useEffect(() => {
    let canceled = false;

    const e164Phone = parsePhoneNumberFromString(phoneNumber, 'US').format(
      'E.164',
    );

    fetch(`${process.env.REACT_APP_API_BASE}/mms/init`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ phone: e164Phone }),
    })
      .then((r) => r.json())
      .then((r) => {
        if (canceled) {
          return;
        }

        const { token, from_phone: fromPhone } = r;
        setFromPhone(fromPhone);

        // Start polling
        let consecutiveErrors = 0;
        function pollForResult() {
          if (canceled) {
            return;
          }

          fetch(
            `${
              process.env.REACT_APP_API_BASE
            }/mms/check?phone=${encodeURIComponent(
              e164Phone,
            )}&token=${encodeURIComponent(token)}`,
            {
              headers: new Headers({
                Accept: 'image/jpeg',
              }),
            },
          )
            .then((resp) => {
              if (canceled) {
                return;
              }

              if (resp.status !== 200) {
                const err = new Error(`Status code ${resp.status}`);
                err.httpResponse = resp;

                return Promise.reject(err);
              }

              setError(null);
              return resp.blob();
            })
            .then((b) => preprocessImage(b))
            .then((b) => blobToDataURL(b))
            .then((dataURL) => {
              if (canceled) {
                return;
              }

              trackEvent({
                evt: 'sms-picture-received',
                category: 'SMS',
              });

              completeCallback.current(dataURL);
            })
            .catch((e) => {
              if (canceled) {
                return;
              }

              if (e.httpResponse && e.httpResponse.status === 404) {
                // not really an error; just no signature yet
                consecutiveErrors = 0;
                setError(null);
              } else {
                trackError(e);

                consecutiveErrors++;
                if (consecutiveErrors >= 3) {
                  setError(
                    "We're having trouble checking to see if we've received your signature. Please check your internet connection. We'll keep retrying; there's no need to refresh the page.",
                  );
                }
              }

              setTimeout(pollForResult, POLL_FREQUENCY_MILLIS);
            });
        }
        pollForResult();

        return () => {
          canceled = true;
        };
      })
      .catch(() => {
        setError('Error sending you a text. Please try again.');
      });
  }, [phoneNumber]);

  if (!fromPhone) {
    return error ? <p>{error}</p> : <p>Connecting...</p>;
  }

  const fromPhoneFormatted = parsePhoneNumberFromString(
    fromPhone,
    'US',
  ).formatNational();

  return (
    <>
      <p>
        You'll receive our text from {fromPhoneFormatted} momentarily. Text us a
        back photo of your signature on a plain white background. Make sure your
        signature fills up as much of the photo as you can.
      </p>
      <p>
        Leave this page open. Your photo will appear here within 5 or 10 seconds
        after you text it to us.
      </p>

      {error && <p>{error}</p>}
    </>
  );
}

function MMSPhoneInput({ onSubmit }) {
  const inputRef = useRef();
  const [phoneNumber, setPhoneNumber] = useState('');

  function handleSubmit(evt) {
    evt.preventDefault();

    trackEvent({
      evt: 'provide-sms-number',
      category: 'SMS',
    });

    onSubmit(phoneNumber);
  }

  function handleChange() {
    const value = inputRef.current.value;

    // validate
    const phoneNumber = parsePhoneNumberFromString(value, 'US');
    if (phoneNumber && phoneNumber.isValid()) {
      if (phoneNumber.country === 'US') {
        inputRef.current.setCustomValidity('');
      } else {
        inputRef.current.setCustomValidity('Please enter a US phone number');
      }
    } else {
      inputRef.current.setCustomValidity('Please enter a valid phone number');
    }

    // format
    setPhoneNumber(new AsYouType('US').input(value));
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        Enter your cell phone number. We'll send this number a text message, and
        you'll reply with a picture of your signature. Message and data rates
        may apply.
      </p>
      <input
        type="tel"
        ref={inputRef}
        value={phoneNumber}
        onChange={handleChange}
      />
      <input type="submit" value="Submit" />
    </form>
  );
}

export default function MMS({ onReceivePhoto, onPrevious }) {
  const [phone, setPhone] = useState(null);
  const photoCallback = useCallback(onReceivePhoto);

  return (
    <>
      <h1>Text A Photo</h1>
      {phone ? (
        <MMSReceive phoneNumber={phone} onReceivePhoto={photoCallback} />
      ) : (
        <MMSPhoneInput onSubmit={setPhone} />
      )}
      <button onClick={onPrevious}>&laquo; Back</button>
    </>
  );
}
