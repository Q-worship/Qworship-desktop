import { useLiveConsoleStore } from "../../hooks/useLiveConsoleStore";
import { isWindowOpen } from "@/utils/windowUtils";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import { useHFBStore } from "../../hooks/useHFBStore";
import { Radio, Settings, Image, X, Eye, EyeOff } from "lucide-react";

interface RightPanelProps {
  liveWindow: Window | null;
}

export function LiveConsoleRightPanel({ liveWindow }: RightPanelProps) {
  const store = useLiveConsoleStore();
  const hfbStore = useHFBStore();
  const { isVisible, setIsVisible, activeData } = useLowerThirdStore();

  return (
    <div className="w-[380px] shrink-0 flex flex-col bg-[#0d0d1a] border-l border-gray-800 overflow-hidden">

      {/* LIVE PREVIEW header — always visible */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Live Screens</span>
        </div>
        <button
          onClick={() => store.setIsSettingsModalOpen(true)}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content — Audience + Lower Third scroll together on small screens */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* HFB CURRENT VERSE CARD — shown when HFB panel is active */}
        {store.leftPanelTab === 'hfb' && hfbStore.hfbCurrentProjected && (
          <div className="px-4 pt-3 pb-0" style={{ animation: 'fadeIn 0.35s ease' }}>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#0891b2' }}>Current Verse</div>
            <div
              className="rounded-lg px-3 py-3"
              style={{
                background: '#041e26',
                border: '1px solid rgba(8,145,178,0.35)',
                borderLeft: '3px solid #0891b2',
                animation: 'fadeIn 0.35s ease',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-bold text-cyan-300">{hfbStore.hfbCurrentProjected.reference}</span>
                <span className="text-[9px] text-cyan-600 font-bold">{hfbStore.hfbCurrentProjected.version || 'KJV'}</span>
              </div>
              <p className="text-white/80 text-[11px] leading-relaxed">{hfbStore.hfbCurrentProjected.text}</p>
            </div>
          </div>
        )}

        {/* AUDIENCE section */}
        <div className="px-4 pt-3">
          <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Audience</div>

          {/* Audience preview thumbnail */}
          <div
            className="relative overflow-hidden rounded-lg border border-gray-700"
            style={{ height: '220px', background: '#000' }}
          >
            {/* Background Layer */}
            {store.appliedBackgroundType === 'color' && (
              <div className="absolute inset-0" style={{ backgroundColor: store.appliedBackgroundColor }} />
            )}
            {store.appliedBackgroundType === 'image' && store.appliedBackgroundImage && (
              <img src={store.appliedBackgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {store.appliedBackgroundType === 'video' && store.appliedBackgroundVideo && (
              <video src={store.appliedBackgroundVideo} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />
            )}

            {/* Content Layer */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              {store.previewProjectionType === 'song' && store.previewSongProjection && (
                <div className="text-center w-full">
                  <div className="text-purple-300 font-semibold mb-0.5" style={{ fontSize: '7px' }}>{store.previewSongProjection.title}</div>
                  <div className="text-white/70 uppercase tracking-wider mb-1" style={{ fontSize: '5.5px' }}>{store.previewSongProjection.sectionTitle}</div>
                  <div className="text-white font-medium leading-relaxed whitespace-pre-line" style={{ fontSize: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{store.previewSongProjection.lyrics}</div>
                </div>
              )}
              {store.previewProjectionType === 'bible' && store.previewBibleProjection && (
                <div className="text-center w-full px-1">
                  <div className="text-purple-300 font-semibold mb-1" style={{ fontSize: '7px' }}>{store.previewBibleProjection.reference}</div>
                  <div className="text-white font-medium leading-relaxed" style={{ fontSize: '7px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{store.previewBibleProjection.text}</div>
                </div>
              )}
              {!store.previewProjectionType && liveWindow && isWindowOpen(liveWindow) && (
                <div className="text-center text-gray-600"><p style={{ fontSize: '7px' }}>Ready for content</p></div>
              )}
              {(!liveWindow || !isWindowOpen(liveWindow)) && (
                <div className="text-center text-gray-600"><p style={{ fontSize: '7px' }}>No live screen</p></div>
              )}
            </div>
          </div>

          {/* Background and Close buttons beneath thumbnail */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => store.setIsBackgroundModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1422] hover:bg-[#261d33] text-purple-300 text-xs font-semibold py-1.5 rounded-lg border border-purple-800/40 transition-colors"
            >
              <Image className="w-3 h-3" />
              Background
            </button>
            <button
              onClick={() => {
                // FSD Architecture should delegate this clear action to an upper orchestration handler,
                // but local store clears here:
                store.setAppliedBackgroundType('color');
                store.setAppliedBackgroundColor('#000000');
                store.setAppliedBackgroundImage('');
                store.setAppliedBackgroundVideo('');
                store.setPreviewProjectionType(null);
                store.setPreviewBibleProjection(null);
                store.setPreviewSongProjection(null);
                setIsVisible(false);
              }}
              className="flex items-center justify-center gap-1 bg-[#1a1215] hover:bg-[#2a1920] text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-900/40 transition-colors"
              title="Send audience view to black / clear projection"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        </div>

        {/* LOWER THIRD section */}
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between" style={{ marginBottom: '-3px' }}>
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Lower Third</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsVisible(!isVisible)}
                className={`p-1 rounded transition-colors ${isVisible ? 'text-green-400 hover:text-green-300 hover:bg-green-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'}`}
                title={isVisible ? 'Hide lower third' : 'Show lower third'}
              >
                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => store.setIsLowerThirdSettingsOpen(true)}
                className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                title="Lower Third Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-lg border border-gray-700"
            style={{ height: '220px', background: '#000' }}
          >
            {/* Black background for lower third preview */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />

            <div className="absolute inset-0 flex flex-col justify-end p-2 pb-4 pointer-events-none">
              <div className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border border-purple-500/50 rounded p-3 shadow-2xl backdrop-blur-md">
                 <h4 className="text-white text-xs font-bold uppercase tracking-wider">{activeData?.reference || "Lower Third Preview"}</h4>
                 <p className="text-gray-200 text-xs mt-1 leading-snug">{activeData?.verse || "Active lower third template output will appear here."}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
