import glob
import os
import sys

import cv2
import numpy as np

from .debug import Debug
from .params import CROP_CONTOUR_THRESHOLD


def autocrop(img, debug: Debug):
    """
    Automatically crops the white background out of an image
    """

    # Convert to pure black/white. Invert so that the background is black and
    # the foreground is white.
    _, thresh = cv2.threshold(cv2.bitwise_not(img), 1, 255, cv2.THRESH_BINARY)

    # Find all shapes and filter out small ones
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    bboxes = [cv2.boundingRect(contour) for contour in contours]
    bboxes_large = [
        bbox for bbox in bboxes if bbox[2] * bbox[3] > CROP_CONTOUR_THRESHOLD
    ]

    # No shapes? Bail.
    if len(bboxes_large) < 1:
        return img

    # Find the combined bounding box of all the shapes
    x0, y0, w, h = bboxes_large[0]
    x1 = x0 + w
    y1 = y0 + h

    for x, y, w, h in bboxes_large[1:]:
        x0 = min(x0, x)
        x1 = max(x1, x + w)
        y0 = min(y0, y)
        y1 = max(y1, y + h)

    cropped = img[y0:y1, x0:x1]
    debug.show("Cropped", cropped)

    return cropped


def resize_fixed_aspect(img, final_size, debug: Debug):
    (h, w) = img.shape[0:2]
    target_w, target_h = final_size

    # Resize
    aspect_ratio = float(w) / float(h)
    target_ratio = float(target_w) / float(target_h)
    if aspect_ratio >= target_ratio:
        nw = target_w
        nh = int(h * (target_w / w))
    else:
        nw = int(w * (target_h / h))
        nh = target_h
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)

    # Pad right/bottom with white
    if nw < target_w:
        final = cv2.copyMakeBorder(
            resized, 0, 0, 0, target_w - nw, cv2.BORDER_CONSTANT, value=[255, 255, 255]
        )
    elif nh < target_h:
        final = cv2.copyMakeBorder(
            resized, 0, target_h - nh, 0, 0, cv2.BORDER_CONSTANT, value=[255, 255, 255]
        )
    else:
        final = resized

    return final
