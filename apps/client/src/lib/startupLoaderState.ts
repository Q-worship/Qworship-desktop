export type StartupLoaderSnapshot = {
  progress: number;
  detail: string;
};

export function getStartupLoaderSnapshot(input: {
  elapsedMs: number;
  isSongSyncing: boolean;
  isBibleSyncing: boolean;
  isReadyToFinish: boolean;
}): StartupLoaderSnapshot {
  const { elapsedMs, isSongSyncing, isBibleSyncing, isReadyToFinish } = input;

  if (isReadyToFinish) {
    return {
      progress: 100,
      detail: "All resources are now available for zero-latency offline use.",
    };
  }

  if (isBibleSyncing) {
    return {
      progress: Math.max(58, Math.min(90, 58 + elapsedMs / 220)),
      detail: "Downloading datasets for zero-latency performance.",
    };
  }

  if (isSongSyncing) {
    return {
      progress: Math.max(36, Math.min(64, 36 + elapsedMs / 160)),
      detail: "Downloading datasets for zero-latency performance.",
    };
  }

  if (elapsedMs < 1500) {
    return {
      progress: Math.max(14, Math.min(28, 14 + elapsedMs / 110)),
      detail: "Downloading datasets for zero-latency performance.",
    };
  }

  if (elapsedMs < 3200) {
    return {
      progress: Math.max(32, Math.min(52, 32 + (elapsedMs - 1500) / 85)),
      detail: "Downloading datasets for zero-latency performance.",
    };
  }

  return {
    progress: Math.max(54, Math.min(88, 54 + (elapsedMs - 3200) / 95)),
    detail: "Downloading datasets for zero-latency performance.",
  };
}
