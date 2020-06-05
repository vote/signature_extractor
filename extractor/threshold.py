import cv2
import numpy as np

from .debug import Debug
from .params import (
    DENOISE_STRENGTH,
    INITIAL_BLUR,
    POST_THRESHOLD_BLUR,
    THRESHOLD_BLOCK_SIZE,
    THRESHOLD_CONSTANT_TOWARDS_WHITE,
)


def threshold(img: np.ndarray, debug: Debug) -> np.ndarray:
    """
    Converts an image to black and white, using gaussian adaptive thresholding
    and removing noise.
    """
    img = cv2.GaussianBlur(img, (INITIAL_BLUR, INITIAL_BLUR), 0)
    debug.show("Blur 1", img)

    img = cv2.fastNlMeansDenoising(img, None, DENOISE_STRENGTH)
    debug.show("Denoise", img)

    img = cv2.adaptiveThreshold(
        img,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        THRESHOLD_BLOCK_SIZE,
        THRESHOLD_CONSTANT_TOWARDS_WHITE,
    )
    debug.show("Threshold", img)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    img = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)
    debug.show("Opened", img)

    img = cv2.GaussianBlur(img, (POST_THRESHOLD_BLUR, POST_THRESHOLD_BLUR), 0)
    debug.show("Blur 2", img)

    return img
