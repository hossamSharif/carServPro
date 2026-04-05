/**
 * PWA Icon Generator
 * Generates placeholder PWA icons (192x192 and 512x512).
 * Replace these with actual brand icons for production.
 *
 * Run: npx tsx scripts/generate-icons.ts
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function createSVG(size: number): string {
  const fontSize = Math.floor(size * 0.15);
  const subFontSize = Math.floor(size * 0.08);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.15)}" fill="#1e40af"/>
  <text x="50%" y="40%" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">CS</text>
  <text x="50%" y="65%" font-family="sans-serif" font-size="${subFontSize}" fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="middle">PRO</text>
</svg>`;
}

const iconsDir = join(__dirname, '..', 'public', 'icons');
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Write SVG files (browsers accept SVG for PWA icons in modern manifests)
// For PNG conversion, use tools like sharp or canvas
writeFileSync(join(iconsDir, 'pwa-192x192.svg'), createSVG(192));
writeFileSync(join(iconsDir, 'pwa-512x512.svg'), createSVG(512));

console.log('PWA icon SVGs generated in public/icons/');
console.log('Note: Convert to PNG for full PWA compatibility or update manifest to reference .svg files.');
