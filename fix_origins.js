const fs = require('fs');
const glob = require('glob');

const files = [
  './apps/client/src/features/dashboard/live/useLivePresentationState.ts',
  './apps/client/src/features/dashboard/live/LivePresentationV2.tsx',
  './apps/client/src/features/dashboard/live/LivePresentation.tsx',
  './apps/client/src/features/dashboard/live/components/LiveSlideLayer.tsx',
  './apps/client/src/features/dashboard/components/live-console/LiveConsoleLeftPanel.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace , window.location.origin,  with , "*",
    // Replace window.location.origin,    with "*",
    content = content.replace(/window\.location\.origin,/g, '"*",');
    
    // Also remove the explicit origin check: 
    // if (event.origin !== window.location.origin) {  => if (event.origin !== window.location.origin && event.origin !== "file://" && event.origin !== "null") {
    content = content.replace(/if\s*\(event\.origin\s*!==\s*window\.location\.origin\)\s*\{/g, 'if (event.origin !== window.location.origin && event.origin !== "file://" && event.origin !== "null") {');
    content = content.replace(/if\s*\(event\.origin\s*!==\s*window\.location\.origin\)\s*return;/g, 'if (event.origin !== window.location.origin && event.origin !== "file://" && event.origin !== "null") return;');

    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
