import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'src');

console.log('🚀 Starting FSD Migration Script for Qworship-v2...');

const getAllFiles = (dir, extn, files, result, regex) => {
  files = files || fs.readdirSync(dir);
  result = result || [];
  for (let i = 0; i < files.length; i++) {
    let file = path.join(dir, files[i]);
    if (fs.statSync(file).isDirectory()) {
      try {
        result = getAllFiles(file, extn, fs.readdirSync(file), result, regex);
      } catch (error) { continue; }
    } else {
      if (file.endsWith(extn) || (regex && regex.test(file))) {
        result.push(file);
      }
    }
  }
  return result;
};

const DIRS_TO_ENSURE = [
  'shared/hooks', 'shared/lib', 'shared/services', 'shared/utils', 'shared/stores', 'shared/ui',
  'features/dashboard/components/modals', 'features/dashboard/pages',
  'features/web/components', 'features/web/pages'
];

DIRS_TO_ENSURE.forEach(dir => {
  const fullPath = path.join(SRC_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const safeMove = (origin, dest) => {
  if (fs.existsSync(origin)) {
    fs.renameSync(origin, dest);
  }
};

const GLOBALS_TO_SHARED = ['hooks', 'lib', 'services', 'utils', 'stores'];
GLOBALS_TO_SHARED.forEach(folder => {
  const fromPath = path.join(SRC_DIR, folder);
  const toPath = path.join(SRC_DIR, 'shared', folder);
  if (fs.existsSync(fromPath)) {
    console.log(`📦 Moving ${folder} -> shared/${folder}`);
    const files = fs.readdirSync(fromPath);
    files.forEach(file => {
      const srcFile = path.join(fromPath, file);
      if (fs.statSync(srcFile).isFile()) {
        safeMove(srcFile, path.join(toPath, file));
      }
    });
  }
});

// UI elements
if (fs.existsSync(path.join(SRC_DIR, 'components', 'ui'))) {
  console.log(`📦 Moving components/ui -> shared/ui`);
  const files = fs.readdirSync(path.join(SRC_DIR, 'components', 'ui'));
  files.forEach(f => safeMove(path.join(SRC_DIR, 'components', 'ui', f), path.join(SRC_DIR, 'shared', 'ui', f)));
}

// Components
const DASH_COMPS = ['AdminTopBar.tsx', 'BibleProjectionWidget.tsx', 'BibleSearchEditor.tsx', 'DashboardWrapper.tsx', 'FeedbackButton.tsx', 'HandsfreeBibleWidget.tsx', 'HelpSupport.tsx', 'LiveControlCentre.tsx', 'MyMediaPatch.tsx', 'OBSControlPanel.tsx', 'OBSSettingsTab.tsx', 'OBSStatusBadge.tsx', 'OnScreenBibleEditor.tsx', 'OnScreenBibleEditor_Fixed.tsx', 'ProfileSettings.tsx', 'ResourceCentreAdmin.tsx', 'SceneMappingModal.tsx', 'ServiceSectionManager.tsx', 'SongBrowser.tsx', 'SongEditorModal.tsx', 'SongImportModal.tsx', 'SongProjectionWidget.tsx', 'SongSearchModal.tsx', 'SongViewerModal.tsx', 'SongbookModal.tsx', 'SubscriptionManagement.tsx', 'SupportCentreAdmin.tsx'];
DASH_COMPS.forEach(f => safeMove(path.join(SRC_DIR, 'components', f), path.join(SRC_DIR, 'features', 'dashboard', 'components', f)));

const WEB_COMPS = ['Footer.tsx', 'PayPalButton.tsx'];
WEB_COMPS.forEach(f => safeMove(path.join(SRC_DIR, 'components', f), path.join(SRC_DIR, 'features', 'web', 'components', f)));

if (fs.existsSync(path.join(SRC_DIR, 'components', 'modals'))) {
  const files = fs.readdirSync(path.join(SRC_DIR, 'components', 'modals'));
  files.forEach(f => safeMove(path.join(SRC_DIR, 'components', 'modals', f), path.join(SRC_DIR, 'features', 'dashboard', 'components', 'modals', f)));
}

// Pages
const DASH_PAGES = ['AdminManagement.tsx', 'AdminSettings.tsx', 'Dashboard.tsx', 'LivePresentation.tsx', 'LowerThirdDemoPage.tsx', 'LowerThirdEditorPageWrapper.tsx', 'LowerThirdRenderPage.tsx', 'LowerThirdSettingsPageWrapper.tsx', 'OBSPresentationView.tsx', 'SuperAdmin.tsx', 'SuperAdminMediaAssets.tsx', 'SuperAdminSidebar.tsx', 'SuperAdminSidebar.tsx.backup', 'UserProfileView.tsx', 'not-found.tsx'];
DASH_PAGES.forEach(f => safeMove(path.join(SRC_DIR, 'pages', f), path.join(SRC_DIR, 'features', 'dashboard', 'pages', f)));

const WEB_PAGES = ['AssetsPage.tsx', 'AssetsPageOld.tsx', 'Contact.tsx', 'DocsPage.tsx', 'EndUserLicense.tsx', 'Features.tsx', 'GuidesPage.tsx', 'HelpSupport.tsx', 'PoliciesView.tsx', 'PolicyEditor.tsx', 'PolicyViewer.tsx', 'PrivacyPolicy.tsx', 'RefundPolicy.tsx', 'PayPalCheckout.tsx', 'PaymentSuccess.tsx', 'StripeCheckout.tsx'];
WEB_PAGES.forEach(f => safeMove(path.join(SRC_DIR, 'pages', f), path.join(SRC_DIR, 'features', 'web', 'pages', f)));

// Aliases
console.log(`🔄 Rewriting import alias definitions everywhere...`);
const allFiles = getAllFiles(SRC_DIR, '', [], null, /\.(tsx|ts)$/);

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/from\s+['"]@\/(hooks|lib|services|utils|stores)\//g, 'from "@/shared/$1/');
  content = content.replace(/import\s+({[^}]+})\s+from\s+['"]@\/(hooks|lib|services|utils|stores)\//g, 'import $1 from "@/shared/$1/');
  
  content = content.replace(/from\s+['"]@\/components\/ui\//g, 'from "@/shared/ui/');
  
  DASH_COMPS.forEach(c => {
    const base = c.replace('.tsx', '');
    content = content.replace(new RegExp(`from\\s+['"]@\\/components\\/${base}['"]`, 'g'), `from "@/features/dashboard/components/${base}"`);
  });
  WEB_COMPS.forEach(c => {
    const base = c.replace('.tsx', '');
    content = content.replace(new RegExp(`from\\s+['"]@\\/components\\/${base}['"]`, 'g'), `from "@/features/web/components/${base}"`);
  });
  DASH_PAGES.forEach(c => {
    const base = c.replace(/(\.tsx|\.ts)$/, '');
    content = content.replace(new RegExp(`from\\s+['"]@\\/pages\\/${base}['"]`, 'g'), `from "@/features/dashboard/pages/${base}"`);
  });
  WEB_PAGES.forEach(c => {
    const base = c.replace(/(\.tsx|\.ts)$/, '');
    content = content.replace(new RegExp(`from\\s+['"]@\\/pages\\/${base}['"]`, 'g'), `from "@/features/web/pages/${base}"`);
  });
  
  content = content.replace(/from\s+['"]@\/components\/modals\//g, 'from "@/features/dashboard/components/modals/');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('✅ FSD Migration Completed Successfully! Please immediately check if any remaining empty folders are left in /src.');
