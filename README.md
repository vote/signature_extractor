# Signature Extractor

Extracts clean, black-and-white images of signatures from user-captured photos
of a signature.

[Read more about this system on our blog](https://medium.com/voteamerica/the-computer-vision-tech-that-helped-15-000-voters-request-a-ballot-online-3bd28961b907).

## Online Demo

You can try out the code on [http://esign-demo.voteamerica.com/](http://esign-demo.voteamerica.com/).

## Background and Problem Statement

At VoteAmerica, we're working to make it easier to register to vote by mail.
In most states, you need to submit an application to receive your ballot by
mail, and these applications are usually forms that you need to print, fill,
sign, and mail. This is difficult for many people: home printer ownership is
in the single digits, so over 90% of people can't print out a physical form
and sign it. In addition, many people don't have envelopes and stamps on hand.

To expand access to vote-by-mail, we're building a system that let you complete
and sign the form online. Because the signature on your application may be
compared to the signature you have on file with the state and/or the signature
on your ballot, it's critical that it's a good representation of your physical
signature -- not your finger on a touchscreen or a typed-in name in a curly
font. Additionally, many states and local election official will only accept
a pen-on-paper signature. However, the majority of states will accept a scanned
physical signature: a real signature on paper that's then digitally scanned and
applied to the PDF application form.

So we're building a system to produce high-quality scans of signatures from
camera phone pictures. While there's a lot of existing research into extracting
signatures from high-quality scanned documents, there's much less work on
scanning them from low-quality phone pictures with varied backgrounds,
lighting conditions, and writing implements.

That's where this project comes in: our web-based UI will guide the user through
uploading their signature and cropping the photo so it just contains the
signature, and then this code will handle binarization (converting the image
to black-and-white) and removing background lighting and textures.

## Current Status And Development Priorities

The current code is pretty good at dealing with good-quality photos: not
too blurry, dark text on a light background. It can handle most lighting
conditions.

We'd like to improve:

- Handling really sharp or intense shadows
- Handling very textured backgrounds
- Removing lines from lined paper
- Detecting possible errors -- sending back a warning if it looks like the photo might not be of a signature (the most common things we see are folks submitting selfies, or photos of their driver's license). We'd love to be able to surface a warning in our UI like "It looks like you took a photo of yourself -- make sure you took a photo of your written signature").

We have a pretty extensive set of sample pictures of signatures in
`samples/images`. They're grouped into three sections: `easy`, which are
photos that we can already handle pretty well (but there's still room
for improvement on some of them!), `med`, which are photos that we're getting
closer to being able to handle but need improvement, and `hard`, which are
photos that we don't handle well at all yet (like photos on lined paper).

One specific idea we have to to automatically tune the parameters in `extractor/params.py`.
We might be able to do this by manually creating ground-truth data (by manually editing the
sample signatures in Photoshop or something to create "perfectly" extracted signatures),
and then finding the optimal values for the parameters via grid search.

We're also interested in removing the step in our UI where we ask users to crop and rotate the
image before submitting it to this signature extractor. Ideally, the user could just submit a photo
and we'd automatically crop and rotate it to just include the signature by running a classifier/detector
to identify where the signature is and try to rotate it to be right-side up. We'd probably still let the
user manually adjust the cropping and rotation, so this might need to be a separate function that takes a
photo and returns the best-guess cropping and rotation for the user to confirm.

With all of these improvements, it's extremely important to think about the failure cases and end-user
experience. For example, take the problem of removing lines from lined paper. Right now, if you submit
a photo on lined paper, you get back an extracted signature that has those lines in it. This isn't great --
it's not a usable signature -- but it's very clear from looking at it what went wrong, and the user
will probably look at the extracted photo with the lines, be able to realize that they need to re-take the
photo on unlined paper, and try again. If we implement a very fancy system to remove those lines that works in
90% of cases, but in the other 10% removes bits of the signature, that's going to be much more confusing to
those 10% of users -- it won't be immediately clear why their signature isn't being processed correctly, or
how they can fix it. In all cases, we want to produce a signature that is either correctly extracted, or is
incorrect in some obvious way that the user can understand and fix. So while all of these more advanced
features are something that we're interested in exploring and testing, we may not be able to accept implementations
if we think that they'll produce more confusing failure modes for even a small percentage of users -- remember that
errors and incorrect results here can directly disenfranchise the voters we're trying to help, and we take
that responsibility very seriously. Many states compare the signature on the ballot request form (which is what
we use this signature extractor help voters prepare) to the signature on the ballot itself, and will reject
the ballot if the signature doesn't match. So if this code messes up and changes the signature, it can lead
to the voter's ballot being rejected because their physical signature on the ballot doesn't match the result
of this signature extractor code. We, along with
[other](https://www.aclu.org/blog/voting-rights/signature-match-laws-disproportionately-impact-voters-already-margins) 
[organizations](https://www.democracydocket.com/2020/05/safeguard-voting-rights-with-vbm/), 
hope that these rules will change, but for now we need to carefully weight any improvements in our technology
with the potential downsides of creating more confusing failure modes.

## Development

You'll need Python 3 and [pipenv](https://pipenv-fork.readthedocs.io/en/latest/).
To have your code automatically formatted/linted when you commit, you'll also
need [Yarn](http://yarnpkg.com/).

Start out by running `pipenv install` to install all of the dependencies and
set up a virtualenv. We also recommend running `yarn install` to set up the
pre-commit hooks that will automatically format your code.

The core image processing code is in the `extractor` package. You can test out
this code against our included corpus of signature photos.

- You can run a quick test with `pipenv run single_sample`. This will
process the input `samples/images/easy1.jpg` and write the result
as `samples/images/easy1.out.jpg`.

- You can run a bigger test with `pipenv run samples`. This will process every
input in `samples/images` and write them all next to the input images, e.g.
`easy2.jpg` will be processed and written to `easy2.out.jpg`. This will work
in parallel so it should only take a few seconds.

- You can do a debug run with `DEBUG=1 pipenv run single_sample`. This will open
a window that shows you each intermediate transformation.

- If you want `single_sample` to work with a different image (not
`sample/images/easy1.jpg`), you can edit the `Pipfile` to point that script
to a different file.

### Linting & Formatting

To automatically format your code: `pipenv run format`. This runs
[autoflake](https://pypi.org/project/autoflake/),
[isort](https://pypi.org/project/isort/),
and [black](https://pypi.org/project/black/). We run this automatically when you
commit (as long as you've run `yarn install`).


## Deploying

You'll need VoteAmerica AWS access to deploy the code.

If you're an external contributor, you don't need to worry about this section --
it's just how to deploy the backend code to our AWS environment, and how to
update the test frontend on esign-demo.voteamerica.com

### Local Development

`yarn sls deploy` will deploy to the "local" environment and print out the URL to hit. You
can test it out with a cURL command like this:

```bash
curl -H 'Accept: image/jpeg' -H 'Content-Type: image/jpeg' \
  --data-binary @./samples/images/easy1.jpg \
  https://signature-extractor-local.voteamerica.io/extract_signature \
  > ./samples/images/easy1.out.jpg
```

Run `cd frontend && yarn start` to run the frontend locally. It'll point to the
"local" environment (the one you can deploy to with `yarn sls deploy`). Right
now, there's no way to run the frontend and have it talk to your local
backend code

### To Development / esign-demo.voteamerica.com

To deploy to development, just merge to master. Travis will run
`yarn sls deploy -s dev` to deploy to the dev environment. It will also deploy
the frontend to esign-demo.voteamerica.com.

### To Production

Cut a release (git tag) with a name that matches `v[0-9.]+`, e.g. `v1.2.3`.
Travis will run `yarn sls deploy -s prod` to deploy to the prod environment.

### Deployment IAM Policy

For CI, there's a policy in `deployment-policy.json` that contains the permissions
needed to deploy this function and the frontend. It's based on
https://github.com/dancrumb/generator-serverless-policy

### Deployment URLS

You can find the URLs of the deployed endpoints for local and development
in `frontend/.env.development` (for local) and `frontend/.env.production` (for
development) -- the frontend development/production actually map to the backend
local/development.

The production backend is fronted by Cloudflare, and won't accept direct
requests. The public URLs are:

mms endpoints: https://signature-extractor.voteamerica.com/mms/init|check
extract_signature: https://signature-extractor.voteamerica.com/extract_signature
twilio callback: https://signature-extractor.voteamerica.com/twilio_mms
phone number: (415) 704-7705
