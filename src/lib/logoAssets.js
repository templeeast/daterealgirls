const PRIMARY = '#e32652';
const PRIMARY_DARK = '#b8284a';
const DARK = '#1a1a2e';
const WHITE = '#ffffff';
const GREY = '#6b7280';

function getInitials(siteName) {
  const clean = siteName.replace(/[^A-Za-z]/g, '');
  if (clean.length <= 3) return clean.toUpperCase();
  const words = siteName.replace(/[^A-Za-z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.map(w => w[0]).join('').slice(0, 3).toUpperCase();
  return clean.slice(0, 3).toUpperCase();
}

function getDisplayName(siteName) {
  return siteName.replace(/\.(com|net|org|app|io)$/i, '');
}

function getDomain(siteName) {
  return siteName.toLowerCase().replace(/\s+/g, '');
}

export function generateAppIcon(siteName, size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${PRIMARY}"/><stop offset="100%" stop-color="${PRIMARY_DARK}"/></linearGradient></defs>
<rect width="512" height="512" rx="112" fill="url(#g)"/>
<path d="M 256 392 C 256 392, 108 296, 108 194 C 108 140, 147 102, 196 102 C 227 102, 248 123, 256 146 C 264 123, 285 102, 316 102 C 365 102, 404 140, 404 194 C 404 296, 256 392, 256 392 Z" fill="none" stroke="${WHITE}" stroke-width="10" stroke-linejoin="round"/>
<path d="M 256 168 C 231 168, 211 187, 211 212 C 211 227, 206 240, 198 252 C 207 248, 216 247, 225 250 C 229 257, 235 262, 241 265 C 211 277, 186 297, 176 326 C 172 338, 173 349, 179 358 L 333 358 C 339 349, 340 338, 336 326 C 326 297, 301 277, 271 265 C 277 262, 283 257, 287 250 C 296 247, 305 248, 314 252 C 306 240, 301 227, 301 212 C 301 187, 281 168, 256 168 Z" fill="${WHITE}"/>
</svg>`;
}

export function generateHorizontalLogo(siteName, tagline, includeTagline = true) {
  const name = getDisplayName(siteName);
  const initials = getInitials(siteName);
  const iconSize = 48;
  const pad = 16;
  const gap = 14;
  const nameFS = 28;
  const tagFS = 14;
  const h = includeTagline ? 80 : 64;
  const textX = pad + iconSize + gap;
  const nameW = name.length * nameFS * 0.55;
  const tagW = tagline ? tagline.length * tagFS * 0.5 : 0;
  const textW = includeTagline ? Math.max(nameW, tagW) : nameW;
  const w = Math.ceil(textX + textW + pad);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${PRIMARY}"/><stop offset="100%" stop-color="${PRIMARY_DARK}"/></linearGradient></defs>`;
  svg += `<rect x="${pad}" y="${(h - iconSize) / 2}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="url(#g)"/>`;
  svg += `<text x="${pad + iconSize / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${iconSize * 0.34}" font-weight="bold" fill="${WHITE}">${initials}</text>`;
  if (includeTagline) {
    svg += `<text x="${textX}" y="${h / 2 - 10}" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${nameFS}" font-weight="bold" fill="${DARK}">${name}</text>`;
    if (tagline) svg += `<text x="${textX}" y="${h / 2 + 14}" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${tagFS}" fill="${GREY}">${tagline}</text>`;
  } else {
    svg += `<text x="${textX}" y="${h / 2}" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${nameFS}" font-weight="bold" fill="${DARK}">${name}</text>`;
  }
  svg += `</svg>`;
  return svg;
}

export function generateVerticalLogo(siteName, tagline, includeTagline = true) {
  const name = getDisplayName(siteName);
  const initials = getInitials(siteName);
  const iconSize = 60;
  const w = 260;
  const h = includeTagline ? 160 : 120;
  const cx = w / 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${PRIMARY}"/><stop offset="100%" stop-color="${PRIMARY_DARK}"/></linearGradient></defs>`;
  const iconY = 20;
  svg += `<rect x="${cx - iconSize / 2}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="url(#g)"/>`;
  svg += `<text x="${cx}" y="${iconY + iconSize / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${iconSize * 0.34}" font-weight="bold" fill="${WHITE}">${initials}</text>`;
  const nameY = iconY + iconSize + 24;
  svg += `<text x="${cx}" y="${nameY}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${DARK}">${name}</text>`;
  if (includeTagline && tagline) {
    svg += `<text x="${cx}" y="${nameY + 24}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="13" fill="${GREY}">${tagline}</text>`;
  }
  svg += `</svg>`;
  return svg;
}

export function generateBillboardLogo(siteName, tagline, includeTagline = true, width = 1400, height = 400) {
  const name = getDisplayName(siteName);
  const initials = getInitials(siteName);
  const domain = getDomain(siteName);
  const w = width;
  const h = height;
  const iconSize = 120;
  const pad = 60;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${PRIMARY}"/><stop offset="100%" stop-color="${PRIMARY_DARK}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>`;
  const iconX = pad;
  const iconY = (h - iconSize) / 2;
  svg += `<rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="${WHITE}" opacity="0.15"/>`;
  svg += `<rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="none" stroke="${WHITE}" stroke-width="2"/>`;
  svg += `<text x="${iconX + iconSize / 2}" y="${iconY + iconSize / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${iconSize * 0.36}" font-weight="bold" fill="${WHITE}">${initials}</text>`;
  const textX = iconX + iconSize + 40;
  svg += `<text x="${textX}" y="${h / 2 - (includeTagline ? 30 : 0)}" dominant-baseline="central" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="${WHITE}">${name}</text>`;
  if (includeTagline && tagline) {
    svg += `<text x="${textX}" y="${h / 2 + 20}" dominant-baseline="central" font-family="Arial, sans-serif" font-size="24" fill="${WHITE}" opacity="0.85">${tagline}</text>`;
  }
  svg += `<text x="${w - pad}" y="${h / 2 - 16}" text-anchor="end" dominant-baseline="central" font-family="Arial, sans-serif" font-size="20" fill="${WHITE}" opacity="0.7">${domain}</text>`;
  svg += `<text x="${w - pad}" y="${h / 2 + 20}" text-anchor="end" dominant-baseline="central" font-family="Arial, sans-serif" font-size="20" fill="${WHITE}" opacity="0.7">Verify • Connect • Date</text>`;
  svg += `</svg>`;
  return svg;
}

export function downloadSvg(svgString, filename) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPng(svgString, filename, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Failed to create PNG')); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to render SVG'));
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    img.src = URL.createObjectURL(svgBlob);
  });
}

export function svgToDataUrl(svgString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

export function downloadFromUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadResizedImage(imageUrl, filename, width, height) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    await new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = img.width;
        sampleCanvas.height = img.height;
        const sampleCtx = sampleCanvas.getContext('2d');
        sampleCtx.drawImage(img, 0, 0);
        const corners = [
          sampleCtx.getImageData(0, 0, 1, 1).data,
          sampleCtx.getImageData(img.width - 1, 0, 1, 1).data,
          sampleCtx.getImageData(0, img.height - 1, 1, 1).data,
          sampleCtx.getImageData(img.width - 1, img.height - 1, 1, 1).data,
        ];
        const avgR = Math.round(corners.reduce((s, c) => s + c[0], 0) / 4);
        const avgG = Math.round(corners.reduce((s, c) => s + c[1], 0) / 4);
        const avgB = Math.round(corners.reduce((s, c) => s + c[2], 0) / 4);
        ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
        ctx.fillRect(0, 0, width, height);
        const scale = Math.min(width / img.width, height / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const offsetX = (width - scaledW) / 2;
        const offsetY = (height - scaledH) / 2;
        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) { reject(new Error('Failed to create PNG')); return; }
          const dlUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = dlUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(dlUrl);
          resolve();
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}