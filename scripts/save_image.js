const fs = require('fs');
const { execSync } = require('child_process');

function saveGeneratedImage(jsonPath, targetBaseWithoutExt) {
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const base64Data = json.dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const targetPng = targetBaseWithoutExt + '.png';
  const targetWebp = targetBaseWithoutExt + '.webp';

  fs.writeFileSync(targetPng, buffer);
  console.log(`Saved PNG: ${targetPng} (${buffer.length} bytes)`);

  try {
    const sharp = require('sharp');
    sharp(buffer).webp({ quality: 90 }).toFile(targetWebp).then(() => {
      console.log(`Converted to WEBP via sharp: ${targetWebp}`);
    });
  } catch (err) {
    execSync(`python scripts/convert_to_webp.py "${targetPng}" "${targetWebp}"`);
    console.log(`Converted to WEBP via python: ${targetWebp}`);
  }
}

if (process.argv[2] && process.argv[3]) {
  saveGeneratedImage(process.argv[2], process.argv[3]);
}

module.exports = { saveGeneratedImage };

