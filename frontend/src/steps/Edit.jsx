import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo } from '@fortawesome/free-solid-svg-icons';

import { trackEvent } from '../instrumentation';

const CropWrapper = styled.div`
  width: 100%;
  max-height: 50vh;
  margin: 0 auto 20px;

  .cropper-view-box {
    outline: 3px solid white;
  }

  .cropper-point {
    width: 10px;
    height: 10px;
    background-color: white;
  }

  .cropper-point.point-se {
    width: 20px;
    height: 20px;
    right: -12px;
    bottom: -12px;
  }

  .cropper-point.point-e {
    right: -6px;
  }

  .cropper-point.point-ne {
    right: -6px;
    top: -6px;
  }

  .cropper-point.point-n {
    top: -6px;
  }

  .cropper-point.point-nw {
    top: -6px;
    left: -6px;
  }

  .cropper-point.point-w {
    left: -6px;
  }

  .cropper-point.point-sw {
    left: -6px;
    bottom: -6px;
  }

  .cropper-point.point-s {
    bottom: -6px;
  }

  .cropper-line,
  .cropper-dashed {
    display: none;
  }
`;

const RotationButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

function cropPhoto(cropper) {
  trackEvent({
    evt: 'signature-cropped',
    category: 'Signature',
    data: cropper.getData(),
  });

  const canvas = cropper.getCroppedCanvas();

  return new Promise((resolve, reject) => {
    const callback = (blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }

      resolve(blob);
    };

    if (canvas.toBlob) {
      canvas.toBlob(callback, 'image/jpeg');
    } else if (canvas.msToBlob) {
      callback(canvas.msToBlob());
    } else {
      reject(new Error('No toBlob support'));
    }
  });
}

export default function Edit({ capturedPhoto, onNext, onPrevious }) {
  const cropperRef = useRef(null);
  const imgRef = useRef(null);
  useEffect(() => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
    }

    cropperRef.current = new Cropper(imgRef.current, {
      initialAspectRatio: 3,
    });
  }, [capturedPhoto]);

  return (
    <>
      <h1>Crop Photo</h1>
      <p>Drag to crop the photo to just your signature.</p>
      <RotationButtons>
        <button onClick={() => cropperRef.current.rotate(-90)}>
          <FontAwesomeIcon icon={faUndo} />
        </button>
        <button onClick={() => cropperRef.current.rotate(90)}>
          <FontAwesomeIcon icon={faUndo} flip="horizontal" />
        </button>
      </RotationButtons>
      <CropWrapper>
        <img src={capturedPhoto} alt="" ref={imgRef} />
      </CropWrapper>
      <button onClick={async () => onNext(await cropPhoto(cropperRef.current))}>
        Continue &raquo;
      </button>
      <button onClick={onPrevious}>&laquo; Back</button>
    </>
  );
}
