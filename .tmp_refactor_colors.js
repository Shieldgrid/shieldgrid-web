import fs from 'fs';
import path from 'path';

const hexToVarMap = {
  '#121212': 'var(--sys-bg-base)',
  '#1A1A22': 'var(--sys-bg-surface)',
  '#1E1E24': 'var(--sys-bg-surface)',
  '#2A2A32': 'var(--sys-bg-elevated)',
  '#E0E0E0': 'var(--sys-text-primary)',
  '#8A8A96': 'var(--sys-text-secondary)',
  '#555560': 'var(--sys-text-muted)',
  '#333340': 'var(--sys-border)',
  '#6B7B99': 'var(--color-accent)',
  '#E5A93B': 'var(--color-warning)',
  '#D32F2F': 'var(--color-critical)',
  '#4CAF50': 'var(--color-success)',
  // Also tailwind classes replacements
  'bg-[#0F0F13]': 'bg-base',
  'bg-[#121212]': 'bg-base',
  'bg-[#18181c]': 'bg-surface',
  'bg-[#1A1A22]': 'bg-surface',
  'bg-[#1E1E24]': 'bg-surface',
  'bg-[#2A2A32]': 'bg-elevated',
  'bg-[#252530]': 'bg-elevated',
  'border-[#333340]': 'border-primary', // Wait, we mapped it to --sys-border in index.css
  'text-white': 'text-primary',
  'text-[#E0E0E0]': 'text-primary',
  'text-gray-400': 'text-secondary',
  'text-gray-500': 'text-muted',
  'text-[#8A8A96]': 'text-secondary',
  'text-[#555560]': 'text-muted',
};

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

    for (const [hex, cssVar] of Object.entries(hexToVarMap)) {
      // Use regex with word boundaries where applicable, or just simple split/join
      // For tailwind classes
      if (hex.startsWith('bg-[') || hex.startsWith('border-[') || hex.startsWith('text-')) {
        // e.g. text-white to text-[var(--sys-text-primary)]
        let tailwindVar = cssVar.replace('var(', '').replace(')', ''); 
        // Wait, if cssVar is var(--sys-bg-base), tailwind equivalent in v4 is bg-[var(--sys-bg-base)]
        content = content.split(hex).join(cssVar.startsWith('var') ? hex.split('-')[0] + '-[' + cssVar + ']' : cssVar);
      } else {
        // Hex codes in inline styles
        // e.g. '#121212' to 'var(--sys-bg-base)'
        // Must be careful about uppercase/lowercase hex
        const regex = new RegExp(hex, 'gi');
        content = content.replace(regex, cssVar);
      }
    }
    
    // Some specific tailwind classes fixes
    content = content.split("border-primary").join("border-[var(--sys-border)]");
    content = content.split("bg-base").join("bg-[var(--sys-bg-base)]");
    content = content.split("bg-surface").join("bg-[var(--sys-bg-surface)]");
    content = content.split("bg-elevated").join("bg-[var(--sys-bg-elevated)]");
    content = content.split("text-primary").join("text-[var(--sys-text-primary)]");
    content = content.split("text-secondary").join("text-[var(--sys-text-secondary)]");
    content = content.split("text-muted").join("text-[var(--sys-text-muted)]");

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
