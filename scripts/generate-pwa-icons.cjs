const fs = require('fs');
const path = require('path');

// Criar SVG limpo e moderno do ícone hospitalar / gestão de plantão
function createSvgIcon(size) {
  const padding = size * 0.12;
  const innerSize = size - padding * 2;
  const radius = size * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.03}" flood-color="#064e3b" flood-opacity="0.3"/>
      </filter>
    </defs>
    <!-- Background rounded squircle -->
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad)" />
    
    <!-- Outer Shield / Dial Circle -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${innerSize * 0.44}" fill="none" stroke="#ffffff" stroke-width="${size * 0.035}" stroke-opacity="0.25" />
    
    <!-- Central Cross & Clock Motif -->
    <!-- Medical Cross -->
    <rect x="${size * 0.44}" y="${size * 0.28}" width="${size * 0.12}" height="${size * 0.44}" rx="${size * 0.025}" fill="#ffffff" filter="url(#shadow)" />
    <rect x="${size * 0.28}" y="${size * 0.44}" width="${size * 0.44}" height="${size * 0.12}" rx="${size * 0.025}" fill="#ffffff" filter="url(#shadow)" />
    
    <!-- Center Clock Dial Accent -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.06}" fill="#059669" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.025}" fill="#ffffff" />
  </svg>`;
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Salvar SVG principal
fs.writeFileSync(path.join(publicDir, 'icon.svg'), createSvgIcon(512), 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createSvgIcon(64), 'utf-8');

console.log('SVG icons generated in public directory.');
