export function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

export function blobToArrayBuffer(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(blob);
  });
}

export function dataURLToBlob(dataURL) {
  // Based on: https://stackoverflow.com/a/12300351


  // convert base64 to raw binary data held in a string and parse out the
  // MIME type
  const [metadata, data] = dataURL.split(',');

  const byteString = atob(data);
  const mimeString = metadata.split(':')[1].split(';')[0]

  // Convert the data string to an ArrayBuffer
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
  }

  // Convert to a blob
  return new Blob([arrayBuffer], {type: mimeString});
}
