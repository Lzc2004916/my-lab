// 将 build/icon.png 转换为 build/icon.ico（ICO 容器嵌入 PNG）
// 在 electron-builder 之前运行，确保 afterPack 钩子有可用的 .ico 文件。
const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const PNG_PATH = path.join(PROJECT, 'build', 'icon.png');
const ICO_PATH = path.join(PROJECT, 'build', 'icon.ico');

const png = fs.readFileSync(PNG_PATH);

// PNG 尺寸（前 24 字节包含 IHDR）
const w = png.readUInt32BE(16); // 宽度
const h = png.readUInt32BE(20); // 高度

// ICO 文件结构：6 字节头 + 16 字节目录项 + PNG 数据
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);          // reserved
header.writeUInt16LE(1, 2);          // type: 1 = ICO
header.writeUInt16LE(1, 4);          // image count

const entry = Buffer.alloc(16);
entry.writeUInt8(w >= 256 ? 0 : w, 0);  // width  (0 = 256)
entry.writeUInt8(h >= 256 ? 0 : h, 1);  // height (0 = 256)
entry.writeUInt8(0, 2);                  // color palette
entry.writeUInt8(0, 3);                  // reserved
entry.writeUInt16LE(1, 4);               // color planes
entry.writeUInt16LE(32, 6);              // bits per pixel
entry.writeUInt32LE(png.length, 8);      // image size
entry.writeUInt32LE(22, 12);             // offset (6 + 16)

const ico = Buffer.concat([header, entry, png]);
fs.writeFileSync(ICO_PATH, ico);

console.log(`[generate-ico] ${path.basename(PNG_PATH)} (${w}×${h}) → ${path.basename(ICO_PATH)} (${ico.length} bytes)`);
