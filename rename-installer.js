import fs from 'fs';
import path from 'path';

const nsisDir = path.join(process.cwd(), 'src-tauri', 'target', 'release', 'bundle', 'nsis');

if (fs.existsSync(nsisDir)) {
  const files = fs.readdirSync(nsisDir);
  const setupFile = files.find(f => f.endsWith('-setup.exe'));
  
  if (setupFile) {
    const oldPath = path.join(nsisDir, setupFile);
    const newPath = path.join(nsisDir, 'Memories-setup.exe');
    fs.renameSync(oldPath, newPath);
    console.log(`\nSuccessfully renamed installer to: Memories-setup.exe`);
  }
}
