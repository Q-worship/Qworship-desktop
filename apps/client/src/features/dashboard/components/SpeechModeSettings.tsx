import { Info, Radio, Wifi } from "lucide-react";

export type LiveConsoleSpeechMode = "offline" | "online";

interface SpeechModeSettingsProps {
  mode?: LiveConsoleSpeechMode;
  onModeChange?: (mode: LiveConsoleSpeechMode) => void;
}

const optionClassName =
  "w-full rounded-2xl border px-4 py-4 text-left transition-colors hover:border-violet-500/60 hover:bg-violet-500/5";

export function SpeechModeSettings({
  mode = "offline",
  onModeChange,
}: SpeechModeSettingsProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0f1020] p-6 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
            Speech Mode
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Hands-Free Bible Recognition Mode
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            The Live Console now carries an explicit dual-mode speech foundation.
            <strong> Fully Offline </strong> is the default path for resilient
            local scripture access and low-latency command recognition, while
            <strong> Online Cloud </strong> remains available whenever a connected
            Whisper-backed workflow is preferred.
          </p>
        </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          Foundation In Progress
        </div>

      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => onModeChange?.("offline")}
          className={`${optionClassName} ${
            mode === "offline"
              ? "border-cyan-400/70 bg-cyan-500/10"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-300">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Fully Offline</h3>
              <p className="mt-1 text-sm text-slate-300">
                Reserved for the local low-latency recognition path used when
                internet is unavailable or when churches explicitly choose the
                offline operating mode.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange?.("online")}
          className={`${optionClassName} ${
            mode === "online"
              ? "border-violet-400/70 bg-violet-500/10"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-2 text-violet-300">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Online Cloud</h3>
              <p className="mt-1 text-sm text-slate-300">
                Use this when a connected Whisper-backed cloud path is preferred
                for network-assisted transcription quality.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="leading-6">
            <strong>Fully Offline</strong> is now the recommended default for
            continuity and local responsiveness. <strong>Online Cloud</strong>
            remains available when users prefer a connected transcription path,
            but live accuracy will still depend on microphone quality, room
            noise, and provider readiness.
          </p>
        </div>
      </div>
    </section>
  );
}
