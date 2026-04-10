const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/opand/OneDrive/Desktop/projects/Qworship - revert/Qworship-v2/apps/client/src';
const targetFiles = [
  'features/dashboard/components/DashboardMainWorkspace.tsx',
  'features/dashboard/components/LiveConsolePreview.tsx',
  'features/dashboard/components/SlideDisplayArea.tsx',
  'features/dashboard/components/SlideEditorPanel.tsx',
  'features/dashboard/components/SlideGridRenderer.tsx',
  'features/dashboard/live/LivePresentation.tsx',
  'features/dashboard/live/LivePresentationV2.tsx',
  'features/dashboard/live/components/LiveBackgroundLayer.tsx',
  'features/dashboard/live/components/LiveOverlayLayer.tsx',
  'features/dashboard/live/components/LiveSlideLayer.tsx'
];

targetFiles.forEach(file => {
  const filePath = path.join(srcDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match the local definition
    const regex = /const resolveMediaUrl = \(url: string \| null \| undefined\): string \| undefined => \{[\s\S]*?\sreturn undefined;\n\};\n?/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, '');
      
      // Ensure it imports resolveMediaUrl from @/lib/queryClient
      if (content.includes('import { buildUrl } from "@/lib/queryClient";')) {
         content = content.replace('import { buildUrl } from "@/lib/queryClient";', 'import { buildUrl, resolveMediaUrl } from "@/lib/queryClient";');
      } else if (content.includes('import { resolveMediaUrl }')) {
         // do nothing
      } else {
         content = 'import { resolveMediaUrl } from "@/lib/queryClient";\n' + content;
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    } else {
      console.log(`No match in ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});
