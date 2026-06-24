// Genera los iconos/splash de ecco (motivo de onda "brasa") como PNG,
// sin librerías externas: pinta los píxeles y los codifica con zlib.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// --- Codificador PNG mínimo (RGBA, 8-bit) ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter none
    rgba.copy(
      raw,
      y * (1 + width * 4) + 1,
      y * width * 4,
      y * width * 4 + width * 4
    );
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Lienzo ---
function canvas(size) {
  return { size, buf: Buffer.alloc(size * size * 4) };
}
function px(c, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  c.buf[i] = r;
  c.buf[i + 1] = g;
  c.buf[i + 2] = b;
  c.buf[i + 3] = a;
}
function fillBg(c, color) {
  for (let y = 0; y < c.size; y++)
    for (let x = 0; x < c.size; x++) px(c, x, y, color);
}
// Rectángulo redondeado (radio en px)
function roundRect(c, x0, y0, w, h, radius, color) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = true;
      // esquinas
      const cx = x < radius ? radius : x > w - radius ? w - radius : x;
      const cy = y < radius ? radius : y > h - radius ? h - radius : y;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > radius * radius) inside = false;
      if (inside) px(c, x0 + x, y0 + y, color);
    }
  }
}

const EMBER = [
  [232, 96, 44, 255], // #E8602C
  [242, 129, 78, 255], // #F2814E
  [255, 122, 61, 255], // #FF7A3D
  [242, 129, 78, 255],
  [201, 90, 42, 255], // #c95a2a
  [201, 90, 42, 255],
];
const BG = [20, 8, 5, 255]; // #140805

// Dibuja la onda (6 barras) centrada, ocupando ~frac del lienzo.
function drawWave(c, frac = 0.5) {
  const heights = [0.34, 0.66, 1.0, 0.5, 0.82, 0.4];
  const n = heights.length;
  const areaW = c.size * frac;
  const barW = Math.round(areaW / (n * 1.7));
  const gap = Math.round(barW * 0.7);
  const totalW = n * barW + (n - 1) * gap;
  const startX = Math.round((c.size - totalW) / 2);
  const maxH = c.size * frac;
  const cy = Math.round(c.size / 2);
  for (let i = 0; i < n; i++) {
    const h = Math.round(maxH * heights[i]);
    const x0 = startX + i * (barW + gap);
    const y0 = cy - Math.round(h / 2);
    roundRect(c, x0, y0, barW, h, Math.round(barW / 2), EMBER[i]);
  }
}

mkdirSync(new URL('../assets/images/', import.meta.url), { recursive: true });
function out(name, c) {
  const url = new URL(`../assets/images/${name}`, import.meta.url);
  writeFileSync(url, encodePNG(c.size, c.size, c.buf));
  console.log('✔', name, `${c.size}x${c.size}`);
}

// icon.png (cuadrado opaco, fondo brasa + onda)
{
  const c = canvas(1024);
  fillBg(c, BG);
  drawWave(c, 0.46);
  out('icon.png', c);
}
// favicon.png (pequeño, opaco)
{
  const c = canvas(96);
  fillBg(c, BG);
  drawWave(c, 0.5);
  out('favicon.png', c);
}
// adaptive-icon.png (transparente, onda con margen de seguridad)
{
  const c = canvas(1024);
  drawWave(c, 0.34);
  out('adaptive-icon.png', c);
}
// splash-icon.png (transparente, onda)
{
  const c = canvas(512);
  drawWave(c, 0.5);
  out('splash-icon.png', c);
}
console.log('Listo.');
