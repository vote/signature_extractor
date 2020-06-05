import cv2
import numpy as np

from .crop import autocrop
from .debug import Debug
from .preprocess import resize_and_recolor
from .threshold import threshold


def extract_signature(img: np.ndarray, enable_debug=False) -> np.ndarray:
    """
    Extracts a clean signature from a photo of a signature.
    """
    debug = Debug(enabled=enable_debug)

    img = resize_and_recolor(img, debug=debug)
    img = threshold(img, debug=debug)
    img = autocrop(img, debug=debug)
    return img
