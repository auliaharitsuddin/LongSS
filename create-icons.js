// Node.js script to create PNG icons from SVG
// This requires installing: npm install sharp

const fs = require('fs');
const sharp = require('sharp');

const sizes = [16, 32, 48, 128];
const svgPath = './icons/icon.svg';

async function createIcons() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`./icons/icon${size}.png`);
    
    console.log(`Created icon${size}.png`);
  }
  
  console.log('All icons created successfully!');
}

createIcons().catch(console.error);
