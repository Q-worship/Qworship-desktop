import { useState } from 'react';

export function useLiveConsoleState() {
  // Common state will go here
  const [leftPanelTab, setLeftPanelTab] = useState<'on-screen-bible' | 'hfb' | null>(null);

  return {
    leftPanelTab,
    setLeftPanelTab,
  };
}
