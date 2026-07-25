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
  const initials = getInitials(siteName);
  const r = size * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${PRIMARY}"/><stop offset="100%" stop-color="${PRIMARY_DARK}"/></linearGradient></defs>
<rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${size * 0.36}" font-weight="bold" fill="${WHITE}">${initials}</text>
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

export function generateBillboardLogo(siteName, tagline, includeTagline = true) {
  const name = getDisplayName(siteName);
  const initials = getInitials(siteName);
  const domain = getDomain(siteName);
  const w = 1400;
  const h = 400;
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