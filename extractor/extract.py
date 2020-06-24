import cv2
import numpy as np

from .crop import autocrop, resize_fixed_aspect
from .debug import Debug
from .params import BW_THRESHOLD_BLOCK_SIZE, BW_THRESHOLD_CONSTANT_TOWARDS_WHITE
from .preprocess import resize_and_recolor
from .threshold import threshold


def extract_signature(
    img: np.ndarray, enable_debug=False, final_size=None, bw=False
) -> np.ndarray:
    """
    Extracts a clean signature from a photo of a signature.
    """
    debug = Debug(enabled=enable_debug)

    img = resize_and_recolor(img, debug=debug)
    img = threshold(img, debug=debug)
    img = autocrop(img, debug=debug)
    if final_size:
        img = resize_fixed_aspect(img, final_size=final_size, debug=debug)
    if bw:
        img = cv2.adaptiveThreshold(
            img,
            255,
            cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY,
            BW_THRESHOLD_BLOCK_SIZE,
            BW_THRESHOLD_CONSTANT_TOWARDS_WHITE,
        )

    return img
