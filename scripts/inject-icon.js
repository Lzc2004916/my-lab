// electron-builder afterPack hook — 手动注入图标到 exe
// signAndEditExecutable=false 跳过了图标嵌入，此脚本在打包后、NSIS 前补上。
// .ico 文件由 scripts/generate-ico.js 预先生成到 build/icon.ico。
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.default = async function (context) {
  const exeName = context.packager.appInfo.productFilename + '.exe';
  const exePath = path.join(context.appOutDir, exeName);

  // 候选 .ico 路径（按优先级）
  const candidates = [
    path.join(context.packager.projectDir, 'build', 'icon.ico'),                // 预生成
    path.join(context.outDir, '.icon-ico', 'icon.ico'),                          // electron-builder 生成
  ];
  const icoPath = candidates.find((p) => fs.existsSync(p));

  // rcedit 工具路径 — 遍历 winCodeSign 目录找到 rcedit-x64.exe
  const winCodeSignDir = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder',
    'Cache', 'winCodeSign');
  let rceditExe = null;
  if (fs.existsSync(winCodeSignDir)) {
    const dirs = fs.readdirSync(winCodeSignDir);
    for (const d of dirs) {
      const candidate = path.join(winCodeSignDir, d, 'rcedit-x64.exe');
      if (fs.existsSync(candidate)) { rceditExe = candidate; break; }
    }
  }
  const appBuilder = path.join(context.packager.projectDir, 'node_modules',
    'app-builder-bin', 'win', 'x64', 'app-builder.exe');

  if (!fs.existsSync(exePath)) {
    console.log('[afterPack] exe not found:', exePath);
    return;
  }
  if (!icoPath) {
    console.log('[afterPack] ico not found (tried:', candidates.join(', '), ')');
    return;
  }
  console.log('[afterPack] Using icon:', icoPath);

  const tryCmd = (cmd) => {
    try {
      execSync(cmd, { stdio: 'inherit' });
      return true;
    } catch { return false; }
  };

  if (fs.existsSync(rceditExe)) {
    if (tryCmd(`"${rceditExe}" "${exePath}" --set-icon "${icoPath}"`)) {
      console.log('[afterPack] Icon injected via rcedit-x64');
      return;
    }
  }

  if (fs.existsSync(appBuilder)) {
    const args = Buffer.from(`${exePath} --set-icon ${icoPath}`).toString('base64');
    if (tryCmd(`"${appBuilder}" rcedit --args="${args}"`)) {
      console.log('[afterPack] Icon injected via app-builder rcedit');
      return;
    }
  }

  console.error('[afterPack] Failed to inject icon');
};
