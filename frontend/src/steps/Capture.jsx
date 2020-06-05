import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import styled from 'styled-components';
import { dataURLToBlob, blobToDataURL } from '../blobUtil';
import { preprocessImage } from '../preprocessImage';
import { trackEvent } from '../instrumentation';

const WebcamWrapper = styled.div`
  position: relative;
  text-align: center;
`;

const CaptureButton = styled.button`
  position: absolute;
  bottom: 20px;
  left: 50%;
  width: 150px;
  margin-left: -75px;
`;

const BackButton = styled.button`
  margin-top: 40px;
`;

const RedLine = styled.div`
  position: absolute;
  bottom: calc(50% - 2px);
  height: 4px;
  width: calc(100% + 20px);
  margin-left: -10px;
  background-color: red;
`;

export default function Capture({ onNext, onPrevious }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webcamRef = useRef(null);

  async function onCapture() {
    trackEvent({
      evt: 'capture-button-clicked',
      category: 'Capture',
    });

    const blob = await dataURLToBlob(webcamRef.current.getScreenshot());
    const dataURL = await blobToDataURL(await preprocessImage(blob));
    onNext(dataURL);
  }

  function renderState() {
    if (error) {
      return (
        <p>
          Sorry, we couldn't access your camera. Please allow access or try a
          different option for submitting your signature.
        </p>
      );
    }

    if (loading) {
      return <p>Loading (please allow camera access)...</p>;
    }

    return (
      <>
        <RedLine />
        <CaptureButton onClick={onCapture}>Capture</CaptureButton>
      </>
    );
  }

  return (
    <>
      <h1>Take A Photo</h1>
      <p>
        Take a photo of your signature on a plain white background. Make sure
        your signature fill up as much of the photo as you can, and line it up
        with the red line.
      </p>
      <WebcamWrapper>
        <Webcam
          audio={false}
          forceScreenshotSourceSize={true}
          screenshotFormat={'image/jpeg'}
          videoConstraints={{ facingMode: 'environment' }}
          style={{
            width: '100%',
            maxWidth: '720px',
            maxHeight: '80vh',
          }}
          ref={webcamRef}
          onUserMedia={() => {
            setLoading(false);
          }}
          onUserMediaError={(err) => {
            console.error(err);

            setLoading(false);
            setError(true);
          }}
        />

        {renderState()}
      </WebcamWrapper>
      <BackButton onClick={onPrevious}>&laquo; Back</BackButton>
    </>
  );
}
