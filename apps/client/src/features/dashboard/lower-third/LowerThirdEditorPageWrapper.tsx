import { useLocation } from "wouter";
import { LowerThirdEditorPage } from "@/features/lowerThird";

export function LowerThirdEditorPageWrapper() {
  const [, navigate] = useLocation();
  return <LowerThirdEditorPage />;
}
