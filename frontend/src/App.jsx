import React, { useState } from 'react';
import styled from 'styled-components';

import Intro from './steps/Intro';
import Capture from './steps/Capture';
import Edit from './steps/Edit';
import ProcessImage from './steps/ProcessImage';
import Approve from './steps/Approve';
import Final from './steps/Final';
import MMS from './steps/MMS';
import Hello from './steps/Hello';

const AppContainer = styled.div`
  width: 90%;
  max-width: 800px;
  padding: 40px 0;
  margin: 0 auto;
`;

const STEPS = {
  HELLO: 0,
  INTRO: 1,
  CAPTURE: 2,
  MMS: 3,
  EDIT: 4,
  PROCESS_IMAGE: 5,
  APPROVE: 6,
  FINAL: 7,
};

function App() {
  // We store all of our app state here. We sync it to/from the URL and
  // localStorage for easier development (we don't lose any state when React
  // reloads the page)
  const [stepStack, setStepStack] = useState([]);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [editedPhotoBlob, setEditedPhotoBlob] = useState(null);
  const [processedPhotoBlob, setProcessedPhotoBlob] = useState(null);

  function getCurrentStep() {
    if (stepStack.length === 0) {
      return STEPS.HELLO;
    }

    return stepStack[stepStack.length - 1];
  }

  function goToStep(step) {
    setStepStack([...stepStack, step]);
  }

  function goBackStep() {
    setStepStack(stepStack.slice(0, stepStack.length - 1));
  }

  function renderStep() {
    switch (getCurrentStep()) {
      case STEPS.HELLO:
        return <Hello onNext={() => goToStep(STEPS.INTRO)} />;
      case STEPS.INTRO:
        return (
          <Intro
            onNext={() => goToStep(STEPS.CAPTURE)}
            onUpload={(photo) => {
              setCapturedPhoto(photo);
              goToStep(STEPS.EDIT);
            }}
            onPickMMS={() => goToStep(STEPS.MMS)}
          />
        );
      case STEPS.CAPTURE:
        return (
          <Capture
            onNext={(photo) => {
              setCapturedPhoto(photo);
              goToStep(STEPS.EDIT);
            }}
            onPrevious={goBackStep}
          />
        );
      case STEPS.MMS:
        return (
          <MMS
            onReceivePhoto={(photo) => {
              setCapturedPhoto(photo);
              goToStep(STEPS.EDIT);
            }}
            onPrevious={goBackStep}
          />
        );
      case STEPS.EDIT:
        return (
          <Edit
            capturedPhoto={capturedPhoto}
            onNext={(photo) => {
              setEditedPhotoBlob(photo);
              goToStep(STEPS.PROCESS_IMAGE);
            }}
            onPrevious={goBackStep}
          />
        );
      case STEPS.PROCESS_IMAGE:
        return (
          <ProcessImage
            editedPhotoBlob={editedPhotoBlob}
            onComplete={(blob) => {
              setProcessedPhotoBlob(blob);
              goToStep(STEPS.APPROVE);
            }}
            onCancel={goBackStep}
          />
        );
      case STEPS.APPROVE:
        return (
          <Approve
            processedPhotoBlob={processedPhotoBlob}
            onAccept={() => {
              goToStep(STEPS.FINAL);
            }}
            onRetry={() => {
              setCapturedPhoto(null);
              setEditedPhotoBlob(null);
              setProcessedPhotoBlob(null);
              setStepStack([STEPS.INTRO]);
            }}
          />
        );
      case STEPS.FINAL:
        return (
          <Final
            onRestart={() => {
              setCapturedPhoto(null);
              setEditedPhotoBlob(null);
              setProcessedPhotoBlob(null);
              setStepStack([STEPS.INTRO]);
            }}
          />
        );
      default:
        throw new Error('Invalid state');
    }
  }

  return <AppContainer>{renderStep()}</AppContainer>;
}

export default App;
