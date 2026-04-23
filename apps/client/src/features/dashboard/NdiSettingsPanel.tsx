import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, Radio, AlertTriangle, Activity, Cpu, MemoryStick } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NdiSource {
  ndiName: string;
}

interface SourceStats {
  fps: number;
  bitrateMbps: number;
  active: boolean;
}

interface NdiStats {
  cpu: number;
  ram: number;
  sources: SourceStats[];
  previews: (string | null)[];
}

interface GrandioseError {
  message: string;
  details: string;
  solution: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "qworship-ndi-settings";

const DEFAULT_SOURCES: NdiSource[] = [
  { ndiName: "QWORSHIP_LOWER_THIRD" },
  { ndiName: "QWORSHIP_MAIN_PRESENTATION" },
];

function loadSavedSources(): NdiSource[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_SOURCES;
}

function saveSources(sources: NdiSource[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NdiSettingsPanel() {
  const isElectron = !!window.api?.ndi;

  const [sources, setSources] = useState<NdiSource[]>(loadSavedSources);
  const [streaming, setStreaming] = useState(false);
  const [stats, setStats] = useState<NdiStats | null>(null);
  const [grandioseError, setGrandioseError] = useState<GrandioseError | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Check for grandiose errors on mount
  useEffect(() => {
    if (!isElectron) return;
    window.api!.ndi!.getGrandioseError().then((err) => {
      if (err) setGrandioseError(err as GrandioseError);
    });
  }, [isElectron]);

  // Subscribe to live stats and error events
  useEffect(() => {
    if (!isElectron) return;
    const unsubStats = window.api!.ndi!.onStatsUpdate((s) => setStats(s as NdiStats));
    const unsubErr = window.api!.ndi!.onError((err) => {
      setGrandioseError(err as GrandioseError);
      setStreaming(false);
    });
    return () => {
      unsubStats();
      unsubErr();
    };
  }, [isElectron]);

  const handleSourceChange = useCallback((index: number, field: keyof NdiSource, value: string) => {
    setSources((prev) => {
      const updated = prev.map((s, i) => (i === index ? { ...s, [field]: value } : s));
      saveSources(updated);
      return updated;
    });
  }, []);

  const handleStart = useCallback(async () => {
    if (!window.api?.ndi) return;
    setStatusMsg("Starting NDI streams…");

    // The renderer HTML pages are served from the Vite dev server or packed dist.
    // The hidden windows in the main process already have these loaded — we just
    // pass the NDI names so the main process can label the NDI senders correctly.
    const ndiSources = sources.map((s) => ({
      url: "", // URL is determined by main.ts — empty here since windows are already loaded
      ndiName: s.ndiName,
    }));

    try {
      await window.api.ndi.startStream(ndiSources);
      setStreaming(true);
      setStatusMsg("NDI streams active");
    } catch (e) {
      setStatusMsg(`Failed to start: ${(e as Error).message}`);
    }
  }, [sources]);

  const handleStop = useCallback(async () => {
    if (!window.api?.ndi) return;
    await window.api.ndi.stopStream();
    setStreaming(false);
    setStats(null);
    setStatusMsg("NDI streams stopped");
  }, []);

  // ── Not in Electron ─────────────────────────────────────────────────────────
  if (!isElectron) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/40">
        <WifiOff className="mx-auto mb-2 h-6 w-6" />
        NDI output is only available in the desktop application.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Grandiose error alert ─────────────────────────────────────────────── */}
      {grandioseError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="font-semibold text-red-200">{grandioseError.message}</p>
            <p className="mt-1 text-xs text-red-300/70">{grandioseError.details}</p>
            <p className="mt-2 text-xs text-red-300">{grandioseError.solution}</p>
          </div>
        </div>
      )}

      {/* ── Stream name configuration ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50">
          NDI Stream Names
        </h3>
        {sources.map((src, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white/60">
              {i + 1}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-white/40">
                {i === 0 ? "Lower Third" : "Main Presentation"}
              </label>
              <input
                type="text"
                value={src.ndiName}
                onChange={(e) => handleSourceChange(i, "ndiName", e.target.value)}
                disabled={streaming}
                placeholder={i === 0 ? "QWORSHIP_LOWER_THIRD" : "QWORSHIP_MAIN_PRESENTATION"}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Start / Stop ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={streaming ? handleStop : handleStart}
          disabled={!!grandioseError}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            streaming
              ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
              : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
          }`}
        >
          {streaming ? (
            <>
              <WifiOff className="h-4 w-4" /> Stop NDI
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4" /> Start NDI
            </>
          )}
        </button>

        {statusMsg && (
          <span className="text-xs text-white/40">{statusMsg}</span>
        )}

        {streaming && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
            <Radio className="h-3 w-3 animate-pulse" /> Live
          </span>
        )}
      </div>

      {/* ── Live stats ───────────────────────────────────────────────────────── */}
      {streaming && stats && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50">
            Live Stats
          </h3>

          {/* System */}
          <div className="flex gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" /> CPU {stats.cpu}%
            </span>
            <span className="flex items-center gap-1">
              <MemoryStick className="h-3 w-3" /> RAM {stats.ram} MB
            </span>
          </div>

          {/* Per-source stats + preview */}
          <div className="grid grid-cols-2 gap-3">
            {stats.sources.map((src, i) => (
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
                <div className="flex items-center justify-between px-3 py-2 text-xs text-white/50">
                  <span className="truncate font-medium text-white/70">
                    {sources[i]?.ndiName || `Source ${i + 1}`}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Activity className="h-3 w-3" />
                    {src.fps} fps · {src.bitrateMbps} Mbps
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
