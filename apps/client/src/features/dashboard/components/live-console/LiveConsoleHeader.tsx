import { Minimize2, X } from "lucide-react";
import { isWindowOpen } from "@/utils/windowUtils";
import { Button } from "@/components/ui/button";
import qworshipLogo from "@assets/Group 1_1753843572404.png";

type Props = {
  liveWindow: Window | null;
  onClose: () => void;
  setIsMinimized: (val: boolean) => void;
};

export function LiveConsoleHeader({ liveWindow, onClose, setIsMinimized }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#0d0d1a] border-b border-gray-800 shrink-0">
      <div className="flex items-center gap-3">
        <img src={qworshipLogo} alt="Qworship" className="w-8 h-8 object-contain" />
        <span className="text-purple-300 font-bold text-lg tracking-wide">Qworship Live Console</span>
      </div>
      <div className="flex items-center gap-3">
        {liveWindow && isWindowOpen(liveWindow) && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 text-xs font-semibold">LIVE</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(true)}
          title="Minimise"
          className="text-gray-400 hover:text-white hover:bg-gray-700 h-9 w-9"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          title="Close"
          className="text-gray-400 hover:text-white hover:bg-gray-700 h-9 w-9"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
