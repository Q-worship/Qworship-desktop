import React from "react";
import { Download, Loader2, RotateCcw } from "lucide-react";

import type { DesktopUpdateState } from "@/hooks/useDesktopUpdateState";

type DesktopUpdateCardProps = {
  state: DesktopUpdateState;
  visible: boolean;
  isActionPending?: boolean;
  onInstallAndRestart?: () => void;
};

function getBodyCopy(state: DesktopUpdateState) {
  if (state.message?.trim()) {
    return state.message;
  }

  if (state.status === "available") {
    return `Version ${state.version ?? "the latest release"} is now available. Click to install. The app will close briefly.`;
  }

  if (state.status === "downloading") {
    return `Preparing version ${state.version ?? "the latest release"} for installation.`;
  }

  if (state.status === "downloaded") {
    return `Version ${state.version ?? "the latest release"} is ready. The app will briefly close to install.`;
  }

  if (state.status === "error") {
    return "The update could not be prepared automatically just now. Please try again.";
  }

  return "A new desktop update is available.";
}

function getActionLabel(state: DesktopUpdateState, isActionPending: boolean) {
  if (isActionPending) return "Preparing…";
  if (state.status === "downloading") return "Preparing…";
  if (state.status === "error") return "Retry Install";
  return "Install & Restart";
}

export function DesktopUpdateCard({
  state,
  visible,
  isActionPending = false,
  onInstallAndRestart,
}: DesktopUpdateCardProps) {
  if (!visible) {
    return null;
  }

  const bodyCopy = getBodyCopy(state);
  const actionLabel = getActionLabel(state, isActionPending);
  const percent =
    typeof state.percent === "number" && Number.isFinite(state.percent)
      ? Math.max(0, Math.min(100, Math.round(state.percent)))
      : null;

  return (
    <div className="fixed bottom-6 right-6 z-[10010] w-[min(360px,calc(100vw-2rem))] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#2A2730]/96 px-5 py-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-white/95">
              Update Available
            </p>
            <p className="mt-2 text-[0.88rem] leading-5 text-white/72">{bodyCopy}</p>

            {percent !== null && state.status === "downloading" && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff2d78] via-[#c084fc] to-[#e9d5ff] transition-[width] duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-[0.7rem] font-medium text-white/55">
                  Preparing update • {percent}%
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onInstallAndRestart}
            disabled={isActionPending || state.status === "downloading"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-[0.76rem] font-semibold text-[#1d1b23] shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isActionPending || state.status === "downloading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : state.status === "error" ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DesktopUpdateCard;
