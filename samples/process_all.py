import glob
import os
import sys
from multiprocessing import Pool

import cv2

from extractor.extract import extract_signature, qualify_signature

DEBUG = os.environ.get("DEBUG") == "1"

RESIZE = os.environ.get("RESIZE")
if RESIZE:
    RESIZE = tuple([int(d) for d in RESIZE.split("x")])

BW = os.environ.get("BW") == "1"


def process_file(name: str):
    print(name)
    img = cv2.imread(name, cv2.IMREAD_COLOR + cv2.IMREAD_IGNORE_ORIENTATION)

    basename, ext = os.path.splitext(name)
    outname = basename + ".out" + ext

    outimg = extract_signature(img, final_size=RESIZE, bw=BW, enable_debug=DEBUG)
    cv2.imwrite(outname, outimg)
    warnings = qualify_signature(outimg, bw=BW, enable_debug=DEBUG)
    if warnings:
        print(f"{name}: {warnings}")


def main():
    files = sys.argv[1:]

    if DEBUG:
        for file in files:
            process_file(file)
    else:
        Pool(8).map(process_file, files, chunksize=1)


main()
