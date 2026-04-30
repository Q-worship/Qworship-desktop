import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Cable,
  Crown,
  Maximize,
  Monitor,
  Radio,
  ScreenShare,
  SlidersHorizontal,
  Tv,
  Waves,
} from "lucide-react";
import {
  ConnectionMethod,
  NDIBandwidth,
  NDIColorFormat,
  NDIFrameRate,
  NDIResolution,
  useDisplayModeStore,
} from "@/stores/useDisplayModeStore";

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONNECTION_OPTIONS: Array<{
  value: ConnectionMethod;
  label: string;
  description: string;
  badge?: string;
}> = [
  {
    value: "wired",
    label: "Wired - HDMI",
    description: "Send the audience screen to a selected external projector, TV, or monitor.",
  },
  {
    value: "ndi",
    label: "Wireless - NDI",
    description: "Configure the audience output and lower third for network-based delivery.",
  },
  {
    value: "both",
    label: "Both",
    description: "Use HDMI for the room display while keeping NDI output active at the same time.",
    badge: "Pro Feature",
  },
];

const RESOLUTION_OPTIONS: Array<{ value: NDIResolution; label: string }> = [
  { value: "1920x1080", label: "1080p (1920 × 1080)" },
  { value: "1280x720", label: "720p (1280 × 720)" },
  { value: "3840x2160", label: "4K (3840 × 2160)" },
];

const FRAME_RATE_OPTIONS: Array<{ value: NDIFrameRate; label: string }> = [
  { value: "24", label: "24 fps" },
  { value: "30", label: "30 fps" },
  { value: "60", label: "60 fps" },
];

const BANDWIDTH_OPTIONS: Array<{ value: NDIBandwidth; label: string }> = [
  { value: "highest", label: "Highest Quality" },
  { value: "balanced", label: "Balanced" },
  { value: "lowest", label: "Lowest Bandwidth" },
];

const COLOR_FORMAT_OPTIONS: Array<{ value: NDIColorFormat; label: string }> = [
  { value: "uyvy422", label: "UYVY 4:2:2" },
  { value: "rgba", label: "RGBA" },
  { value: "bgra", label: "BGRA" },
];

const sectionCardClass = "rounded-2xl border border-white/10 bg-[#1a0f2e] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.24)]";
const controlClass = "bg-[#0f0920] border-white/10 text-white focus-visible:ring-[#8b5cf6]";

