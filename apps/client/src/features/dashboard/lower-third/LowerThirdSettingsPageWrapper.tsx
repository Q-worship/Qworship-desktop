import { useLocation } from "wouter";
import { LowerThirdSettingsPage } from "@/features/lowerThird";

export default function LowerThirdSettingsPageWrapper() {
  const [, navigate] = useLocation();

  return (
    <LowerThirdSettingsPage onClose={() => navigate("/qworship-home")} />
  );
}
