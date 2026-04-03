import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');

const safeMove = (fromRel, toRel) => {
  const from = path.join(SRC_DIR, fromRel);
  const to = path.join(SRC_DIR, toRel);
  if (fs.existsSync(from)) {
    const dir = path.dirname(to);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.renameSync(from, to);
    console.log(`✅ Moved: ${path.basename(from)} -> ${toRel}`);
  }
};

const safeMoveDirContents = (fromDirRel, toDirRel) => {
  const from = path.join(SRC_DIR, fromDirRel);
  const to = path.join(SRC_DIR, toDirRel);
  if (fs.existsSync(from)) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    const items = fs.readdirSync(from);
    items.forEach(item => {
      fs.renameSync(path.join(from, item), path.join(to, item));
    });
    console.log(`✅ Extracted contents: ${fromDirRel} -> ${toDirRel}`);
  }
}

console.log('🚀 Executing Strict FSD Domain Isolation & Hybrid Root Cleanup...');


// --- PART 1: DESTUCTURE DASHBOARD PAGES INTO EXACT DOMAINS ---

// 1. Super Admin domain isolation
const superAdminPages = ['AdminManagement.tsx', 'AdminSettings.tsx', 'SuperAdmin.tsx', 'SuperAdminMediaAssets.tsx'];
superAdminPages.forEach(f => safeMove(`features/dashboard/pages/${f}`, `features/super-admin/pages/${f}`));
safeMove(`features/dashboard/pages/SuperAdminSidebar.tsx`, `features/super-admin/components/SuperAdminSidebar.tsx`);
safeMove(`features/dashboard/pages/SuperAdminSidebar.tsx.backup`, `features/super-admin/components/SuperAdminSidebar.tsx.backup`);
safeMove(`features/dashboard/components/AdminTopBar.tsx`, `features/super-admin/components/AdminTopBar.tsx`);

// 2. Profile domain isolation
safeMove(`features/dashboard/pages/UserProfileView.tsx`, `features/dashboard/profile/UserProfileView.tsx`);

// 3. Lower Third isolation
const lowerThirdFiles = ['LowerThirdDemoPage.tsx', 'LowerThirdEditorPageWrapper.tsx', 'LowerThirdRenderPage.tsx', 'LowerThirdSettingsPageWrapper.tsx'];
lowerThirdFiles.forEach(f => safeMove(`features/dashboard/pages/${f}`, `features/dashboard/lower-third/${f}`));

// 4. Live Presentation isolation
const liveFiles = ['LivePresentation.tsx', 'OBSPresentationView.tsx'];
liveFiles.forEach(f => safeMove(`features/dashboard/pages/${f}`, `features/dashboard/live/${f}`));

// 5. Flatten Core Dashboard root configurations
safeMove(`features/dashboard/pages/Dashboard.tsx`, `features/dashboard/Dashboard.tsx`);
safeMove(`features/dashboard/pages/DashboardLayout.tsx`, `features/dashboard/DashboardLayout.tsx`);
safeMove(`features/dashboard/pages/not-found.tsx`, `features/dashboard/not-found.tsx`);


// --- PART 2: THE SHARED FOLDER HYBRID REVERSION ---
// Extract everything out of shared/ and back to the root src/

const GLOBALS = ['hooks', 'lib', 'services', 'stores', 'utils'];
GLOBALS.forEach(folder => {
  safeMoveDirContents(`shared/${folder}`, `${folder}`);
});

// UI components back to root src/components/ui
safeMoveDirContents(`shared/ui`, `components/ui`);

// Types.ts to src/types/index.ts
safeMove(`shared/types.ts`, `types/index.ts`);
safeMove(`shared/types/index.ts`, `types/index.ts`); // Just in case


console.log('🔄 Rewriting Module Imports...');

const getAllFiles = (dir, result = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, result);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      result.push(fullPath);
    }
  }
  return result;
};

const allFiles = getAllFiles(SRC_DIR);
let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix internal relative imports inside DashboardLayout and Dashboard.tsx
  // Because they moved UP from pages/ to dashboard/, their relative imports to `../components/` become `./components/`
  // The safest way is to force them directly to absolute paths!
  content = content.replace(/from\s+['"]\.\.\/components\/(.*?)['"]/g, 'from "@/features/dashboard/components/$1"');
  content = content.replace(/from\s+['"]\.\.\/hooks\/(.*?)['"]/g, 'from "@/features/dashboard/hooks/$1"'); // Bind to local hooks
  content = content.replace(/from\s+['"]\.\/components\/(.*?)['"]/g, 'from "@/features/dashboard/components/$1"');

  // Fix SuperAdmin relative imports
  content = content.replace(/from\s+['"]\.\/SuperAdminSidebar['"]/g, 'from "@/features/super-admin/components/SuperAdminSidebar"');
  content = content.replace(/from\s+['"]\.\/AdminTopBar['"]/g, 'from "@/features/super-admin/components/AdminTopBar"');
  
  content = content.replace(/from\s+['"]@\/features\/dashboard\/components\/AdminTopBar['"]/g, 'from "@/features/super-admin/components/AdminTopBar"');
  content = content.replace(/from\s+['"]@\/features\/dashboard\/pages\/SuperAdminSidebar['"]/g, 'from "@/features/super-admin/components/SuperAdminSidebar"');

  // Rewrite Absolute Mapping Targets (Destructuring)
  content = content.replace(/from\s+['"]@\/features\/dashboard\/pages\/(SuperAdmin|AdminManagement|AdminSettings|SuperAdminMediaAssets)['"]/g, 'from "@/features/super-admin/pages/$1"');
  content = content.replace(/from\s+['"]@\/features\/dashboard\/pages\/UserProfileView['"]/g, 'from "@/features/dashboard/profile/UserProfileView"');
  content = content.replace(/from\s+['"]@\/features\/dashboard\/pages\/(LowerThirdDemoPage|LowerThirdEditorPageWrapper|LowerThirdRenderPage|LowerThirdSettingsPageWrapper)['"]/g, 'from "@/features/dashboard/lower-third/$1"');
  content = content.replace(/from\s+['"]@\/features\/dashboard\/pages\/(LivePresentation|OBSPresentationView)['"]/g, 'from "@/features/dashboard/live/$1"');
  content = content.replace(/from\s+['"]@\/features\/dashboard\/pages\/(Dashboard|DashboardLayout|not-found)['"]/g, 'from "@/features/dashboard/$1"');

  // REWRITE SHARED IMPORTS (Reversion)
  content = content.replace(/from\s+['"]@\/shared\/(hooks|lib|services|stores|utils)\/(.*?)['"]/g, 'from "@/$1/$2"');
  content = content.replace(/from\s+['"]@\/shared\/ui\/(.*?)['"]/g, 'from "@/components/ui/$1"');
  content = content.replace(/from\s+['"]@\/shared\/types(.*?)['"]/g, 'from "@/types$1"');


  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
}

console.log('🧹 Purging Ghost Folders...');

// Delete shared/ and empty dashboard pages
const GHOST_FOLDERS = ['shared', 'features/dashboard/pages'];

GHOST_FOLDERS.forEach(folder => {
  try {
    const targetDir = path.join(SRC_DIR, folder);
    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length === 0) {
      fs.rmdirSync(targetDir);
      console.log(`🗑️  Cleaned up empty root folder: /src/${folder}`);
    }
  } catch (e) {
    // Ignored if not empty or locked
  }
});

console.log(`✅ Architecture refined, shared layer reverted to root, and imported mappings updated in ${modifiedCount} local files!`);
