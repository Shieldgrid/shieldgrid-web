import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.split("var(--sys-text-[var(--sys-text-muted)])").join("var(--sys-text-muted)");
    content = content.split("var(--sys-text-[var(--sys-text-secondary)])").join("var(--sys-text-secondary)");
    content = content.split("var(--sys-text-[var(--sys-text-primary)])").join("var(--sys-text-primary)");
    content = content.split("var(--sys-bg-[var(--sys-bg-base)])").join("var(--sys-bg-base)");
    content = content.split("var(--sys-bg-[var(--sys-bg-surface)])").join("var(--sys-bg-surface)");
    content = content.split("var(--sys-bg-[var(--sys-bg-elevated)])").join("var(--sys-bg-elevated)");
    content = content.split("var(--sys-[var(--sys-border)])").join("var(--sys-border)");

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed ${filePath}`);
    }
  }
});
