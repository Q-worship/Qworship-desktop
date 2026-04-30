import React from "react";

import { getStartupLoaderSnapshot } from "@/lib/startupLoaderState";
import { QworshipLoader } from "@/components/QworshipLoader";

type DesktopStartupLoaderProps = {
  visible: boolean;
  isSongSyncing: boolean;
  isBibleSyncing: boolean;
  progressOverride?: number | null;
  headlineOverride?: string | null;
  detailOverride?: string | null;
};

const PRIMARY_COPY = "Synchronizing Library";

export function DesktopStartupLoader({
  visible,
  isSongSyncing,
  isBibleSyncing,
  progressOverride = null,
  headlineOverride = null,
  detailOverride = null,
}: DesktopStartupLoaderProps) {
  const [mountedAt] = React.useState(() => Date.now());
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const elapsedMs = now - mountedAt;
  const fallbackSnapshot = getStartupLoaderSnapshot({
    elapsedMs,
    isSongSyncing,
    isBibleSyncing,
    isReadyToFinish: !isSongSyncing && !isBibleSyncing && elapsedMs > 4200,
  });

  const snapshot = {
    progress: progressOverride ?? fallbackSnapshot.progress,
    detail: detailOverride ?? fallbackSnapshot.detail,
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden bg-[#1B0A4A] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(236,72,153,0.09),transparent_28%),radial-gradient(circle_at_50%_55%,rgba(192,132,252,0.16),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(27,10,74,0.92)_0%,rgba(25,10,70,0.96)_50%,rgba(20,8,59,1)_100%)]" />

      <div className="relative flex h-full w-full items-center justify-center px-6">
        <div className="flex w-full max-w-xl flex-col items-center justify-center">
          <QworshipLoader size="md" showLabel={false} className="mb-4 scale-[0.54] origin-center" />

          <div className="w-full max-w-[420px]">
            <div className="h-[5px] overflow-hidden rounded-full bg-white/15 shadow-[0_0_18px_rgba(192,132,252,0.14)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#E9D5FF] to-[#D8B4FE] transition-[width] duration-300"
                style={{ width: `${snapshot.progress}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-center text-[0.86rem] font-semibold tracking-[-0.01em] text-white/86">
            {headlineOverride ?? PRIMARY_COPY}
          </p>
          <p className="mt-2 text-center text-[0.74rem] font-medium text-[#D8B4FE]/76">
            {snapshot.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DesktopStartupLoader;
