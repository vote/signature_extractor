import cv2
import numpy as np
from typing import List

from .crop import autocrop, resize_fixed_aspect
from .debug import Debug
from .params import BW_THRESHOLD
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
        _, img = cv2.threshold(img, BW_THRESHOLD, 255, cv2.THRESH_BINARY)

    return img


def qualify_signature(img: np.ndarray, bw=False, enable_debug=False) -> List[str]:
    """
    Performs some post-checks on an extracted signature and returns a list of flags or warnings (strings)
    """
    result = []

    # PA wants > 2% and < 90% black pixels
    if bw:
        white = float(cv2.countNonZero(img)) / float(img.shape[0] * img.shape[1])
        if white <= 0.1:
            result.append("PA_TOO_MANY_BLACK_PIXELS")
        elif white >= 0.98:
            result.append("PA_TOO_FEW_BLACK_PIXELS")

    return result
