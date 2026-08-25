const fs = require('fs');
const files = [
  '/home/ju-nine/projects/Shieldgrid/shieldgrid-web/src/pages/VelociraptorPage.tsx',
  '/home/ju-nine/projects/Shieldgrid/shieldgrid-web/src/pages/AgentsPage.tsx',
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/text-(xs|sm|base|lg|\[10px\]|\[11px\])/g, (match, p1) => {
    if (p1 === '[10px]') return 'text-xs';
    if (p1 === '[11px]') return 'text-sm';
    if (p1 === 'xs') return 'text-sm';
    if (p1 === 'sm') return 'text-base';
    return match;
  });
  fs.writeFileSync(f, content);
});

// AiDashboard uses inline styles with rem for sizes sometimes, let's also bump those
const aiDash = '/home/ju-nine/projects/Shieldgrid/shieldgrid-web/src/pages/AiDashboardPage.tsx';
let aiContent = fs.readFileSync(aiDash, 'utf8');
aiContent = aiContent.replace(/fontSize: '0\.6rem'/g, "fontSize: '0.75rem'");
aiContent = aiContent.replace(/fontSize: '0\.65rem'/g, "fontSize: '0.8rem'");
aiContent = aiContent.replace(/fontSize: '0\.7rem'/g, "fontSize: '0.85rem'");
fs.writeFileSync(aiDash, aiContent);
console.log('Fonts bumped.');
