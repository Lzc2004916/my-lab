// 将 build/icon.png 转换为多分辨率 build/icon.ico
// Windows 桌面快捷方式需要 16/24/32/48/64/96/128/256 多尺寸图标
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PROJECT = path.resolve(__dirname, '..');
const PNG_PATH = path.join(PROJECT, 'build', 'icon.png');
const ICO_PATH = path.join(PROJECT, 'build', 'icon.ico');

const SIZES = [16, 24, 32, 48, 64, 96, 128, 256];

async function main() {
  const pngBuffer = fs.readFileSync(PNG_PATH);

  // 为每个尺寸生成 PNG
  const pngs = await Promise.all(
    SIZES.map((size) =>
      sharp(pngBuffer).resize(size, size).png().toBuffer()
    )
  );

  // 构建 ICO 文件: 6 字节头 + N×16 字节目录项 + 各尺寸 PNG 数据
  const count = SIZES.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);    // reserved
  header.writeUInt16LE(1, 2);    // type: 1 = ICO
  header.writeUInt16LE(count, 4); // image count

  let offset = 6 + count * 16; // 图像数据起始偏移
  const entries = [];
  const imageBuffers = [];

  for (let i = 0; i < count; i++) {
    const size = SIZES[i];
    const png = pngs[i];

    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);  // width  (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1);  // height (0 = 256)
    entry.writeUInt8(0, 2);                        // color palette (0 = no palette)
    entry.writeUInt8(0, 3);                        // reserved
    entry.writeUInt16LE(1, 4);                     // color planes
    entry.writeUInt16LE(32, 6);                    // bits per pixel
    entry.writeUInt32LE(png.length, 8);            // image size
    entry.writeUInt32LE(offset, 12);               // image offset

    entries.push(entry);
    imageBuffers.push(png);
    offset += png.length;
  }

  const ico = Buffer.concat([header, ...entries, ...imageBuffers]);
  fs.writeFileSync(ICO_PATH, ico);

  console.log(`[generate-ico] ${path.basename(PNG_PATH)} → ${path.basename(ICO_PATH)} (${ico.length} bytes, ${count} sizes: ${SIZES.join('/')})`);
}

main().catch((err) => {
  console.error('[generate-ico] Error:', err);
  process.exit(1);
});
