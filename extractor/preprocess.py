import cv2
import numpy as np

from .debug import Debug
from .params import RESIZE_TO_WIDTH


def resize_and_recolor(img: np.ndarray, debug: Debug) -> np.ndarray:
    """
    Resizes an image and converts it to grayscale, which is a prerequisite for
    all of our other processing.
    """

    # Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    debug.show("Grayscale", gray)

    # Resize
    width = RESIZE_TO_WIDTH
    height = int(gray.shape[0] * (width / gray.shape[1]))

    resized = cv2.resize(gray, (width, height), interpolation=cv2.INTER_LINEAR)
    debug.show("Resize", resized)

    return resized
