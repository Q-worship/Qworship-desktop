import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/auth.store";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import {
  Settings2,
  HelpCircle,
  Radio,
  Link as LinkIcon,
  SlidersHorizontal,
  Download,
  Monitor,
  MonitorStop,
  FileText,
  Copy,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NDISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NDISettingsModal({ isOpen, onClose }: NDISettingsModalProps) {
  const user = useAuthStore((s) => s.user);
  const { getRenderUrl } = useLowerThirdStore();
  const { toast } = useToast();
  const [ltBase, setLtBase] = useState("http://localhost:3400");
  const [activeTab, setActiveTab] = useState<"windows" | "macos">("windows");

  useEffect(() => {
    fetch("/api/lower-third/config", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ltBaseUrl) setLtBase(d.ltBaseUrl);
      })
      .catch(() => {});
  }, []);

  const userId = user?.id || "me";
  const audienceUrl = `${ltBase}/p/${userId}`;
  const lowerThirdUrl = `${ltBase}/r/${userId}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-5xl w-[92vw] h-[85vh] max-h-[850px] bg-[#130f1d] border-gray-700/50 p-0 flex flex-col font-sans overflow-hidden"
        data-testid="modal-ndi-settings">
        <DialogTitle className="sr-only">NDI Plugin Configuration</DialogTitle>

        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between border-b border-white/5 px-6 md:px-10 py-4 bg-[#130f1d] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-[#8b5cf6] flex items-center">
              <Settings2 className="w-8 h-8" />
            </div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-tight">
              NDI Settings
            </h2>
          </div>
          <div className="flex gap-4">
            <button className="flex-1 pb-2 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-300">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="flex-1 pb-2 border-b-2 border-[#8b5cf6] text-[#8b5cf6]">
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-10 py-8 w-full custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
                Qworship NDI Plugin Configuration
              </h1>
              <p className="text-slate-400 text-base">
                Set up and manage your Network Digital Interface for seamless
                live streaming and broadcast overlays.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Main Settings */}
              <div className="lg:col-span-2 space-y-8">
                {/* Connection Status Card */}
                <div className="bg-[#1e182d]/40 border border-white/10 p-6 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                      <Radio className="text-[#8b5cf6] w-5 h-5" />
                      Connection Status
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-xs text-slate-400">Current Stream</p>
                      <p className="font-semibold text-sm text-white mt-1">
                        Main Output (NDI)
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-xs text-slate-400">Latency</p>
                      <p className="font-semibold text-sm text-white mt-1">
                        Ultra Low Latency
                      </p>
                    </div>
                  </div>
                </div>

                {/* Browser Source Links Section */}
                <div className="bg-[#1e182d]/40 border border-white/10 p-6 rounded-xl shadow-sm backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <LinkIcon className="text-[#8b5cf6] w-5 h-5" />
                    Browser Source Links
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">
                        Audience Screen URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none"
                          readOnly
                          type="text"
                          value={audienceUrl}
                        />
                        <button
                          onClick={() =>
                            handleCopy(audienceUrl, "Audience Screen URL")
                          }
                          className="bg-[#8b5cf6] text-white px-5 rounded-lg flex items-center gap-2 justify-center hover:bg-[#8b5cf6]/90 transition-colors shadow-lg shadow-[#8b5cf6]/20 font-bold text-sm">
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">
                        Lower Third URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none"
                          readOnly
                          type="text"
                          value={lowerThirdUrl}
                        />
                        <button
                          onClick={() =>
                            handleCopy(lowerThirdUrl, "Lower Third URL")
                          }
                          className="bg-[#8b5cf6] text-white px-5 rounded-lg flex items-center gap-2 justify-center hover:bg-[#8b5cf6]/90 transition-colors shadow-lg shadow-[#8b5cf6]/20 font-bold text-sm">
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Parameters */}
                <div className="bg-[#1e182d]/40 border border-white/10 p-6 rounded-xl shadow-sm backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <SlidersHorizontal className="text-[#8b5cf6] w-5 h-5" />
                    Output Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-400">
                        Browser Source Resolution
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200">
                        1920x1080 (1080p)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-400">
                        Frame Rate
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200">
                        Dynamic (30-60 fps)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Downloads & Instructions */}
              <div className="space-y-8">
                {/* Download Plugins Section */}
                <div className="bg-[#1e182d]/40 border border-white/10 p-6 rounded-xl shadow-sm backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <Download className="text-[#8b5cf6] w-5 h-5" />
                    Download NDI Plugins
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="/QWorship-NDI-Bridge-Setup-1.0.0.exe"
                      download="QWorship-NDI-Bridge-Setup-1.0.0.exe"
                      className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-3 rounded-xl transition-all font-semibold text-sm group border border-white/5">
                      <div className="flex items-center gap-3">
                        <Monitor className="text-[#8b5cf6] w-5 h-5" />
                        <span>QWorship NDI Bridge for Windows</span>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <a
                      href="#"
                      className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-3 rounded-xl transition-all font-semibold text-sm group border border-white/5">
                      <div className="flex items-center gap-3">
                        <MonitorStop className="text-[#8b5cf6] w-5 h-5" />
                        <span>NDI for macOS</span>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>

                {/* Installation Instructions */}
                <div className="bg-[#1e182d]/40 border border-white/10 p-6 rounded-xl shadow-sm backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <FileText className="text-[#8b5cf6] w-5 h-5" />
                    Setting Up NDI
                  </h3>

                  {/* Tabs Navigation */}
                  <div className="flex border-b border-white/10 mb-4">
                    <button
                      onClick={() => setActiveTab("windows")}
                      className={`flex-1 pb-2 border-b-2 text-sm font-bold ${activeTab === "windows" ? "border-[#8b5cf6] text-[#8b5cf6]" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                      Browser Source
                    </button>
                    <button
                      onClick={() => setActiveTab("macos")}
                      className={`flex-1 pb-2 border-b-2 text-sm font-bold ${activeTab === "macos" ? "border-[#8b5cf6] text-[#8b5cf6]" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                      NDI Output
                    </button>
                  </div>

                  {activeTab === "windows" ? (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs flex items-center justify-center font-bold">
                          1
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          In your streaming software, add a new{" "}
                          <strong>Browser Source</strong>.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs flex items-center justify-center font-bold">
                          2
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          Copy the URL above and paste it into the URL field.
                          Set width to <strong>1920</strong> and height to{" "}
                          <strong>1080</strong>.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs flex items-center justify-center font-bold">
                          3
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          Check "Hide source when not visible" for better
                          performance.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs flex items-center justify-center font-bold">
                          1
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          Install the NDI Plugin (download links above).
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs flex items-center justify-center font-bold">
                          2
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          In NDI sidebar Configuration, copy and paste the URL
                          and set the name of the NDI source.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs flex items-center justify-center font-bold">
                          3
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          Click on Start all streams button to start
                          broadcasting your NDI source to the network.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex justify-end gap-4 border-t border-white/10 pt-6">
              <Button
                variant="outline"
                className="px-6 rounded-xl border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}
