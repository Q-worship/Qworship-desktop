import { useState, useEffect } from 'react';
import { obsService, OBSStatus } from "@/services/OBSConnectionService";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function OBSStatusBadge() {
  const [status, setStatus] = useState<OBSStatus>({
    connected: false,
    recording: false,
    streaming: false,
  });
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = obsService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsReconnecting(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const settings = JSON.parse(localStorage.getItem('obs_settings') || '{}');
      if (settings.isEnabled) {
        await obsService.connect(settings);
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      setIsReconnecting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {status.connected ? (
          <Wifi className="h-4 w-4 text-green-500" data-testid="icon-obs-connected" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-400" data-testid="icon-obs-disconnected" />
        )}
        
        <div className="relative flex items-center gap-2">
          <span 
            className={`w-2 h-2 rounded-full ${
              status.connected 
                ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                : 'bg-gray-500'
            }`}
            data-testid="indicator-obs-status"
          />
          
          <span 
            className={`text-sm font-medium whitespace-nowrap ${
              status.connected ? 'text-green-400' : 'text-gray-400'
            }`}
            data-testid="text-obs-status"
          >
            {status.connected ? 'OBS Connected' : 'OBS Disconnected'}
          </span>
        </div>
      </div>

      {!status.connected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="h-7 px-2 text-xs hover:bg-purple-900/20 hover:text-purple-400 transition-colors"
          data-testid="button-reconnect-obs"
        >
          <RefreshCw 
            className={`h-3 w-3 ${isReconnecting ? 'animate-spin' : ''}`} 
          />
        </Button>
      )}
    </div>
  );
}
