# Experiments

These are various work-in-progress experiments that didn't work out.

- `autocrop`: A smarter auto-cropper than the one in the actual `crop.py` that
  might be able to identify rectangular pages and automatically segment them so
  the user could take a photo of a whole sheet of paper.

- `components`: Based on https://github.com/ahmetozlu/signature_extractor -- an
  algorithm to separate signatures from other text and marks by analysing
  connected components. This was promising and worked -- it was
  good at removing extraneous marks from the page. But it tended to remove
  things like the dots from i's and other real data from the signature. In
  addition, if not tuned correctly it would remove whole chunks of the signature
  which would be very confusing to the user and hard for them to figure out
  what was going wrong and correct it.

- `extract_page`: Based on https://github.com/vzat/signature_extractor -- an
  algorithm to identify a page in an image and segment it out. This could allow
  us to process pictures of whole pieces of paper rather than just already-
  cropped photos.

- `remove_lines`: A number of different algorithms to try and remove ruled lines
  so we could handle a signature on lined paper.
