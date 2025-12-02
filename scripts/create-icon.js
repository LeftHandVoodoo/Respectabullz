import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';

const inputImage = 'assets/Logo_Vintage.png';
const outputDir = 'src-tauri/icons';

async function createIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get image metadata
  const metadata = await sharp(inputImage).metadata();
  const size = Math.min(metadata.width, metadata.height);

  // Create a square version by extracting center
  const squareBuffer = await sharp(inputImage)
    .extract({
      left: Math.floor((metadata.width - size) / 2),
      top: Math.floor((metadata.height - size) / 2),
      width: size,
      height: size
    })
    .resize(256, 256)
    .png()
    .toBuffer();

  // Save as PNG
  fs.writeFileSync(path.join(outputDir, 'icon.png'), squareBuffer);
  console.log('Created icon.png');

  // Create 32x32 version for ico
  const icon32 = await sharp(squareBuffer).resize(32, 32).png().toBuffer();
  
  // Save temp file for ico conversion
  const tempPath = path.join(outputDir, 'temp32.png');
  fs.writeFileSync(tempPath, icon32);

  // Convert to ico
  const icoBuffer = await pngToIco(tempPath);
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuffer);
  console.log('Created icon.ico');

  // Clean up temp file
  fs.unlinkSync(tempPath);
}

createIcons().catch(console.error);

