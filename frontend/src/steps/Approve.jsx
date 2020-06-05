import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { trackEvent, trackError } from '../instrumentation';

const CapturedImage = styled.img`
  width: 100%;
  maxwidth: 720px;
  maxheight: 80vh;
`;

export default function Approve({ processedPhotoBlob, onAccept, onRetry }) {
  const [objectURL, setObjectURL] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(processedPhotoBlob);
    setObjectURL(url);

    return () => URL.revokeObjectURL(url);
  }, [processedPhotoBlob]);

  if (!objectURL) {
    return null;
  }

  return (
    <>
      <h1>Review Signature</h1>
      <p>Does your signature look OK?</p>
      <CapturedImage src={objectURL} />
      <button
        onClick={() => {
          trackEvent({
            evt: 'finished-looks-good',
            category: 'Signature',
          });
          onAccept();
        }}
      >
        Yes, Looks Good &raquo;
      </button>
      <button
        onClick={() => {
          trackEvent({
            evt: 'finished-failure-try-again',
            category: 'Signature',
          });
          trackError(new Error('User Rejected Signature'));
          onRetry();
        }}
      >
        No, Start Over
      </button>
    </>
  );
}
