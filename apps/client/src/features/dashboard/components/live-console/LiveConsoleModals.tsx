import { useLiveConsoleStore } from "../../hooks/useLiveConsoleStore";
import { OBSControlPanel } from "../OBSControlPanel";
import AssetsPage from "@/features/dashboard/pages/AssetsPage";
import { X } from "lucide-react";

export function LiveConsoleModals() {
  const store = useLiveConsoleStore();

  return (
    <>
      {/* OBS Modal */}
      {store.isOBSModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#0a0a12] border border-gray-800 shadow-2xl rounded-xl w-full max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col relative">
            <button 
              onClick={() => store.setIsOBSModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-y-auto max-h-full">
              <OBSControlPanel />
            </div>
          </div>
        </div>
      )}

      {/* Background Modal */}
      {store.isBackgroundModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#0a0a12] border border-gray-800 shadow-2xl rounded-xl w-full max-w-[1000px] h-[85vh] flex flex-col relative overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
               <h2 className="text-xl font-bold text-white tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                 Background Assets
               </h2>
               <button onClick={() => store.setIsBackgroundModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto w-full relative">
               <AssetsPage />
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Placeholder for V2 parity) */}
      {store.isSettingsModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#0a0a12] border border-gray-800 shadow-2xl rounded-xl w-full max-w-[800px] h-[75vh] flex flex-col relative overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
               <h2 className="text-xl font-bold text-white tracking-widest uppercase">Live Console Settings</h2>
               <button onClick={() => store.setIsSettingsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
               <p className="text-gray-500">Settings dashboard being ported from V1 to FSD architecture...</p>
            </div>
          </div>
        </div>
      )}

      {/* Lower Third Settings Stub */}
      {store.isLowerThirdSettingsOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#0a0a12] border border-gray-800 shadow-2xl rounded-xl w-full max-w-[600px] min-h-[400px] flex flex-col relative overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
               <h2 className="text-xl font-bold text-white tracking-widest uppercase">Lower Thirds Configuration</h2>
               <button onClick={() => store.setIsLowerThirdSettingsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
               <p className="text-gray-500">Lower Third Template Editor pending migration...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
