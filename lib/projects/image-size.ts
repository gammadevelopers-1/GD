export type ImageSize = { width: number; height: number };

function readPng(view: DataView): ImageSize | null {
  if (view.byteLength < 24) return null;
  if (view.getUint32(0) !== 0x89504e47) return null;
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readJpeg(view: DataView): ImageSize | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = view.getUint8(offset + 1);
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return null;

    const isFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isFrame) {
      return {
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }

    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function readWebp(view: DataView): ImageSize | null {
  if (view.byteLength < 30) return null;
  if (view.getUint32(0) !== 0x52494646) return null;
  if (view.getUint32(8) !== 0x57454250) return null;

  const format = view.getUint32(12);

  if (format === 0x56503820) {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }

  if (format === 0x5650384c) {
    const bits =
      view.getUint8(21) |
      (view.getUint8(22) << 8) |
      (view.getUint8(23) << 16) |
      (view.getUint8(24) << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (format === 0x56503858) {
    return {
      width:
        (view.getUint8(24) |
          (view.getUint8(25) << 8) |
          (view.getUint8(26) << 16)) +
        1,
      height:
        (view.getUint8(27) |
          (view.getUint8(28) << 8) |
          (view.getUint8(29) << 16)) +
        1,
    };
  }

  return null;
}

export function readImageSize(bytes: ArrayBuffer): ImageSize | null {
  const view = new DataView(bytes);
  const size = readPng(view) ?? readJpeg(view) ?? readWebp(view);
  if (!size) return null;
  if (!size.width || !size.height) return null;
  return size;
}
