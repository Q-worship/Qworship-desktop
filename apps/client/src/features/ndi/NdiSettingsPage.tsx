import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  Wifi,
  WifiOff,
  Radio,
  AlertTriangle,
  Activity,
  Cpu,
  MemoryStick,
  ArrowLeft,
  Zap,
} from "lucide-react";
import {
  useNdiSettingsStore,
  type NdiStats,
  type GrandioseError,
} from "@/stores/useNdiSettingsStore";

// ─── Component ────────────────────────────────────────────────────────────────

export function NdiSettingsPage({ onClose }: { onClose: () => void }) {
  const isElectron = !!window.api?.ndi;
  const [, setLocation] = useLocation();

  const {
    lowerThirdName,
    mainPresentationName,
    autoStartOnLive,
    isStreaming,
    stats,
    grandioseError,
    statusMessage,
    setLowerThirdName,
    setMainPresentationName,
    setAutoStartOnLive,
    setStreaming,
    setStats,
    setGrandioseError,
    startStreaming,
    stopStreaming,
  } = useNdiSettingsStore();

  // ── Check grandiose health on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!isElectron) return;
    window.api!.ndi!.getGrandioseError().then((err) => {
      if (err) setGrandioseError(err as GrandioseError);
    });
  }, [isElectron, setGrandioseError]);

  // ── Subscribe to live stats + error IPC events ──────────────────────────────
  useEffect(() => {
    if (!isElectron) return;
    const unsubStats = window.api!.ndi!.onStatsUpdate((s) =>
      setStats(s as NdiStats),
    );
    const unsubErr = window.api!.ndi!.onError((err) => {
      setGrandioseError(err as GrandioseError);
      setStreaming(false);
    });
    return () => {
      unsubStats();
      unsubErr();
    };
  }, [isElectron, setStats, setGrandioseError, setStreaming]);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      setLocation("/");
    }
  };

  // ── Not in Electron ─────────────────────────────────────────────────────────
  if (!isElectron) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0614]">
        <div className="text-center space-y-4">
          <WifiOff className="mx-auto h-12 w-12 text-white/20" />
          <p className="text-white/40 text-sm">
            NDI output is only available in the desktop application.
          </p>
          <button
            onClick={handleBack}
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0614] text-white overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-700/30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">NDI Settings</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure NDI output streams for your live presentations
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-3">
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" /> Live
            </span>
          )}
          {statusMessage && (
            <span className="text-xs text-white/40">{statusMessage}</span>
          )}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* ── Grandiose error ──────────────────────────────────────────────── */}
          {grandioseError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold text-red-200">
                  {grandioseError.message}
                </p>
                <p className="mt-1 text-xs text-red-300/70">
                  {grandioseError.details}
                </p>
                <p className="mt-2 text-xs text-red-300">
                  {grandioseError.solution}
                </p>
              </div>
            </div>
          )}

          {/* ── NDI Status Banner ────────────────────────────────────────────── */}
          <div
            className={`flex items-center justify-between rounded-xl border p-5 ${
              isStreaming
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isStreaming
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {isStreaming ? (
                  <Wifi className="h-5 w-5" />
                ) : (
                  <WifiOff className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {isStreaming
                    ? "NDI Streams Active"
                    : "NDI Streams Inactive"}
                </p>
                <p className="text-xs text-white/40">
                  {isStreaming
                    ? "Broadcasting to all NDI receivers on your network"
                    : "Not currently broadcasting"}
                </p>
              </div>
            </div>

            <button
              onClick={isStreaming ? stopStreaming : startStreaming}
              disabled={!!grandioseError}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isStreaming
                  ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              }`}
            >
              {isStreaming ? (
                <>
                  <WifiOff className="h-4 w-4" /> Stop NDI
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" /> Start NDI
                </>
              )}
            </button>
          </div>

          {/* ── Stream Names ─────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
              NDI Stream Names
            </h2>
            <p className="text-xs text-white/30 -mt-2">
              Set custom names for each NDI stream. These names will be visible
              to receivers on your network (e.g. OBS, vMix).
            </p>

            <div className="space-y-4">
              {/* Lower Third */}
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-bold text-purple-300">
                  1
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-white/40">Lower Third</label>
                  <input
                    type="text"
                    value={lowerThirdName}
                    onChange={(e) => setLowerThirdName(e.target.value)}
                    disabled={isStreaming}
                    placeholder="QWORSHIP_LOWER_THIRD"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-purple-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Main Presentation */}
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-xs font-bold text-blue-300">
                  2
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-white/40">
                    Main Presentation
                  </label>
                  <input
                    type="text"
                    value={mainPresentationName}
                    onChange={(e) => setMainPresentationName(e.target.value)}
                    disabled={isStreaming}
                    placeholder="QWORSHIP_MAIN_PRESENTATION"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Behaviour ────────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
              Behaviour
            </h2>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer group hover:border-white/20 transition">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">
                    Auto-start NDI on Go Live
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Automatically start NDI streams when you enter Live mode and
                    stop them when you exit
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <div className="relative shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={autoStartOnLive}
                  onChange={(e) => setAutoStartOnLive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full bg-white/10 peer-checked:bg-emerald-500/60 transition" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </section>

          {/* ── Live Stats ───────────────────────────────────────────────────── */}
          {isStreaming && stats && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
                Live Stats
              </h2>

              {/* System metrics */}
              <div className="flex gap-6 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" /> CPU {stats.cpu}%
                </span>
                <span className="flex items-center gap-1.5">
                  <MemoryStick className="h-3.5 w-3.5" /> RAM {stats.ram} MB
                </span>
              </div>

              {/* Per-source preview cards */}
              <div className="grid grid-cols-2 gap-4">
                {stats.sources.map((src, i) => {
                  const name =
                    i === 0 ? lowerThirdName : mainPresentationName;
                  return (
                    <div
                      key={i}
                      className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                    >
                      {stats.previews[i] ? (
                        <img
                          src={stats.previews[i]!}
                          alt={`Preview ${i + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-black/40 text-xs text-white/20">
                          no signal
                        </div>
                      )}
                      <div className="flex items-center justify-between px-3 py-2.5 text-xs text-white/50">
                        <span className="truncate font-medium text-white/70">
                          {name}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <Activity className="h-3 w-3" />
                          {src.fps} fps · {src.bitrateMbps} Mbps
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
