import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

// Minimal PNG builder
function createPNG(width, height, drawFn) {
  // RGBA buffer
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    raw[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x / width, y / height, x, y, width, height);
      const px = rowOffset + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(raw);

  // PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const chunkType = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([chunkType, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, chunkType, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff);
}

// Distance from point (px, py) to line segment (x1, y1) - (x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Draw the minimal simple mark in #33BC65
function drawMark(u, v, x, y, width, height) {
  // Normalize coords to 0..32 space
  const nx = u * 32;
  const ny = v * 32;

  // Outer chevron: (5, 8) -> (16, 26) -> (27, 8) with thickness 3.2
  const d1 = distToSegment(nx, ny, 5, 8, 16, 26);
  const d2 = distToSegment(nx, ny, 16, 26, 27, 8);
  const minOuterDist = Math.min(d1, d2);

  // Inner chevron: (10, 8) -> (16, 18) -> (22, 8) with thickness 2.4
  const d3 = distToSegment(nx, ny, 10, 8, 16, 18);
  const d4 = distToSegment(nx, ny, 16, 18, 22, 8);
  const minInnerDist = Math.min(d3, d4);

  const radiusOuter = 1.6;
  const radiusInner = 1.2;

  // Anti-aliased alpha
  let alpha = 0;
  if (minOuterDist <= radiusOuter + 0.8) {
    const a = Math.max(0, Math.min(1, (radiusOuter + 0.8 - minOuterDist) / 0.8));
    alpha = Math.max(alpha, a);
  }
  if (minInnerDist <= radiusInner + 0.8) {
    const a = Math.max(0, Math.min(1, (radiusInner + 0.8 - minInnerDist) / 0.8)) * 0.85;
    alpha = Math.max(alpha, a);
  }

  if (alpha <= 0.01) {
    return [0, 0, 0, 0];
  }

  // #33BC65 = RGB(51, 188, 101)
  return [51, 188, 101, Math.round(alpha * 255)];
}

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

for (const { name, size } of sizes) {
  const pngBuf = createPNG(size, size, drawMark);
  fs.writeFileSync(path.join(publicDir, name), pngBuf);
  console.log(`Generated ${name} (${size}x${size})`);
}

// Also create a multi-size or 32x32 favicon.ico
// ICO header: 6 bytes + 16 bytes per image + image data
const png32 = fs.readFileSync(path.join(publicDir, 'favicon-32x32.png'));
const icoHeader = Buffer.alloc(6 + 16);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // ICO type
icoHeader.writeUInt16LE(1, 4); // count of images
icoHeader[6] = 32; // width
icoHeader[7] = 32; // height
icoHeader[8] = 0; // color palette
icoHeader[9] = 0; // reserved
icoHeader.writeUInt16LE(1, 10); // color planes
icoHeader.writeUInt16LE(32, 12); // bits per pixel
icoHeader.writeUInt32LE(png32.length, 14); // image size
icoHeader.writeUInt32LE(22, 18); // offset

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), Buffer.concat([icoHeader, png32]));
console.log('Generated favicon.ico');
