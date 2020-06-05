import { blobToArrayBuffer, blobToDataURL, dataURLToBlob } from './blobUtil';

// We pre-scale the image down to this width. This is bigger than the width
// we scale to server-side because this happens *before* cropping for
// performance on mobile devices.
const MAX_WIDTH = 2400;

/**
 * Source: https://github.com/mshibl/Exif-Stripper/blob/master/exif-stripper.js
 */
function removeExifFromBuffer(imageArrayBuffer, dv) {
  var offset = 0,
    recess = 0;
  var pieces = [];
  var i = 0;
  if (dv.getUint16(offset) === 0xffd8) {
    offset += 2;
    var app1 = dv.getUint16(offset);
    offset += 2;
    while (offset < dv.byteLength) {
      if (app1 === 0xffe1) {
        pieces[i] = { recess: recess, offset: offset - 2 };
        recess = offset + dv.getUint16(offset);
        i++;
      } else if (app1 === 0xffda) {
        break;
      }
      offset += dv.getUint16(offset);
      app1 = dv.getUint16(offset);
      offset += 2;
    }
    if (pieces.length > 0) {
      var newPieces = [];
      pieces.forEach(function (v) {
        newPieces.push(imageArrayBuffer.slice(v.recess, v.offset));
      }, this);
      newPieces.push(imageArrayBuffer.slice(recess));
      return new Blob(newPieces, { type: 'image/jpeg' });
    }
  }
}

async function stripExif(blob) {
  if (blob.type !== 'image/jpeg') {
    return blob;
  }

  const imageArrayBuffer = await blobToArrayBuffer(blob);
  const dv = new DataView(imageArrayBuffer);

  const strippedExif = removeExifFromBuffer(imageArrayBuffer, dv);

  return strippedExif || blob;
}

async function resizeImage(blob) {
  const image = new Image();
  image.src = await blobToDataURL(blob);

  await new Promise((resolve) => (image.onload = resolve));

  const naturalWidth = image.width;
  const naturalHeight = image.height;

  const autoRotate = naturalWidth < naturalHeight;

  const rotatedWidth = autoRotate ? naturalHeight : naturalWidth;
  const rotatedHeight = autoRotate ? naturalWidth : naturalHeight;

  const scaledWidth = Math.min(MAX_WIDTH, rotatedWidth);
  const scaledHeight = (scaledWidth / rotatedWidth) * rotatedHeight;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  if (autoRotate) {
    ctx.translate(scaledHeight / 2, scaledHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(
      image,
      -scaledHeight / 2,
      -scaledHeight / 2,
      scaledHeight,
      scaledWidth,
    );
  } else {
    ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
  }

  return dataURLToBlob(canvas.toDataURL('image/jpeg', 70));
}

export async function preprocessImage(blob) {
  return resizeImage(await stripExif(blob));
}
