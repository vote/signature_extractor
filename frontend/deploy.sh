#!/bin/bash

# Deploys the UI to http://esign-demo.voteamerica.com/

set -euo pipefail

cd "$(dirname "$0")"

yarn run build
aws s3 sync build s3://esign-demo.voteamerica.com --cache-control max-age=31540000 --acl=public-read
aws s3 cp build/index.html s3://esign-demo.voteamerica.com/index.html --content-type text/html --cache-control max-age=60 --acl=public-read

curl "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache" \
     -X POST \
     -H "Authorization: Bearer ${CLOUDFLARE_AUTH_TOKEN}" \
     -H "Content-Type: application/json" \
     -d "{\"hosts\":[\"esign-demo.voteamerica.com\"]}"
