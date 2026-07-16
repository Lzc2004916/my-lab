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

  // rcedit 工具路径
  const rceditExe = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder',
    'Cache', 'winCodeSign', 'extracted', 'rcedit-x64.exe');
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
    if (tryCmd(`"${appBuilder}" rcedit --args="${exePath} --set-icon ${icoPath}"`)) {
      console.log('[afterPack] Icon injected via app-builder rcedit');
      return;
    }
  }

  console.error('[afterPack] Failed to inject icon');
};
