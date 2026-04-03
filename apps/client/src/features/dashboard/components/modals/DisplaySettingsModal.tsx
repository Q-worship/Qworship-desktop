import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Type, Palette, Layout, Maximize, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisplaySettingsModal({ isOpen, onClose }: DisplaySettingsModalProps) {
  const { toast } = useToast();
  const [fontSize, setFontSize] = useState<number[]>([16]);
  const [fontFamily, setFontFamily] = useState<string>("inter");
  const [primaryColor, setPrimaryColor] = useState<string>("#8356f3");
  const [showSlideNumbers, setShowSlideNumbers] = useState(true);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const [fullscreenOnLive, setFullscreenOnLive] = useState(true);
  const [transitionEffect, setTransitionEffect] = useState<string>("fade");
  const [transitionDuration, setTransitionDuration] = useState<number[]>([300]);

  const handleSave = () => {
    toast({
      title: "Display Settings Saved",
      description: "Your display settings have been updated successfully.",
      className: "bg-[#8356f3] text-white",
    });
  };

  const colorOptions = [
    { value: "#8356f3", label: "Purple", color: "#8356f3" },
    { value: "#3b82f6", label: "Blue", color: "#3b82f6" },
    { value: "#10b981", label: "Green", color: "#10b981" },
    { value: "#f59e0b", label: "Orange", color: "#f59e0b" },
    { value: "#ef4444", label: "Red", color: "#ef4444" },
    { value: "#ec4899", label: "Pink", color: "#ec4899" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-5xl w-[92vw] h-[85vh] max-h-[800px] bg-[#0f0920] border-gray-700 p-0 flex flex-col"
        data-testid="modal-display-settings"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-[#C77DFF]">
            Display Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Customize how content is displayed in your presentations and workspace
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8 max-w-3xl">
            {/* Typography Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Type className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Typography</h3>
                  <p className="text-sm text-gray-400">Customize fonts and text sizes</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-4">
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <Label className="text-white font-medium mb-3 block">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="w-full max-w-xs bg-[#0f0920] border-gray-600 text-white">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0f2e] border-gray-600">
                      <SelectItem value="inter" className="text-white hover:bg-purple-600">Inter</SelectItem>
                      <SelectItem value="roboto" className="text-white hover:bg-purple-600">Roboto</SelectItem>
                      <SelectItem value="opensans" className="text-white hover:bg-purple-600">Open Sans</SelectItem>
                      <SelectItem value="lato" className="text-white hover:bg-purple-600">Lato</SelectItem>
                      <SelectItem value="montserrat" className="text-white hover:bg-purple-600">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white font-medium">Base Font Size</Label>
                    <span className="text-purple-400 font-medium">{fontSize[0]}px</span>
                  </div>
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    min={12}
                    max={24}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>12px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Theme */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Accent Color</h3>
                  <p className="text-sm text-gray-400">Choose your primary accent color</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPrimaryColor(option.value)}
                        className={`w-10 h-10 rounded-full transition-all ${
                          primaryColor === option.value 
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a0f2e]" 
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: option.color }}
                        title={option.label}
                        data-testid={`color-option-${option.label.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Presentation Layout */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Layout className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Workspace Layout</h3>
                  <p className="text-sm text-gray-400">Configure your workspace panels</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div>
                    <Label className="text-white font-medium">Show Slide Numbers</Label>
                    <p className="text-sm text-gray-400">Display slide numbers in the editor</p>
                  </div>
                  <Switch 
                    checked={showSlideNumbers} 
                    onCheckedChange={setShowSlideNumbers}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div>
                    <Label className="text-white font-medium">Show Preview Panel</Label>
                    <p className="text-sm text-gray-400">Display the live preview panel</p>
                  </div>
                  <Switch 
                    checked={showPreviewPanel} 
                    onCheckedChange={setShowPreviewPanel}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
              </div>
            </div>

            {/* Presentation Mode */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Maximize className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Presentation Mode</h3>
                  <p className="text-sm text-gray-400">Configure live presentation behavior</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div>
                    <Label className="text-white font-medium">Fullscreen on Go Live</Label>
                    <p className="text-sm text-gray-400">Automatically enter fullscreen when presenting</p>
                  </div>
                  <Switch 
                    checked={fullscreenOnLive} 
                    onCheckedChange={setFullscreenOnLive}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
              </div>
            </div>

            {/* Transition Effects */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Transitions</h3>
                  <p className="text-sm text-gray-400">Configure slide transition effects</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-4">
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <Label className="text-white font-medium mb-3 block">Transition Effect</Label>
                  <Select value={transitionEffect} onValueChange={setTransitionEffect}>
                    <SelectTrigger className="w-full max-w-xs bg-[#0f0920] border-gray-600 text-white">
                      <SelectValue placeholder="Select effect" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0f2e] border-gray-600">
                      <SelectItem value="none" className="text-white hover:bg-purple-600">None</SelectItem>
                      <SelectItem value="fade" className="text-white hover:bg-purple-600">Fade</SelectItem>
                      <SelectItem value="slide" className="text-white hover:bg-purple-600">Slide</SelectItem>
                      <SelectItem value="zoom" className="text-white hover:bg-purple-600">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white font-medium">Transition Duration</Label>
                    <span className="text-purple-400 font-medium">{transitionDuration[0]}ms</span>
                  </div>
                  <Slider
                    value={transitionDuration}
                    onValueChange={setTransitionDuration}
                    min={100}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>100ms</span>
                    <span>1000ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700/50 flex-shrink-0 flex justify-between">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            data-testid="button-cancel-display-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
            data-testid="button-save-display-settings"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
