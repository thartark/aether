import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('/vercel/share/v0-project/public/aether-extension/icons', { recursive: true });

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="star" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#818cf8"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <path d="M64 24 L72 56 L96 64 L72 72 L64 104 L56 72 L32 64 L56 56 Z" fill="url(#star)"/>
  <circle cx="88" cy="38" r="4" fill="#a5b4fc" opacity="0.7"/>
  <circle cx="42" cy="90" r="3" fill="#a5b4fc" opacity="0.5"/>
</svg>`;

const svgBuffer = Buffer.from(svgContent);

const sizes = [16, 48, 128];

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`/vercel/share/v0-project/public/aether-extension/icons/icon${size}.png`);
  console.log(`Generated icon${size}.png`);
}

console.log('All icons generated!');
