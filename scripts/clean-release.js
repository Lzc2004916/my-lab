/**
 * 打包前清理 release 目录。
 * 使用重试机制解决 Windows Defender 实时扫描导致的 app.asar 文件锁定问题。
 */
const fs = require('fs');
const path = require('path');

const RELEASE_DIR = path.join(__dirname, '..', 'release');

function rmdir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rmdir(fullPath);
    } else {
      try {
        fs.unlinkSync(fullPath);
      } catch (e) {
        // 文件被锁，跳过（后续重试会再试）
      }
    }
  }

  try {
    fs.rmdirSync(dir);
  } catch (e) {
    // 目录非空或锁住，跳过
  }
}

// 重试最多 10 次，每次等待 1 秒
for (let i = 0; i < 10; i++) {
  rmdir(RELEASE_DIR);

  if (!fs.existsSync(RELEASE_DIR)) {
    console.log('[clean] release directory removed');
    process.exit(0);
  }

  if (i < 9) {
    console.log(`[clean] retry ${i + 1}/10 — files still locked, waiting...`);
    // 同步等待
    const start = Date.now();
    while (Date.now() - start < 1000) {}
  }
}

console.log('[clean] warning: could not fully remove release directory, continuing anyway');
process.exit(0);
