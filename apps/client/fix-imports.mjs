import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');

console.log('🚀 Starting Precision Import Fixer...');

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

const DASH_COMPS = ['AdminTopBar', 'BibleProjectionWidget', 'BibleSearchEditor', 'DashboardWrapper', 'FeedbackButton', 'HandsfreeBibleWidget', 'HelpSupport', 'LiveControlCentre', 'MyMediaPatch', 'OBSControlPanel', 'OBSSettingsTab', 'OBSStatusBadge', 'OnScreenBibleEditor', 'OnScreenBibleEditor_Fixed', 'ProfileSettings', 'ResourceCentreAdmin', 'SceneMappingModal', 'ServiceSectionManager', 'SongBrowser', 'SongEditorModal', 'SongImportModal', 'SongProjectionWidget', 'SongSearchModal', 'SongViewerModal', 'SongbookModal', 'SubscriptionManagement', 'SupportCentreAdmin', 'AppHeader', 'SecondaryToolbar', 'ModalsContainer', 'CloudMediaTab', 'MyMediaTab', 'ServiceSectionsSidebar', 'SlideDisplayArea', 'SlideEditorPanel', 'EditAndPreparationArea', 'StylesDropdown', 'RecordingSettingsTab'];
const WEB_COMPS = ['Footer', 'PayPalButton', 'CookieConsent', 'PageTransition'];

console.log(`Scanning ${allFiles.length} files for broken imports...`);

let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Fix broken Relative Dashboard Imports (../components)
  content = content.replace(/from\s+['"]\.\.\/components\/modals\/(.*?)['"]/g, 'from "@/features/dashboard/components/modals/$1"');
  content = content.replace(/from\s+['"]\.\.\/components\/(.*?)['"]/g, 'from "@/features/dashboard/components/$1"');
  content = content.replace(/from\s+['"]\.\.\/hooks\/(.*?)['"]/g, 'from "@/shared/hooks/$1"');

  // 2. Fix Absolute UI Component Imports
  content = content.replace(/from\s+['"]@\/components\/ui\/(.*?)['"]/g, 'from "@/shared/ui/$1"');
  
  // 3. Fix Absolute Modal Imports
  content = content.replace(/from\s+['"]@\/components\/modals\/(.*?)['"]/g, 'from "@/features/dashboard/components/modals/$1"');
  content = content.replace(/from\s+['"]@\/components\/Auth(.*?)\/(.*?)['"]/g, 'from "@/features/auth/components/Auth$1/$2"');

  // 4. Fix absolute specific Dashboard Components
  for (const comp of DASH_COMPS) {
    content = content.replace(new RegExp(`from\\s+['"]@\\/components\\/${comp}['"]`, 'g'), `from "@/features/dashboard/components/${comp}"`);
  }

  // 5. Fix absolute specific Web Components
  for (const comp of WEB_COMPS) {
    content = content.replace(new RegExp(`from\\s+['"]@\\/components\\/${comp}['"]`, 'g'), `from "@/features/web/components/${comp}"`);
  }

  // 6. Fix Sections
  content = content.replace(/from\s+['"]@\/components\/sections\/(DynamicMediaSections|MediaFilterSection|MediaGallerySection|RecentMediaSection)['"]/g, 'from "@/features/dashboard/components/sections/$1"');

  // 7. Fix Top-Level Shared (hooks, lib, services, etc)
  content = content.replace(/from\s+['"]@\/(hooks|lib|services|utils|stores)\/(.*?)['"]/g, 'from "@/shared/$1/$2"');

  // 8. Fix Absolute Pages
  const webPages = ['AssetsPage', 'AssetsPageOld', 'Contact', 'DocsPage', 'EndUserLicense', 'Features', 'GuidesPage', 'PoliciesView', 'PolicyEditor', 'PolicyViewer', 'PrivacyPolicy', 'RefundPolicy', 'PayPalCheckout', 'PaymentSuccess', 'StripeCheckout', 'HelpSupport', 'QworshipHome'];
  for (const wp of webPages) {
    content = content.replace(new RegExp(`from\\s+['"]@\\/pages\\/${wp}['"]`, 'g'), `from "@/features/web/pages/${wp}"`);
  }

  const dashPages = ['AdminManagement', 'AdminSettings', 'Dashboard', 'LivePresentation', 'LowerThirdDemoPage', 'LowerThirdEditorPageWrapper', 'LowerThirdRenderPage', 'LowerThirdSettingsPageWrapper', 'OBSPresentationView', 'SuperAdmin', 'SuperAdminMediaAssets', 'SuperAdminSidebar', 'UserProfileView', 'not-found'];
  for (const dp of dashPages) {
    content = content.replace(new RegExp(`from\\s+['"]@\\/pages\\/${dp}['"]`, 'g'), `from "@/features/dashboard/pages/${dp}"`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
}

console.log(`✅ Fixed imports in ${modifiedCount} files! Start Vite to confirm.`);
