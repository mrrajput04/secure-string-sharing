const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create favicon directory if it doesn't exist
const faviconDir = path.join(__dirname, 'public', 'favicon');
if (!fs.existsSync(faviconDir)) {
    fs.mkdirSync(faviconDir, { recursive: true });
}

// SVG content for the favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <!-- Background -->
  <rect x="0" y="0" width="64" height="64" rx="12" fill="#3498db" />
  
  <!-- File -->
  <path d="M42,16 L28,16 L18,26 L18,48 L46,48 L46,16 Z" fill="#ffffff" />
  <path d="M28,16 L28,26 L18,26" fill="#e6e6e6" />
  
  <!-- Lock -->
  <rect x="27" y="30" width="10" height="12" rx="1" fill="#2c3e50" />
  <rect x="24" y="26" width="16" height="8" rx="4" fill="#2c3e50" />
  <circle cx="32" cy="36" r="2" fill="#ffffff" />
  <path d="M32,36 L32,40" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
  
  <!-- Shield overlay -->
  <path d="M32,10 C28,14 22,16 16,16 C16,28 16,36 32,46 C48,36 48,28 48,16 C42,16 36,14 32,10 Z" fill="#3498db" fill-opacity="0.2" stroke="#2980b9" stroke-width="1.5" />
</svg>`;

// Save the SVG file
const svgPath = path.join(faviconDir, 'favicon.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('SVG favicon created');

// Use Buffer instead of file path to avoid file format issues
const svgBuffer = Buffer.from(svgContent);

// Generate PNG versions using the buffer
Promise.all([
    // 16x16 favicon
    sharp(svgBuffer)
        .resize(16, 16)
        .png()
        .toFile(path.join(faviconDir, 'favicon-16x16.png')),

    // 32x32 favicon
    sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(faviconDir, 'favicon-32x32.png')),

    // Apple touch icon
    sharp(svgBuffer)
        .resize(180, 180)
        .png()
        .toFile(path.join(faviconDir, 'apple-touch-icon.png')),

    // Android Chrome icons
    sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(faviconDir, 'android-chrome-192x192.png')),

    sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(faviconDir, 'android-chrome-512x512.png'))
])
    .then(() => {
        console.log('All PNG favicons created successfully');

        // Create web manifest
        const webManifest = {
            "name": "Secure File Sharing",
            "short_name": "SecureShare",
            "icons": [
                {
                    "src": "/favicon/android-chrome-192x192.png",
                    "sizes": "192x192",
                    "type": "image/png"
                },
                {
                    "src": "/favicon/android-chrome-512x512.png",
                    "sizes": "512x512",
                    "type": "image/png"
                }
            ],
            "theme_color": "#3498db",
            "background_color": "#ffffff",
            "display": "standalone"
        };

        fs.writeFileSync(
            path.join(faviconDir, 'site.webmanifest'),
            JSON.stringify(webManifest, null, 2)
        );
        console.log('Web manifest created');

        console.log('Favicon generation completed!');
    })
    .catch(err => {
        console.error('Error generating favicons:', err);
    });