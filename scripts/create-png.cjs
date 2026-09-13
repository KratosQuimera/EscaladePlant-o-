const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Criação de PNG válido nativamente sem dependências externas
function createPng(width, height, getPixel) {
  // getPixel(x, y) -> [r, g, b, a]
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    // CRC32 calculation
    const crc = calcCrc(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdr = chunk('IHDR', ihdrData);

  // IDAT
  const idat = chunk('IDAT', compressed);

  // IEND
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Tabela CRC32
let crcTable = null;
function makeCrcTable() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

function calcCrc(buf) {
  if (!crcTable) crcTable = makeCrcTable();
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function drawHospitalIcon(size) {
  const radius = size * 0.22;
  const center = size / 2;

  return createPng(size, size, (x, y) => {
    // Check squircle rounded rect
    const dx = Math.max(Math.abs(x - center) - (center - radius), 0);
    const dy = Math.max(Math.abs(y - center) - (center - radius), 0);
    const distSq = dx * dx + dy * dy;
    if (distSq > radius * radius) {
      return [0, 0, 0, 0]; // Transparente fora do squircle
    }

    // Cor de fundo esmeralda com gradiente sutil
    const gradFactor = y / size;
    const rBase = Math.round(5 + (4 - 5) * gradFactor);
    const gBase = Math.round(150 - 30 * gradFactor);
    const bBase = Math.round(105 - 18 * gradFactor);

    // Cruz médica central branca
    const armWidth = size * 0.14;
    const armLength = size * 0.46;
    const inVBar = Math.abs(x - center) <= armWidth / 2 && Math.abs(y - center) <= armLength / 2;
    const inHBar = Math.abs(y - center) <= armWidth / 2 && Math.abs(x - center) <= armLength / 2;

    if (inVBar || inHBar) {
      // Ponto central em tom esmeralda
      const distFromCenter = Math.hypot(x - center, y - center);
      if (distFromCenter <= size * 0.05) {
        return [5, 150, 105, 255];
      }
      return [255, 255, 255, 255];
    }

    // Anel externo sutil
    const distToCenter = Math.hypot(x - center, y - center);
    const ringRadius = size * 0.36;
    if (Math.abs(distToCenter - ringRadius) <= size * 0.015) {
      return [255, 255, 255, 70];
    }

    return [rBase, gBase, bBase, 255];
  });
}

const publicDir = path.resolve(__dirname, '../public');

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), drawHospitalIcon(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), drawHospitalIcon(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), drawHospitalIcon(180));

console.log('Valid PNG icons successfully created: icon-192.png, icon-512.png, apple-touch-icon.png');
