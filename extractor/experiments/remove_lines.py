import cv2
import numpy as np

from skimage import img_as_ubyte, measure, morphology
from skimage.color import label2rgb
from skimage.measure import regionprops


def show_wait_destroy(winname, img):
    cv2.imshow(winname, img)
    cv2.moveWindow(winname, 500, 0)
    cv2.waitKey(0)
    cv2.destroyWindow(winname)


def remove_lines(img):
    # From: https://docs.opencv.org/master/dd/dd7/tutorial_morph_lines_detection.html
    #

    # [init]
    # Create the images that will use to extract the horizontal and vertical lines
    horizontal = np.copy(img)
    vertical = np.copy(img)
    # [init]
    # [horiz]
    # Specify size on horizontal axis
    cols = horizontal.shape[1]
    horizontal_size = cols // 50
    # Create structure element for extracting horizontal lines through morphology operations
    horizontalStructure = cv2.getStructuringElement(
        cv2.MORPH_RECT, (horizontal_size, 1)
    )
    # Apply morphology operations
    horizontal = cv2.erode(horizontal, horizontalStructure)
    horizontal = cv2.dilate(horizontal, horizontalStructure)
    # Show extracted horizontal lines
    show_wait_destroy("horizontal", horizontal)
    # [horiz]
    # [vert]
    # Specify size on vertical axis
    rows = vertical.shape[0]
    verticalsize = rows // 50
    # Create structure element for extracting vertical lines through morphology operations
    verticalStructure = cv2.getStructuringElement(cv2.MORPH_RECT, (1, verticalsize))
    # Apply morphology operations
    vertical = cv2.erode(vertical, verticalStructure)
    vertical = cv2.dilate(vertical, verticalStructure)
    # Show extracted vertical lines
    show_wait_destroy("vertical", vertical)
    # [vert]
    # [smooth]
    # Inverse vertical image
    vertical = cv2.bitwise_not(vertical)
    show_wait_destroy("vertical_bit", vertical)
    """
    Extract edges and smooth image according to the logic
    1. extract edges
    2. dilate(edges)
    3. src.copyTo(smooth)
    4. blur smooth img
    5. smooth.copyTo(src, edges)
    """
    # Step 1
    edges = cv2.adaptiveThreshold(
        vertical, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 3, -2
    )
    show_wait_destroy("edges", edges)
    # Step 2
    kernel = np.ones((2, 2), np.uint8)
    edges = cv2.dilate(edges, kernel)
    show_wait_destroy("dilate", edges)
    # Step 3
    smooth = np.copy(vertical)
    # Step 4
    smooth = cv2.blur(smooth, (2, 2))
    # Step 5
    (rows, cols) = np.where(edges != 0)
    vertical[rows, cols] = smooth[rows, cols]
    # Show final result
    show_wait_destroy("smooth - final", vertical)
    return vertical


def remove_lines_2(img):
    kernel = np.ones((10, 10), np.uint8)
    return cv2.dilate(img, kernel, iterations=1)


def remove_lines_3(img):
    # From: https://answers.opencv.org/question/194086/line-and-square-removal-using-getstructuringelement-and-morphologyex/
    gray = img
    edges = cv2.Canny(gray, 15, 50, apertureSize=3)
    edges = cv2.GaussianBlur(edges, (15, 15), 3)
    minLineLength = 150
    lines = cv2.HoughLinesP(
        image=edges,
        rho=1,
        theta=np.pi / 180,
        threshold=300,
        lines=np.array([]),
        minLineLength=minLineLength,
        maxLineGap=20,
    )
    print(lines)

    a, b, c = lines.shape
    for i in range(a):
        x = lines[i][0][0] - lines[i][0][2]
        y = lines[i][0][1] - lines[i][0][3]
        # if x!= 0:
        #     if abs(y/x) <1:
        #         print('YES')
        cv2.line(
            gray,
            (lines[i][0][0], lines[i][0][1]),
            (lines[i][0][2], lines[i][0][3]),
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

    se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    return cv2.morphologyEx(gray, cv2.MORPH_CLOSE, se)


def remove_lines_4(image):
    # From: https://stackoverflow.com/questions/57961119/how-to-remove-all-the-detected-lines-from-the-original-image-using-python

    gray = image
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    # Remove horizontal
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
    detected_lines = cv2.morphologyEx(
        thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2
    )
    cnts = cv2.findContours(detected_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    for c in cnts:
        cv2.drawContours(image, [c], -1, (255, 255, 255), 2)

    # Repair image
    repair_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 6))
    return 255 - cv2.morphologyEx(
        255 - image, cv2.MORPH_CLOSE, repair_kernel, iterations=1
    )


def remove_lines_5(img):
    fld = cv2.ximgproc.createFastLineDetector()
    lines = fld.detect(img)

    return fld.drawSegments(img, lines)
