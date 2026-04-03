import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, FileText, Monitor, Type, Navigation, Undo2 } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string;
  description: string;
}

interface ShortcutCategory {
  title: string;
  icon: typeof Keyboard;
  shortcuts: ShortcutItem[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: "File Operations",
    icon: FileText,
    shortcuts: [
      { keys: "Ctrl + O", description: "Open Project" },
      { keys: "Ctrl + S", description: "Save Project" },
      { keys: "Ctrl + P", description: "Print / Export" },
    ]
  },
  {
    title: "Insert Items",
    icon: Type,
    shortcuts: [
      { keys: "Ctrl + Shift + S", description: "Insert Song" },
      { keys: "Ctrl + Shift + B", description: "Insert Bible Verse" },
      { keys: "Ctrl + Shift + O", description: "Insert Announcement" },
      { keys: "Ctrl + Shift + N", description: "Insert Note" },
      { keys: "Ctrl + Shift + V", description: "Insert Video" },
      { keys: "Ctrl + Shift + I", description: "Insert Image" },
      { keys: "Ctrl + Shift + W", description: "Insert Web Page" },
    ]
  },
  {
    title: "Presentation Controls",
    icon: Monitor,
    shortcuts: [
      { keys: "Ctrl + F", description: "Toggle Fullscreen" },
      { keys: "←", description: "Previous Slide" },
      { keys: "→", description: "Next Slide" },
      { keys: "Esc", description: "Exit Presentation" },
    ]
  },
  {
    title: "Text Formatting",
    icon: Type,
    shortcuts: [
      { keys: "Ctrl + B", description: "Bold Text" },
      { keys: "Ctrl + I", description: "Italic Text" },
      { keys: "Ctrl + U", description: "Underline Text" },
    ]
  },
  {
    title: "Edit Actions",
    icon: Undo2,
    shortcuts: [
      { keys: "Ctrl + Z", description: "Undo" },
      { keys: "Ctrl + Y", description: "Redo" },
      { keys: "Ctrl + Shift + Z", description: "Redo (Alternative)" },
    ]
  },
  {
    title: "Navigation",
    icon: Navigation,
    shortcuts: [
      { keys: "Ctrl + B", description: "Toggle Sidebar" },
    ]
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl w-[90vw] h-[80vh] max-h-[700px] bg-[#0f0920] border-gray-700 p-0 flex flex-col"
        data-testid="modal-keyboard-shortcuts"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#C77DFF]">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Quick reference for all available keyboard shortcuts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutCategories.map((category, categoryIndex) => (
              <div 
                key={categoryIndex}
                className="bg-[#1a0f2e] rounded-lg border border-gray-700 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 bg-purple-600/10 border-b border-gray-700/50">
                  <category.icon className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">{category.title}</h3>
                </div>
                <div className="divide-y divide-gray-700/50">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div 
                      key={shortcutIndex}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-purple-600/5 transition-colors"
                    >
                      <span className="text-sm text-gray-300">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-[#0f0920] border border-gray-600 rounded text-purple-300 whitespace-nowrap">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700/50 flex-shrink-0 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
            data-testid="button-close-shortcuts"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
