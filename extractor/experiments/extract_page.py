import cv2
import numpy as np


def extract_page(img):
    imgSize = np.shape(img)

    gImg = img

    threshold, _ = cv2.threshold(
        src=gImg, thresh=0, maxval=255, type=cv2.THRESH_BINARY | cv2.THRESH_OTSU
    )
    cannyImg = cv2.Canny(image=gImg, threshold1=0.5 * threshold, threshold2=threshold)
    return cannyImg

    # findContours() is a distructive function so a copy is passed as a parameter
    contours, _ = cv2.findContours(
        image=cannyImg.copy(), mode=cv2.RETR_TREE, method=cv2.CHAIN_APPROX_SIMPLE
    )

    if len(contours) == 0:
        print("Warning: No Page Found")
        return img

    maxRect = {"x": 0, "y": 0, "w": 0, "h": 0}
    coordinates = []
    for contour in contours:
        # Perimeter accuracy
        arcPercentage = 0.1

        # Contour Perimeter
        epsilon = cv2.arcLength(curve=contour, closed=True) * arcPercentage
        corners = cv2.approxPolyDP(curve=contour, epsilon=epsilon, closed=True)
        x, y, w, h = cv2.boundingRect(array=corners)
        currentArea = w * h

        if len(corners) == 4:
            coordinates.append((x, y))
            if currentArea > maxRect["w"] * maxRect["h"]:
                maxRect["x"] = x
                maxRect["y"] = y
                maxRect["w"] = w
                maxRect["h"] = h

    if maxRect["w"] <= 1 or maxRect["h"] <= 1:
        print("Warning: No Page Found")
        return img

    contoursInPage = 0
    for coordinate in coordinates:
        x = coordinate[0]
        y = coordinate[1]
        if (x > maxRect["x"] and x < maxRect["x"] + maxRect["w"]) and (
            y > maxRect["y"] and y < maxRect["y"] + maxRect["h"]
        ):
            contoursInPage += 1

    if contoursInPage <= 0:
        print("Warning: No Page Found")
        return img

    return img[
        maxRect["y"] : maxRect["y"] + maxRect["h"],
        maxRect["x"] : maxRect["x"] + maxRect["w"],
    ]
