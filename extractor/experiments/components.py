import cv2
import numpy as np

from skimage import img_as_ubyte, measure, morphology
from skimage.color import label2rgb
from skimage.measure import regionprops

# Connected component analysis parameters. These parameters control the second
# pass of the algorithm, which on the black/white thresholded image and tries
# to separate out the signature from any noise or small marks by finding
# connected components and removing small marks.

# Minimum size for something to be considered a connected component
CONNECTED_COMPONENTS_MIN_SIZE = 0

# Threshold values for which connected components to remove
CONNECTED_COMPONENTS_SMALL_RATIO = 0.25
CONNECTED_COMPONENTS_SMALL_MIN = 0

FINAL_BLUR = 5


def remove_small_components(img: np.ndarray) -> np.ndarray:
    # connected component analysis by scikit-learn framework
    blobs = img > img.mean()
    blobs_labels = measure.label(blobs, background=1)
    image_label_overlay = label2rgb(blobs_labels, image=img)

    total_area = 0
    counter = 0
    for region in regionprops(blobs_labels):
        if region.area > CONNECTED_COMPONENTS_MIN_SIZE:
            total_area = total_area + region.area
            counter = counter + 1

    average = total_area / counter

    # experimental-based ratio calculation, modify it for your cases
    # a4_constant is used as a threshold value to remove connected pixels
    # are smaller than a4_constant for A4 size scanned documents
    a4_constant = (
        average * CONNECTED_COMPONENTS_SMALL_RATIO + CONNECTED_COMPONENTS_SMALL_MIN
    )

    # remove the connected pixels are smaller than a4_constant
    print(counter)
    if counter <= 1:
        return img

    img = morphology.remove_small_objects(blobs_labels, a4_constant)
    img = cv2.threshold(
        img_as_ubyte(img), 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU
    )[1]
    return cv2.GaussianBlur(img, (FINAL_BLUR, FINAL_BLUR), 0)
