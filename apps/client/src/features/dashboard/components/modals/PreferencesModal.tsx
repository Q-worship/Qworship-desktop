import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Bell, Globe, Volume2, Keyboard, Save, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { toast } = useToast();
  const [theme, setTheme] = useState<string>("system");
  const [language, setLanguage] = useState<string>("en");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sound: true,
  });
  const [autoSave, setAutoSave] = useState(true);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const handleSave = () => {
    toast({
      title: "Preferences Saved",
      description: "Your preferences have been updated successfully.",
      className: "bg-[#8356f3] text-white",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-5xl w-[92vw] h-[85vh] max-h-[800px] bg-[#0f0920] border-gray-700 p-0 flex flex-col"
        data-testid="modal-preferences"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-[#C77DFF]">
            Preferences
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Customize your Q-worship experience with these application preferences
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8 max-w-3xl">
            {/* Theme Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Appearance</h3>
                  <p className="text-sm text-gray-400">Choose your preferred theme</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <Select value={theme} onValueChange={(value) => {
                  if (value === "system") {
                    setTheme(value);
                  }
                }}>
                  <SelectTrigger className="w-full max-w-xs bg-[#1a0f2e] border-gray-600 text-white">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0f2e] border-gray-600">
                    <SelectItem value="system" className="text-white hover:bg-purple-600">System Default</SelectItem>
                    <SelectItem value="dark" className="text-gray-500 cursor-not-allowed opacity-50" disabled>Dark Mode</SelectItem>
                    <SelectItem value="light" className="text-gray-500 cursor-not-allowed opacity-50" disabled>Light Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Language Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Language</h3>
                  <p className="text-sm text-gray-400">Select your preferred language</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <Select value={language} onValueChange={(value) => {
                  if (value === "en") {
                    setLanguage(value);
                  }
                }}>
                  <SelectTrigger className="w-full max-w-xs bg-[#1a0f2e] border-gray-600 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0f2e] border-gray-600">
                    <SelectItem value="en" className="text-white hover:bg-purple-600">English</SelectItem>
                    <SelectItem value="es" className="text-gray-500 cursor-not-allowed opacity-50" disabled>Spanish</SelectItem>
                    <SelectItem value="fr" className="text-gray-500 cursor-not-allowed opacity-50" disabled>French</SelectItem>
                    <SelectItem value="de" className="text-gray-500 cursor-not-allowed opacity-50" disabled>German</SelectItem>
                    <SelectItem value="pt" className="text-gray-500 cursor-not-allowed opacity-50" disabled>Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <p className="text-sm text-gray-400">Manage how you receive notifications</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div>
                    <Label className="text-white font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-400">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div>
                    <Label className="text-white font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-400">Receive browser notifications</p>
                  </div>
                  <Switch 
                    checked={notifications.push} 
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <Label className="text-white font-medium">Sound Effects</Label>
                      <p className="text-sm text-gray-400">Play sounds for notifications</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.sound} 
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sound: checked }))}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
              </div>
            </div>

            {/* Auto-Save Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Save className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Auto-Save</h3>
                  <p className="text-sm text-gray-400">Automatically save your work</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div>
                    <Label className="text-white font-medium">Enable Auto-Save</Label>
                    <p className="text-sm text-gray-400">Automatically save projects every 30 seconds</p>
                  </div>
                  <Switch 
                    checked={autoSave} 
                    onCheckedChange={setAutoSave}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                  <p className="text-sm text-gray-400">Enable keyboard shortcuts for quick actions</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div>
                    <Label className="text-white font-medium">Enable Shortcuts</Label>
                    <p className="text-sm text-gray-400">Use keyboard shortcuts throughout the app</p>
                  </div>
                  <Switch 
                    checked={keyboardShortcuts} 
                    onCheckedChange={setKeyboardShortcuts}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                </div>
                <Button
                  onClick={() => setIsShortcutsModalOpen(true)}
                  className="w-full bg-[#2d1f4e] border border-purple-600/30 text-purple-300 hover:bg-[#3a2963] hover:text-purple-200 flex items-center justify-center gap-2"
                  data-testid="button-view-shortcuts"
                >
                  <Keyboard className="w-4 h-4" />
                  View All Shortcuts
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700/50 flex-shrink-0 flex justify-between">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            data-testid="button-cancel-preferences"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
            data-testid="button-save-preferences"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>

      <KeyboardShortcutsModal 
        isOpen={isShortcutsModalOpen} 
        onClose={() => setIsShortcutsModalOpen(false)} 
      />
    </Dialog>
  );
}
