import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Book, Monitor, ChevronRight, ChevronDown, ExternalLink, Copy, Check, Settings, Wifi, Lock, Plug, Play, Eye, Radio, Download, MonitorStop, SlidersHorizontal, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import qworshipLogo from "@assets/Group 1_1754122708985.png";

interface GuideArticle {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
}

const guideArticles: GuideArticle[] = [
  {
    id: "obs-setup",
    title: "Setting up OBS",
    description: "Learn how to connect OBS Studio to your Q-worship account for live streaming and broadcasting",
    icon: Monitor,
    category: "Integrations"
  },
  {
    id: "ndi-setup",
    title: "NDI Setup Guide",
    description: "Set up and manage your Network Device Interface for seamless live streaming and broadcast overlays",
    icon: Radio,
    category: "Integrations"
  }
];

export function GuidesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedGuide, setSelectedGuide] = useState<string | null>("obs-setup");
  const [expandedSections, setExpandedSections] = useState<string[]>(["step-1", "step-2", "step-3", "step-4", "step-5"]);
  const [ndiActiveTab, setNdiActiveTab] = useState<"browser" | "ndi">("browser");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
      className: "bg-[#8356f3] text-white",
    });
  };

  const renderOBSGuide = () => (
    <div className="space-y-6" data-testid="guide-obs-setup-content">
      <div className="border-b border-gray-700 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="text-guide-title">Setting up OBS</h1>
            <p className="text-gray-400">Connect OBS Studio to Q-worship for professional live streaming</p>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed">
          OBS (Open Broadcaster Software) is a powerful, free tool for live streaming and recording. 
          By connecting OBS to your Q-worship account, you can broadcast your church presentations, 
          control scenes remotely, and deliver professional-quality live streams to your congregation.
        </p>
      </div>

      <div className="bg-[#1a0f2e] rounded-lg border border-gray-700 p-4">
        <h3 className="text-white font-medium mb-2">What you'll need:</h3>
        <ul className="text-gray-300 space-y-2">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            OBS Studio installed on your computer (version 28.0 or later)
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            Q-worship account with active subscription
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            Both applications running on the same network
          </li>
        </ul>
      </div>

      <div className="space-y-4" data-testid="guide-steps-container">
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("step-1")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-step-1"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <span className="text-white font-medium">Enable WebSocket Server in OBS</span>
            </div>
            {expandedSections.includes("step-1") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("step-1") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  First, you need to enable the WebSocket server in OBS Studio. This allows Q-worship to communicate with OBS.
                </p>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">1.</span>
                    <span>Open OBS Studio on your computer</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">2.</span>
                    <span>Go to <strong className="text-white">Tools</strong> in the menu bar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">3.</span>
                    <span>Click on <strong className="text-white">WebSocket Server Settings</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">4.</span>
                    <span>Check the box that says <strong className="text-white">"Enable WebSocket server"</strong></span>
                  </li>
                </ol>
                <div className="bg-[#1a0f2e] rounded-lg p-3 border border-purple-600/30">
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <Settings className="w-4 h-4" />
                    <span>Tools → WebSocket Server Settings → Enable WebSocket server</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("step-2")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-step-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <span className="text-white font-medium">Configure WebSocket Authentication</span>
            </div>
            {expandedSections.includes("step-2") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("step-2") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  For security, OBS uses a password to authenticate connections. You'll need this password to connect Q-worship.
                </p>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">1.</span>
                    <span>In the WebSocket Server Settings window, check <strong className="text-white">"Enable Authentication"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">2.</span>
                    <span>Click <strong className="text-white">"Show Connect Info"</strong> button</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">3.</span>
                    <span>Copy the <strong className="text-white">Server Password</strong> shown in the popup</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">4.</span>
                    <span>Keep this password safe - you'll need it in the next step</span>
                  </li>
                </ol>
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-yellow-300 text-sm">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Security Tip:</strong> Never share your OBS WebSocket password publicly. 
                      Q-worship stores it securely and never transmits it to external servers.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("step-3")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-step-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <span className="text-white font-medium">Note the Connection Details</span>
            </div>
            {expandedSections.includes("step-3") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("step-3") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  You'll need the host address and port number to connect Q-worship to OBS.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <label className="text-gray-400 text-sm block mb-2">Default Host</label>
                    <div className="flex items-center justify-between">
                      <code className="text-white font-mono">localhost</code>
                      <button
                        onClick={() => copyToClipboard("localhost", "Host")}
                        className="p-1.5 rounded hover:bg-purple-600/20 text-gray-400 hover:text-white transition-colors"
                        data-testid="button-copy-host"
                      >
                        {copiedText === "Host" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <label className="text-gray-400 text-sm block mb-2">Default Port</label>
                    <div className="flex items-center justify-between">
                      <code className="text-white font-mono">4455</code>
                      <button
                        onClick={() => copyToClipboard("4455", "Port")}
                        className="p-1.5 rounded hover:bg-purple-600/20 text-gray-400 hover:text-white transition-colors"
                        data-testid="button-copy-port"
                      >
                        {copiedText === "Port" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1a0f2e] rounded-lg p-3 border border-purple-600/30">
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <Wifi className="w-4 h-4" />
                    <span>If OBS is on a different computer, use that computer's IP address instead of "localhost"</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("step-4")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-step-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <span className="text-white font-medium">Connect Q-worship to OBS</span>
            </div>
            {expandedSections.includes("step-4") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("step-4") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  Now you're ready to connect Q-worship to OBS using the Integrations settings.
                </p>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">1.</span>
                    <span>In Q-worship, click <strong className="text-white">Settings</strong> in the top navigation bar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">2.</span>
                    <span>Select <strong className="text-white">Integrations</strong> from the dropdown menu</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">3.</span>
                    <span>Find <strong className="text-white">OBS Studio</strong> in the integrations list</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">4.</span>
                    <span>Click <strong className="text-white">Connect</strong> to open the OBS connection form</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">5.</span>
                    <span>Enter the following details:</span>
                  </li>
                </ol>
                <div className="ml-8 space-y-2">
                  <div className="bg-[#1a0f2e] rounded-lg p-3 border border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Host:</span>
                        <span className="text-white ml-2 font-mono">localhost</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Port:</span>
                        <span className="text-white ml-2 font-mono">4455</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-3 border border-gray-700">
                    <span className="text-gray-400 text-sm">Password:</span>
                    <span className="text-white ml-2 text-sm">(The password you copied from OBS)</span>
                  </div>
                </div>
                <ol className="space-y-3 text-gray-300" start={6}>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">6.</span>
                    <span>Click <strong className="text-white">Save &amp; Connect</strong></span>
                  </li>
                </ol>
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-300 text-sm">
                    <Plug className="w-4 h-4" />
                    <span>When connected successfully, you'll see a green "Connected" status indicator</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("step-5")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-step-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                5
              </div>
              <span className="text-white font-medium">Start Using OBS with Q-worship</span>
            </div>
            {expandedSections.includes("step-5") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("step-5") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  Once connected, you can control OBS directly from Q-worship. Here's what you can do:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Start/Stop Streaming</span>
                    </div>
                    <p className="text-gray-400 text-sm">Control your live stream directly from Q-worship</p>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Switch Scenes</span>
                    </div>
                    <p className="text-gray-400 text-sm">Change between OBS scenes during your presentation</p>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Preview Content</span>
                    </div>
                    <p className="text-gray-400 text-sm">See how your slides will appear in OBS</p>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-5 h-5 text-orange-400" />
                      <span className="text-white font-medium">Real-time Sync</span>
                    </div>
                    <p className="text-gray-400 text-sm">Your presentations sync instantly with OBS sources</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1a0f2e] rounded-lg border border-gray-700 p-6 mt-8">
        <h3 className="text-white font-semibold mb-3">Troubleshooting</h3>
        <div className="space-y-4 text-gray-300">
          <div>
            <p className="font-medium text-white">Connection Failed?</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1 ml-2">
              <li>Make sure OBS is running and the WebSocket server is enabled</li>
              <li>Verify the password matches exactly (it's case-sensitive)</li>
              <li>Check that no firewall is blocking port 4455</li>
              <li>Ensure both applications are on the same network</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-white">Wrong Password Error?</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1 ml-2">
              <li>In OBS, go to Tools → WebSocket Server Settings</li>
              <li>Click "Show Connect Info" to see the current password</li>
              <li>Copy and paste the password to avoid typos</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-700">
        <Button
          onClick={() => setLocation("/dashboard")}
          className="bg-[#2a1f4b] border border-purple-600/50 text-white hover:bg-purple-600/40"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button
          onClick={() => setLocation("/dashboard?openIntegrations=true")}
          className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
          data-testid="button-open-integrations"
        >
          Open Integrations Settings
        </Button>
      </div>
    </div>
  );

  const renderNDIGuide = () => (
    <div className="space-y-6" data-testid="guide-ndi-setup-content">
      <div className="border-b border-gray-700 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Radio className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="text-ndi-guide-title">NDI Setup Guide</h1>
            <p className="text-gray-400">Set up Network Device Interface for professional live streaming overlays</p>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed">
          NDI (Network Device Interface) enables high-quality, low-latency video transfer over your local network.
          By setting up Q-worship with NDI, you can send your presentations and lower-third overlays directly
          to any NDI-compatible hardware or software on your network — including OBS, vMix, Wirecast, and more.
        </p>
      </div>

      <div className="bg-[#1a0f2e] rounded-lg border border-gray-700 p-4">
        <h3 className="text-white font-medium mb-2">What you'll need:</h3>
        <ul className="text-gray-300 space-y-2">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            A Q-worship account with an active subscription
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            OBS Studio, vMix, or another NDI-compatible application
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            The QWorship NDI Bridge plugin (download link below)
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            All devices on the same local network
          </li>
        </ul>
      </div>

      <div className="space-y-4" data-testid="ndi-guide-steps-container">
        {/* Step 1: Download NDI Plugin */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("ndi-step-1")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-ndi-step-1"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <span className="text-white font-medium">Download the QWorship NDI Bridge</span>
            </div>
            {expandedSections.includes("ndi-step-1") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("ndi-step-1") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  The QWorship NDI Bridge converts your Q-worship browser sources into NDI streams that can be received by any NDI-compatible software on your network.
                </p>
                <div className="space-y-3">
                  <a
                    href="/QWorship-NDI-Bridge-Setup-1.0.0.exe"
                    download="QWorship-NDI-Bridge-Setup-1.0.0.exe"
                    className="w-full flex items-center justify-between gap-3 bg-purple-600/10 hover:bg-purple-600/20 text-slate-300 px-4 py-3 rounded-xl transition-all font-semibold text-sm group border border-purple-600/30"
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="text-purple-400 w-5 h-5" />
                      <div>
                        <span className="text-white">QWorship NDI Bridge for Windows</span>
                        <p className="text-xs text-gray-500 font-normal mt-0.5">v1.0.0 · Windows 10/11</p>
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-purple-400" />
                  </a>
                  <a
                    href="#"
                    className="w-full flex items-center justify-between gap-3 bg-white/5 text-slate-500 px-4 py-3 rounded-xl transition-all font-semibold text-sm border border-white/5 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <MonitorStop className="w-5 h-5" />
                      <div>
                        <span>NDI Bridge for macOS</span>
                        <p className="text-xs font-normal mt-0.5">Coming soon</p>
                      </div>
                    </div>
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Install & Launch */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("ndi-step-2")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-ndi-step-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <span className="text-white font-medium">Install and Launch the NDI Bridge</span>
            </div>
            {expandedSections.includes("ndi-step-2") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("ndi-step-2") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  Run the installer and follow the on-screen instructions. Once installed, launch the QWorship NDI Bridge application.
                </p>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">1.</span>
                    <span>Run <strong className="text-white">QWorship-NDI-Bridge-Setup-1.0.0.exe</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">2.</span>
                    <span>Follow the installer prompts and accept the license agreement</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">3.</span>
                    <span>Launch <strong className="text-white">QWorship NDI Bridge</strong> from the Start Menu or Desktop shortcut</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-mono">4.</span>
                    <span>The bridge will appear in your system tray and start listening for sources</span>
                  </li>
                </ol>
                <div className="bg-[#1a0f2e] rounded-lg p-3 border border-purple-600/30">
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <Settings className="w-4 h-4" />
                    <span>The NDI Bridge runs in the background and can be configured from the system tray icon</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Get Your Browser Source URLs */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("ndi-step-3")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-ndi-step-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <span className="text-white font-medium">Get Your Browser Source URLs</span>
            </div>
            {expandedSections.includes("ndi-step-3") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("ndi-step-3") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  Q-worship provides two browser source URLs — one for the main audience screen and one for the lower-third overlay. You can find both in <strong className="text-white">Settings → NDI Settings</strong> within the Q-worship dashboard.
                </p>
                <div className="space-y-3">
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-purple-400" />
                      <label className="text-gray-400 text-sm font-medium">Audience Screen URL</label>
                    </div>
                    <code className="text-white font-mono text-sm block bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                      http://&lt;your-server&gt;/p/&lt;your-user-id&gt;
                    </code>
                    <p className="text-xs text-gray-500 mt-2">Full-screen presentation view for your audience</p>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-purple-400" />
                      <label className="text-gray-400 text-sm font-medium">Lower Third Overlay URL</label>
                    </div>
                    <code className="text-white font-mono text-sm block bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                      http://&lt;your-server&gt;/r/&lt;your-user-id&gt;
                    </code>
                    <p className="text-xs text-gray-500 mt-2">Transparent overlay for lower-third graphics</p>
                  </div>
                </div>
                <div className="bg-[#1a0f2e] rounded-lg p-3 border border-purple-600/30">
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <Wifi className="w-4 h-4" />
                    <span>Your exact URLs with your user ID are available in <strong>Settings → NDI Settings</strong> — you can copy them directly from there</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Configure Your Streaming Software */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("ndi-step-4")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-ndi-step-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <span className="text-white font-medium">Configure Your Streaming Software</span>
            </div>
            {expandedSections.includes("ndi-step-4") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("ndi-step-4") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  There are two ways to receive Q-worship output in your streaming software: as a <strong className="text-white">Browser Source</strong> or as an <strong className="text-white">NDI Source</strong>.
                </p>

                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-4">
                  <button
                    onClick={() => setNdiActiveTab("browser")}
                    className={`flex-1 pb-2 border-b-2 text-sm font-bold transition-colors ${
                      ndiActiveTab === "browser"
                        ? "border-purple-500 text-purple-400"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                    data-testid="button-ndi-tab-browser"
                  >
                    Browser Source
                  </button>
                  <button
                    onClick={() => setNdiActiveTab("ndi")}
                    className={`flex-1 pb-2 border-b-2 text-sm font-bold transition-colors ${
                      ndiActiveTab === "ndi"
                        ? "border-purple-500 text-purple-400"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                    data-testid="button-ndi-tab-ndi"
                  >
                    NDI Output
                  </button>
                </div>

                {ndiActiveTab === "browser" ? (
                  <div className="space-y-3">
                    <ol className="space-y-3 text-gray-300">
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">1.</span>
                        <span>In your streaming software (OBS, vMix, etc.), add a new <strong className="text-white">Browser Source</strong></span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">2.</span>
                        <span>Copy the URL from NDI Settings and paste it into the <strong className="text-white">URL field</strong>. Set width to <strong className="text-white">1920</strong> and height to <strong className="text-white">1080</strong></span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">3.</span>
                        <span>Check <strong className="text-white">"Hide source when not visible"</strong> for better performance</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">4.</span>
                        <span>For the lower-third overlay, repeat with the Lower Third URL and enable <strong className="text-white">"Shutdown source when not visible"</strong></span>
                      </li>
                    </ol>
                    <div className="bg-[#1a0f2e] rounded-lg p-3 border border-purple-600/30">
                      <div className="flex items-start gap-2 text-purple-300 text-sm">
                        <SlidersHorizontal className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Recommended resolution: <strong>1920×1080</strong> at <strong>30–60 fps</strong> for optimal quality</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ol className="space-y-3 text-gray-300">
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">1.</span>
                        <span>Install the <strong className="text-white">QWorship NDI Bridge</strong> plugin (download link in Step 1)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">2.</span>
                        <span>In the NDI Bridge configuration, copy and paste the <strong className="text-white">URL</strong> and set the <strong className="text-white">name of the NDI source</strong></span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">3.</span>
                        <span>Click <strong className="text-white">Start All Streams</strong> to begin broadcasting your NDI sources to the network</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-purple-400 font-mono">4.</span>
                        <span>In your streaming software, add a new <strong className="text-white">NDI Source</strong> and select the Q-worship stream from the list</span>
                      </li>
                    </ol>
                    <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-300 text-sm">
                        <Plug className="w-4 h-4" />
                        <span>NDI sources are automatically discovered by any compatible software on your local network</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 5: Go Live */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("ndi-step-5")}
            className="w-full flex items-center justify-between p-4 bg-[#1a0f2e] hover:bg-[#2a1f4b] transition-colors"
            data-testid="button-ndi-step-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                5
              </div>
              <span className="text-white font-medium">Go Live with NDI</span>
            </div>
            {expandedSections.includes("ndi-step-5") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.includes("ndi-step-5") && (
            <div className="p-4 bg-[#0f0920] border-t border-gray-700">
              <div className="space-y-4">
                <p className="text-gray-300">
                  Once configured, your Q-worship output will be available as a live source. Here's what you can do:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Real-time Slides</span>
                    </div>
                    <p className="text-gray-400 text-sm">Slides update instantly as you advance through your presentation</p>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Lower Third Overlays</span>
                    </div>
                    <p className="text-gray-400 text-sm">Scripture references, song titles and announcements appear automatically</p>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Transparent Backgrounds</span>
                    </div>
                    <p className="text-gray-400 text-sm">Lower-third overlays render with transparency for clean compositing</p>
                  </div>
                  <div className="bg-[#1a0f2e] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-5 h-5 text-orange-400" />
                      <span className="text-white font-medium">Ultra Low Latency</span>
                    </div>
                    <p className="text-gray-400 text-sm">NDI delivers sub-frame latency for perfectly-timed broadcasts</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-[#1a0f2e] rounded-lg border border-gray-700 p-6 mt-8">
        <h3 className="text-white font-semibold mb-3">Troubleshooting</h3>
        <div className="space-y-4 text-gray-300">
          <div>
            <p className="font-medium text-white">NDI source not appearing?</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1 ml-2">
              <li>Ensure the QWorship NDI Bridge is running</li>
              <li>Verify all devices are on the same local network or VLAN</li>
              <li>Check that your firewall is not blocking NDI traffic (ports 5960–5990)</li>
              <li>Restart the NDI Bridge and your streaming software</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-white">Browser source showing a blank page?</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1 ml-2">
              <li>Make sure the Q-worship server is running and accessible</li>
              <li>Double-check the URL — it should include your user ID</li>
              <li>Verify that the browser source resolution is set to <strong className="text-white">1920×1080</strong></li>
              <li>Clear the browser source cache in your streaming software</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-white">High latency or dropped frames?</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1 ml-2">
              <li>Use a wired Ethernet connection instead of Wi-Fi for best performance</li>
              <li>Close unnecessary browser tabs and applications</li>
              <li>Ensure your network supports Gigabit speeds for 1080p NDI</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-700">
        <Button
          onClick={() => setLocation("/dashboard")}
          className="bg-[#2a1f4b] border border-purple-600/50 text-white hover:bg-purple-600/40"
          data-testid="button-ndi-back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0920]">
      <header className="bg-[#1a0f2e] px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <img 
            src={qworshipLogo}
            alt="Q-worship Logo"
            className="w-8 h-8"
          />
          <span className="text-white font-semibold text-lg">Q-worship Guides</span>
        </div>
        <Button
          onClick={() => setLocation("/dashboard")}
          className="bg-[#2a1f4b] border border-purple-600/50 text-white hover:bg-purple-600/40"
          data-testid="button-header-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-80 bg-[#1a0f2e] border-r border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Guide Articles</h2>
          <div className="space-y-2">
            {guideArticles.map((article) => {
              const Icon = article.icon;
              return (
                <button
                  key={article.id}
                  onClick={() => setSelectedGuide(article.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedGuide === article.id
                      ? "bg-purple-600/20 border border-purple-600/50"
                      : "hover:bg-[#2a1f4b] border border-transparent"
                  }`}
                  data-testid={`guide-${article.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedGuide === article.id ? "bg-purple-600/30" : "bg-gray-700/50"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        selectedGuide === article.id ? "text-purple-400" : "text-gray-400"
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        selectedGuide === article.id ? "text-white" : "text-gray-300"
                      }`}>
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{article.category}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-500 text-sm">
              More guides are on the way! We're continually adding documentation for all Q-worship features.
            </p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {selectedGuide === "obs-setup" && renderOBSGuide()}
            {selectedGuide === "ndi-setup" && renderNDIGuide()}
            {!selectedGuide && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-purple-600/10 flex items-center justify-center mb-4">
                  <Book className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a Guide</h3>
                <p className="text-gray-400 max-w-sm">
                  Choose a guide from the sidebar to learn about Q-worship features and integrations.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default GuidesPage;
