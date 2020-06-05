import cv2
import numpy as np


class Debug:
    def __init__(self, enabled=False):
        self.enabled = enabled

    def show(self, winname: str, img: np.ndarray):
        if not self.enabled:
            return

        cv2.imshow(winname, img)
        cv2.moveWindow(winname, 500, 0)
        cv2.waitKey(0)
        cv2.destroyWindow(winname)
