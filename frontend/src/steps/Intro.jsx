import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { blobToDataURL } from '../blobUtil';
import { preprocessImage } from '../preprocessImage';
import { trackEvent } from '../instrumentation';

function browserHasCamera() {
  // Based on: https://stackoverflow.com/a/53926969
  const md = navigator.mediaDevices;

  if (!md || !md.enumerateDevices) {
    return Promise.resolve(false);
  }

  return md
    .enumerateDevices()
    .then((devices) => devices.some((device) => 'videoinput' === device.kind));
}

export default function Intro({ onNext, onUpload, onPickMMS }) {
  const [hasCamera, setHasCamera] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    browserHasCamera().then(setHasCamera);
  }, []);

  function handleUploadButton() {
    fileInputRef.current.click();
  }

  async function handleUpload(evt) {
    const file = document.querySelector('input[type=file]').files[0];
    if (!file) {
      return;
    }

    const dataURL = await blobToDataURL(await preprocessImage(file));

    trackEvent({
      evt: 'select-signature-type',
      category: 'Signature',
      label: 'upload',
    });

    onUpload(dataURL);
  }

  return (
    <>
      <h1>Electronically sign your form</h1>
      <p>
        To sign your form electronically, you need to take a picture of your
        signature.
      </p>
      <p>
        Sign a <strong>plain white</strong> piece of paper. Don't use lined
        paper.
      </p>
      <p>
        If you don't have a plain white piece of paper, you can use the back of
        an envelope.
      </p>
      {hasCamera == null ? (
        <p>Loading...</p>
      ) : (
        <>
          <div>
            {hasCamera && (
              <button
                onClick={() => {
                  trackEvent({
                    evt: 'select-signature-type',
                    category: 'Signature',
                    label: 'capture',
                  });
                  onNext();
                }}
              >
                Take A Photo &raquo;
              </button>
            )}

            <button onClick={handleUploadButton}>Upload A Photo &raquo;</button>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleUpload}
            />

            <button
              onClick={() => {
                trackEvent({
                  evt: 'select-signature-type',
                  category: 'Signature',
                  label: 'text',
                });

                onPickMMS();
              }}
            >
              Text A Photo &raquo;
            </button>
          </div>
        </>
      )}
    </>
  );
}
