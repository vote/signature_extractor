# We resize all images to this width (preserving aspect ratio) to give more
# consistent results rather than having to scale all of our parameters to match
# the input image size.
RESIZE_TO_WIDTH = 1200


# We apply gaussian blurs throughout the process to smooth the image and reduce
# the impact of noise and small marks. Higher values can improve the performance
# of signature segmentation, but can also make the final output look blurry.
#
# These parameters should be odd positive integers.

# Intial blur. Improves the performance of white/black thesholding by reducing
# the impact of noise and small marks on the adaptive thresholding algorithm.
INITIAL_BLUR = 3

# Blur after applying white/black thresholding. In combination with the
# noise reduction algorithm applied, helps remove small artifacts that are
# incorrectly thresholded to black.
POST_THRESHOLD_BLUR = 5


# Black/white thresholding parameters.
# These parameters control the first pass of the algorithm, which is to convert
# the image to black and white.

# How much noise to remove with fastNlMeansDenoising. A higher value will remove
# more noise but can also remove real parts of the signature.
#
# This value should be a positive integer.
DENOISE_STRENGTH = 11

# Block size is how much of the image to examine while determining the adaptive
# threshold -- a larger value will look at a bigger area around the pixel when
# determining the threshold for that pixel. A larger value will give a smoother
# threshold: less sensitive to small marks or inconsistencies (which is good),
# but also less sensitive to changes in lighting or sharp lines created by
# shadows (which is bad).
#
# This parameter should be an odd positive integer.
THRESHOLD_BLOCK_SIZE = 101

# A constant used during adaptive thresholding for how much to bias the
# threshold towards white. Increasing the value will remove more of the
# background, but a value that is too high will remove lighter parts of the
# signature.
THRESHOLD_CONSTANT_TOWARDS_WHITE = 10

# When cropping the final result, ignore contours smaller than this area
CROP_CONTOUR_THRESHOLD = 2500

# Optional B&W conversion: block size (size of area around pixel to examine)
# and constant.
BW_THRESHOLD_BLOCK_SIZE = 101
BW_THRESHOLD_CONSTANT_TOWARDS_WHITE = 10
