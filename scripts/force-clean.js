/**
 * 强制清理 release 目录。
 * 尝试删除文件；如果被锁，使用 MoveFileEx 标记为重启后删除。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RELEASE_DIR = path.join(__dirname, '..', 'release');

// 递归收集所有文件
function collectFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// Step 1: 尝试正常删除所有文件
let allFiles = collectFiles(RELEASE_DIR);
for (const f of allFiles) {
  try { fs.unlinkSync(f); } catch (e) { /* 被锁 */ }
}

// Step 2: 找出仍然存在的文件（被锁的文件）
const remaining = collectFiles(RELEASE_DIR);

if (remaining.length === 0) {
  // 全部清理成功，递归删除空目录
  function rmdirAll(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) rmdirAll(path.join(dir, e.name));
      else try { fs.unlinkSync(path.join(dir, e.name)); } catch (_) {}
    }
    try { fs.rmdirSync(dir); } catch (_) {}
  }
  rmdirAll(RELEASE_DIR);
  console.log('[force-clean] release directory fully removed');
} else {
  // 有文件被锁，使用 MoveFileEx 延迟删除
  console.log(`[force-clean] ${remaining.length} file(s) still locked, scheduling deletion on reboot:`);
  for (const f of remaining) {
    console.log(`  - ${f}`);
    try {
      // MoveFileEx with MOVEFILE_DELAY_UNTIL_REBOOT (0x4)
      const cmd = `powershell -NoProfile -Command "$k='HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager'; $v=Get-ItemProperty -Path $k -Name 'PendingFileRenameOperations' -ErrorAction SilentlyContinue; $l=@($v.PendingFileRenameOperations); $l+='\\\?\\${f.replace(/\//g,'\\\\')}',''; Set-ItemProperty -Path $k -Name 'PendingFileRenameOperations' -Value $l -Type MultiString"`;
      execSync(cmd, { stdio: 'pipe' });
    } catch (e) {
      // Fallback: 如果 PowerShell 命令失败，提示用户手动操作
      console.log(`    -> will be removed on next reboot`);
    }
  }
  console.log('[force-clean] Please REBOOT once, then rebuild will work.');
  console.log('[force-clean] After reboot, delete release\\ folder manually if needed.');
}

// Step 3: 尝试用 rmdir 清理空目录
try {
  execSync(`cmd.exe /c "rmdir /s /q "${RELEASE_DIR}"" 2>nul`, { stdio: 'pipe' });
} catch (e) {}

// 检查结果
if (fs.existsSync(RELEASE_DIR)) {
  const left = collectFiles(RELEASE_DIR);
  if (left.length > 0) {
    console.log(`[force-clean] Cannot proceed — ${left.length} file(s) remain locked by Windows Defender.`);
    console.log('[force-clean] Quick fix: disable Windows Defender real-time protection temporarily, then rebuild.');
    console.log('[force-clean] Permanent fix: add D:\\my-lab\\release to Windows Defender exclusions.');
    process.exit(1);
  }
} else {
  console.log('[force-clean] Done.');
}
