import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Music, Mic, Layout } from "lucide-react";
import { OBSSettingsTab } from "@/features/dashboard/components/OBSSettingsTab";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import { useAuth } from "@/hooks/use-auth";
import obsLogo from "@assets/image_29_1764787107029.png";
import ccliLogo from "@assets/image_30_1764787107029.png";
import qworshipMicLogo from "@assets/Group_1171275616_1764787107028.png";

interface IntegrationOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component?: React.ReactNode;
}

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("obs");

  const integrations: IntegrationOption[] = [
    {
      id: "obs",
      name: "OBS",
      description: "Configure your OBS WebSocket connection details",
      icon: (
        <img
          src={obsLogo}
          alt="OBS"
          className="w-8 h-8 rounded-lg object-contain"
        />
      ),
    },
    {
      id: "ccli",
      name: "CCLI",
      description:
        "Configure your CCLI Integration with for licensed songs and resources.",
      icon: (
        <img
          src={ccliLogo}
          alt="CCLI"
          className="w-8 h-8 rounded-lg object-contain"
        />
      ),
    },
    {
      id: "qworship-mic",
      name: "Q-worship Mic",
      description: "Configure your Q-worship microphone integration settings",
      icon: (
        <img
          src={qworshipMicLogo}
          alt="Q-worship Mic"
          className="w-8 h-8 rounded-lg object-contain"
        />
      ),
    },
    {
      id: "lower-third",
      name: "Lower Third",
      description: "Configure lower third overlay rendering and display page",
      icon: (
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <Layout className="w-5 h-5 text-purple-400" />
        </div>
      ),
    },
  ];

  const renderIntegrationContent = () => {
    switch (selectedIntegration) {
      case "obs":
        return <OBSSettingsTab />;
      case "ccli":
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <Music className="w-16 h-16 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              CCLI Integration
            </h3>
            <p className="text-gray-400 max-w-md">
              CCLI integration coming soon. Connect your CCLI account to access
              licensed songs and display proper licensing information during
              services.
            </p>
          </div>
        );
      case "qworship-mic":
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <Mic className="w-16 h-16 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Q-worship Mic
            </h3>
            <p className="text-gray-400 max-w-md">
              Q-worship Mic integration coming soon. Connect your microphone for
              voice commands and hands-free Bible navigation.
            </p>
          </div>
        );
      case "lower-third":
        return <LowerThirdIntegrationContent />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-5xl w-[92vw] h-[85vh] max-h-[800px] bg-[#0f0920] border-gray-700 p-0 flex flex-col"
        data-testid="modal-integrations">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-[#C77DFF]">
            Integration Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage all integration settings for your Q-worship account. Select
            how you will want third party applications to work
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left sidebar - integration options */}
          <div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-gray-700/50 flex-shrink-0">
            <div className="space-y-2">
              {integrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => setSelectedIntegration(integration.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                    selectedIntegration === integration.id
                      ? "bg-[#3d2f5f] border border-purple-500/50"
                      : "bg-transparent hover:bg-[#1a0f2e] border border-transparent"
                  }`}
                  data-testid={`integration-option-${integration.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">{integration.icon}</div>
                    <div>
                      <h4
                        className={`font-semibold ${
                          selectedIntegration === integration.id
                            ? "text-white"
                            : "text-gray-300"
                        }`}>
                        {integration.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right content - scrollable */}
          <div className="lg:w-2/3 flex-1 overflow-y-auto p-6">
            {renderIntegrationContent()}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700/50 flex-shrink-0">
          <Button
            onClick={onClose}
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
            data-testid="button-close-integrations">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LowerThirdIntegrationContent() {
  const {
    enabled,
    setEnabled,
    renderPageEnabled,
    setRenderPageEnabled,
    getRenderUrl,
  } = useLowerThirdStore();
  const { user: authUser } = useAuth();
  const [ltBase, setLtBase] = useState("http://localhost:3400");

  useEffect(() => {
    fetch("/api/lower-third/config", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ltBaseUrl) setLtBase(d.ltBaseUrl);
      })
      .catch(() => {});
  }, []);

  const renderUrl = authUser?.id
    ? `${ltBase}/r/${authUser.id}`
    : getRenderUrl();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
          <Layout className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">
            Lower Third Overlay
          </h3>
          <p className="text-gray-400 text-sm">
            Configure how lower third overlays appear during your live
            presentations. Lower thirds display Bible verses, references, and
            other content at the bottom of your broadcast screen.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-[#1a0f2e] rounded-xl border border-gray-700/50">
          <div>
            <h4 className="text-white font-medium">Enable Lower Thirds</h4>
            <p className="text-gray-400 text-sm mt-0.5">
              Show lower third overlays during live presentations
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              enabled ? "bg-purple-600" : "bg-gray-600"
            }`}>
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-[#1a0f2e] rounded-xl border border-gray-700/50">
          <div>
            <h4 className="text-white font-medium">Custom Render Page</h4>
            <p className="text-gray-400 text-sm mt-0.5">
              Enable a dedicated page for rendering lower thirds as a browser
              source in OBS or other streaming software
            </p>
          </div>
          <button
            onClick={() => setRenderPageEnabled(!renderPageEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              renderPageEnabled ? "bg-purple-600" : "bg-gray-600"
            }`}>
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                renderPageEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {renderPageEnabled && (
          <div className="p-4 bg-[#1a0f2e] rounded-xl border border-gray-700/50">
            <h4 className="text-white font-medium mb-2">Render Page URL</h4>
            <p className="text-gray-400 text-sm mb-3">
              Use this URL as a Browser Source in OBS Studio to overlay lower
              thirds on your stream.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-800/50 px-3 py-2 rounded text-purple-300 text-sm font-mono truncate">
                {renderUrl}
              </code>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(renderUrl);
                }}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-600/20 flex-shrink-0">
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
