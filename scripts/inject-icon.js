// electron-builder afterPack hook — 手动注入图标到 exe
// signAndEditExecutable=false 跳过了图标嵌入，此脚本在打包后、NSIS 前补上
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.default = async function (context) {
  const exeName = context.packager.appInfo.productFilename + '.exe';
  const exePath = path.join(context.appOutDir, exeName);
  const icoPath = path.join(context.packager.projectDir, 'release', '.icon-ico', 'icon.ico');

  // 优先用缓存中的 rcedit-x64.exe
  const rceditExe = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder',
    'Cache', 'winCodeSign', 'extracted', 'rcedit-x64.exe');

  // 备用：通过 app-builder 的 rcedit 子命令
  const appBuilder = path.join(context.packager.projectDir, 'node_modules',
    'app-builder-bin', 'win', 'x64', 'app-builder.exe');

  if (!fs.existsSync(exePath)) {
    console.log('[afterPack] exe not found:', exePath);
    return;
  }
  if (!fs.existsSync(icoPath)) {
    console.log('[afterPack] ico not found:', icoPath);
    return;
  }

  const tryRcedit = (cmd) => {
    try {
      execSync(cmd, { stdio: 'inherit' });
      return true;
    } catch { return false; }
  };

  if (fs.existsSync(rceditExe)) {
    if (tryRcedit(`"${rceditExe}" "${exePath}" --set-icon "${icoPath}"`)) {
      console.log('[afterPack] Icon injected via rcedit-x64');
      return;
    }
  }

  if (fs.existsSync(appBuilder)) {
    if (tryRcedit(`"${appBuilder}" rcedit --args="${exePath} --set-icon ${icoPath}"`)) {
      console.log('[afterPack] Icon injected via app-builder rcedit');
      return;
    }
  }

  console.error('[afterPack] Failed to inject icon');
};