export function DisplaySettingsModal({ isOpen, onClose }: DisplaySettingsModalProps) {
  const { toast } = useToast();
  const availableDisplays = useDisplayModeStore((state) => state.availableDisplays);
  const targetDisplayId = useDisplayModeStore((state) => state.targetDisplayId);
  const connectionMethod = useDisplayModeStore((state) => state.connectionMethod);
  const fullscreenOnLive = useDisplayModeStore((state) => state.fullscreenOnLive);
  const ndiSettings = useDisplayModeStore((state) => state.ndiSettings);
  const setAvailableDisplays = useDisplayModeStore((state) => state.setAvailableDisplays);
  const applyLiveSettings = useDisplayModeStore((state) => state.applyLiveSettings);

  const [draftDisplayId, setDraftDisplayId] = useState<string>(targetDisplayId ?? "auto");
  const [draftConnectionMethod, setDraftConnectionMethod] = useState<ConnectionMethod>(connectionMethod);
  const [draftFullscreenOnLive, setDraftFullscreenOnLive] = useState<boolean>(fullscreenOnLive);
  const [draftNdiSettings, setDraftNdiSettings] = useState(ndiSettings);

  useEffect(() => {
    if (!isOpen) return;

    setDraftDisplayId(targetDisplayId ?? "auto");
    setDraftConnectionMethod(connectionMethod);
    setDraftFullscreenOnLive(fullscreenOnLive);
    setDraftNdiSettings(ndiSettings);

    const loadDisplays = async () => {
      try {
        const electronApi = window.api as
          | {
              display?: {
                getOutputs?: () => Promise<unknown>;
              };
            }
          | undefined;
        const displays = await electronApi?.display?.getOutputs?.();
        if (Array.isArray(displays) && displays.length > 0) {
          setAvailableDisplays(displays as Parameters<typeof setAvailableDisplays>[0]);
        }
      } catch (error) {
        console.error("[DisplaySettings] Failed to load outputs", error);
      }
    };

    void loadDisplays();
  }, [
    isOpen,
    targetDisplayId,
    connectionMethod,
    fullscreenOnLive,
    ndiSettings,
    setAvailableDisplays,
  ]);

  const displayOptions = useMemo(() => {
    if (availableDisplays.length === 0) {
      return [{ id: "auto", label: "Auto-detect primary external display", isPrimary: false }];
    }

    return [
      { id: "auto", label: "Auto-detect primary external display", isPrimary: false },
      ...availableDisplays,
    ];
  }, [availableDisplays]);

  const updateDraftNdiSettings = <K extends keyof typeof draftNdiSettings>(key: K, value: (typeof draftNdiSettings)[K]) => {
    setDraftNdiSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    applyLiveSettings({
      connectionMethod: draftConnectionMethod,
      targetDisplayId: draftDisplayId === "auto" ? null : draftDisplayId,
      fullscreenOnLive: draftFullscreenOnLive,
      ndiSettings: draftNdiSettings,
    });

    toast({
      title: "Display Settings Saved",
      description: "Audience screen and lower-third output preferences have been updated.",
      className: "bg-[#8356f3] text-white",
    });

    onClose();
  };

  const selectedConnection = CONNECTION_OPTIONS.find((option) => option.value === draftConnectionMethod);
  const showWiredSettings = draftConnectionMethod === "wired" || draftConnectionMethod === "both";
  const showNdiSettings = draftConnectionMethod === "ndi" || draftConnectionMethod === "both";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-6xl w-[94vw] h-[88vh] max-h-[920px] overflow-hidden border border-white/10 bg-[#120a22] p-0 text-white"
        data-testid="modal-display-settings"
      >
        <DialogHeader className="border-b border-white/10 bg-[linear-gradient(180deg,#2f1854_0%,#1a0f2e_100%)] px-7 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-[#d9b3ff]">Display Settings</DialogTitle>
              <DialogDescription className="max-w-3xl text-sm leading-6 text-[#c8bedf]">
                Configure how Qworship sends your audience screen and lower third to HDMI displays, NDI endpoints, or both while preserving the existing purple theme across the full experience.
              </DialogDescription>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#d9b3ff]">
              <ScreenShare className="h-6 w-6" />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <section className={sectionCardClass}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-[#7c3aed]/20 p-2 text-[#c084fc]">
                    <Cable className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Output Type</h3>
                    <p className="mt-1 text-sm leading-6 text-[#b8b0cb]">
                      Choose whether Go Live should use a wired HDMI screen, a wireless NDI pipeline, or both together for Pro workflows.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {CONNECTION_OPTIONS.map((option) => {
                    const active = draftConnectionMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDraftConnectionMethod(option.value)}
                        className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                          active
                            ? "border-[#9f67ff] bg-[#2f1854] shadow-[0_0_0_1px_rgba(159,103,255,0.4)]"
                            : "border-white/10 bg-[#140b25] hover:border-[#7041d8] hover:bg-[#1a1031]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-white">{option.label}</span>
                          {option.badge ? (
                            <Badge className="border border-[#9f67ff]/40 bg-[#9f67ff]/15 text-[#e4d2ff] hover:bg-[#9f67ff]/15">
                              {option.badge}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-3 text-xs leading-5 text-[#b8b0cb]">{option.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-[#5f3f96] bg-[#140b25] px-4 py-3 text-sm text-[#d8d2eb]">
                  <span className="font-semibold text-white">Selected mode:</span>{" "}
                  {selectedConnection?.label}. {selectedConnection?.description}
                </div>
              </section>

              {showWiredSettings ? (
                <section className={sectionCardClass}>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-[#7c3aed]/20 p-2 text-[#c084fc]">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Wired - HDMI Output</h3>
                      <p className="mt-1 text-sm leading-6 text-[#b8b0cb]">
                        Pick the exact external display that should be taken over when Go Live is triggered. If only one HDMI-capable external screen is connected, it will be the only choice shown here.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Audience Screen Source</Label>
                      <Select value={draftDisplayId} onValueChange={setDraftDisplayId}>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select HDMI output" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a0f2e] text-white">
                          {displayOptions.map((display) => (
                            <SelectItem key={display.id} value={display.id} className="text-white focus:bg-[#2f1854] focus:text-white">
                              {display.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs leading-5 text-[#b8b0cb]">
                        Qworship reads the currently connected outputs from the desktop session and stores your preferred selection for the next Go Live action.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#140b25] px-4 py-3 text-sm text-[#d8d2eb]">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <Tv className="h-4 w-4 text-[#c084fc]" />
                        HDMI behavior
                      </div>
                      <p className="mt-2 max-w-xs leading-6 text-[#b8b0cb]">
                        Once Go Live starts, the selected screen will be used for the audience output just as the current full-screen presentation flow already works.
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {showNdiSettings ? (
                <section className={sectionCardClass}>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-[#7c3aed]/20 p-2 text-[#c084fc]">
                      <Waves className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Wireless - NDI Configuration</h3>
                      <p className="mt-1 text-sm leading-6 text-[#b8b0cb]">
                        Configure the audience-screen and lower-third network delivery settings. The defaults are set to 1080p and 24 fps as requested.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Resolution</Label>
                      <Select value={draftNdiSettings.resolution} onValueChange={(value) => updateDraftNdiSettings("resolution", value as NDIResolution)}>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select resolution" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a0f2e] text-white">
                          {RESOLUTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white focus:bg-[#2f1854] focus:text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Frame Rate</Label>
                      <Select value={draftNdiSettings.frameRate} onValueChange={(value) => updateDraftNdiSettings("frameRate", value as NDIFrameRate)}>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select frame rate" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a0f2e] text-white">
                          {FRAME_RATE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white focus:bg-[#2f1854] focus:text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Bandwidth Profile</Label>
                      <Select value={draftNdiSettings.bandwidth} onValueChange={(value) => updateDraftNdiSettings("bandwidth", value as NDIBandwidth)}>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select bandwidth profile" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a0f2e] text-white">
                          {BANDWIDTH_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white focus:bg-[#2f1854] focus:text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Colour Format</Label>
                      <Select value={draftNdiSettings.colorFormat} onValueChange={(value) => updateDraftNdiSettings("colorFormat", value as NDIColorFormat)}>
                        <SelectTrigger className={controlClass}>
                          <SelectValue placeholder="Select colour format" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a0f2e] text-white">
                          {COLOR_FORMAT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white focus:bg-[#2f1854] focus:text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#140b25] p-4">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-white">Audience Screen over NDI</h4>
                          <p className="mt-1 text-xs leading-5 text-[#b8b0cb]">Enable the main audience program feed for NDI delivery.</p>
                        </div>
                        <Switch checked={draftNdiSettings.audienceEnabled} onCheckedChange={(checked) => updateDraftNdiSettings("audienceEnabled", checked)} className="data-[state=checked]:bg-[#7c3aed]" />
                      </div>
                      <Label className="mb-2 block text-sm font-medium text-white">Audience Stream Name</Label>
                      <Input value={draftNdiSettings.audienceStreamName} onChange={(event) => updateDraftNdiSettings("audienceStreamName", event.target.value)} className={controlClass} placeholder="Qworship Audience" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#140b25] p-4">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-white">Lower Third over NDI</h4>
                          <p className="mt-1 text-xs leading-5 text-[#b8b0cb]">Enable a dedicated lower-third network feed alongside the audience program output.</p>
                        </div>
                        <Switch checked={draftNdiSettings.lowerThirdEnabled} onCheckedChange={(checked) => updateDraftNdiSettings("lowerThirdEnabled", checked)} className="data-[state=checked]:bg-[#7c3aed]" />
                      </div>
                      <Label className="mb-2 block text-sm font-medium text-white">Lower Third Stream Name</Label>
                      <Input value={draftNdiSettings.lowerThirdStreamName} onChange={(event) => updateDraftNdiSettings("lowerThirdStreamName", event.target.value)} className={controlClass} placeholder="Qworship Lower Third" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#140b25] p-4">
                      <div>
                        <Label className="text-sm font-medium text-white">Include Audio</Label>
                        <p className="mt-1 text-xs leading-5 text-[#b8b0cb]">Keep audio available for NDI-capable receivers.</p>
                      </div>
                      <Switch checked={draftNdiSettings.audioEnabled} onCheckedChange={(checked) => updateDraftNdiSettings("audioEnabled", checked)} className="data-[state=checked]:bg-[#7c3aed]" />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#140b25] p-4">
                      <div>
                        <Label className="text-sm font-medium text-white">Preserve Alpha Channel</Label>
                        <p className="mt-1 text-xs leading-5 text-[#b8b0cb]">Useful when lower-third graphics need transparency-aware workflows.</p>
                      </div>
                      <Switch checked={draftNdiSettings.alphaEnabled} onCheckedChange={(checked) => updateDraftNdiSettings("alphaEnabled", checked)} className="data-[state=checked]:bg-[#7c3aed]" />
                    </div>
                  </div>
                </section>
              ) : null}

              {draftConnectionMethod === "both" ? (
                <section className={sectionCardClass}>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-[#7c3aed]/20 p-2 text-[#f0abfc]">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Both Mode (Pro Feature)</h3>
                      <p className="mt-1 text-sm leading-6 text-[#b8b0cb]">
                        This mode keeps the room projector on HDMI while also preserving your NDI audience and lower-third settings for hybrid or broadcast-ready workflows.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-[#7c3aed]/40 bg-[#140b25] p-4 text-sm leading-6 text-[#d8d2eb]">
                    When <strong className="text-white">Both</strong> is selected, Go Live will continue to use the chosen HDMI display for the room audience output while retaining your configured NDI resolution, frame rate, stream names, and lower-third toggles for simultaneous use.
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-6">
              <section className={sectionCardClass}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-[#7c3aed]/20 p-2 text-[#c084fc]">
                    <Maximize className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Go Live Behavior</h3>
                    <p className="mt-1 text-sm leading-6 text-[#b8b0cb]">
                      Decide how the audience screen should behave the moment you activate the live output.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#140b25] p-4">
                    <div>
                      <Label className="text-sm font-medium text-white">Fullscreen on Go Live</Label>
                      <p className="mt-1 text-xs leading-5 text-[#b8b0cb]">
                        Expand the selected HDMI audience screen into full-screen presentation mode immediately.
                      </p>
                    </div>
                    <Switch checked={draftFullscreenOnLive} onCheckedChange={setDraftFullscreenOnLive} className="data-[state=checked]:bg-[#7c3aed]" />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#140b25] p-4 text-sm leading-6 text-[#d8d2eb]">
                    <div className="flex items-center gap-2 font-medium text-white">
                      <Radio className="h-4 w-4 text-[#c084fc]" />
                      Current save summary
                    </div>
                    <table className="mt-3 w-full text-left text-sm">
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <th className="py-2 pr-4 font-medium text-[#b8b0cb]">Output type</th>
                          <td className="py-2 text-white">{selectedConnection?.label}</td>
                        </tr>
                        <tr>
                          <th className="py-2 pr-4 font-medium text-[#b8b0cb]">HDMI screen</th>
                          <td className="py-2 text-white">{displayOptions.find((display) => display.id === draftDisplayId)?.label ?? "Auto-detect primary external display"}</td>
                        </tr>
                        <tr>
                          <th className="py-2 pr-4 font-medium text-[#b8b0cb]">NDI resolution</th>
                          <td className="py-2 text-white">{draftNdiSettings.resolution}</td>
                        </tr>
                        <tr>
                          <th className="py-2 pr-4 font-medium text-[#b8b0cb]">NDI frame rate</th>
                          <td className="py-2 text-white">{draftNdiSettings.frameRate} fps</td>
                        </tr>
                        <tr>
                          <th className="py-2 pr-4 font-medium text-[#b8b0cb]">Lower third feed</th>
                          <td className="py-2 text-white">{draftNdiSettings.lowerThirdEnabled ? "Enabled" : "Disabled"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className={sectionCardClass}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-[#7c3aed]/20 p-2 text-[#c084fc]">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Theme Alignment</h3>
                    <p className="mt-1 text-sm leading-6 text-[#b8b0cb]">
                      This modal follows the current Qworship palette with dark purple surfaces, bright lavender accents, white primary text, and consistent border contrast across every card, field, and switch state.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-[#120a22] px-7 py-5">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/10 bg-transparent text-[#d8d2eb] hover:bg-white/5 hover:text-white"
            data-testid="button-cancel-display-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#7c3aed] text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] hover:bg-[#6d28d9]"
            data-testid="button-save-display-settings"
          >
            Save Display Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
