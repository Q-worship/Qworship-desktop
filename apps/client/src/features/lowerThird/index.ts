// Lower Third Feature — Public API
export { LowerThirdRenderer, LowerThirdPreviewThumbnail } from "./LowerThirdRenderer";
export { LowerThirdEditorPage } from "./LowerThirdEditorPage";
export { LowerThirdSettingsPage } from "./LowerThirdSettingsPage";
export { DEFAULT_TEMPLATES, TEMPLATE_CATEGORIES } from "./defaultTemplates";
export * from "./types";
export {
  measureTextDimensions,
  calculateOptimalFontSize,
  getResponsiveFontSize,
  clearFontMetricsCache,
} from "./fontSizingEngine";
