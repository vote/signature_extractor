import React, { useState, useEffect } from 'react';
import { trackError, addContext, trackEvent } from '../instrumentation';

export default function ProcessImage({
  editedPhotoBlob,
  onComplete,
  onCancel,
}) {
  const [processedImageBlob, setProcessedImageBlob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;
    setError(null);

    (async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE}/extract_signature`,
        {
          method: 'POST',
          body: editedPhotoBlob,
          headers: new Headers({
            'Content-Type': editedPhotoBlob.type || 'image/jpeg',
            Accept: 'image/jpeg',
          }),
        },
      );

      const blob = await response.blob();

      if (canceled) {
        return;
      }

      const uuid = response.headers.get('X-VoteAmerica-Signature-UUID');
      addContext('signatureUUID', uuid);
      trackEvent({
        evt: 'signature-processed',
        category: 'Signature',
        data: { uuid },
      });

      setProcessedImageBlob(blob);
    })().catch((e) => {
      if (canceled) {
        return;
      }

      trackError(e);

      setError('Error processing image. Please try again.');
    });

    return () => {
      canceled = true;
    };
  }, [editedPhotoBlob]);

  useEffect(() => {
    if (processedImageBlob) {
      setProcessedImageBlob(null);
      onComplete(processedImageBlob);
    }
  }, [processedImageBlob, onComplete]);

  return (
    <>
      <h1>Processing Image</h1>
      <p>
        We're processing your photo. This shouldn't take more than a few
        seconds.
      </p>
      {error && <p>{error}</p>}
      <button onClick={onCancel}>&laquo; Go Back</button>
    </>
  );
}
