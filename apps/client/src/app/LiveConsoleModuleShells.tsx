import { LiveConsoleDesktopFrame } from "./LiveConsoleDesktopFrame";

export function LiveConsoleBibleShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="on-screen-bible"
      bibleState="empty"
      title="On-screen Bible"
      subtitle="Manual scripture navigation remains the fallback companion to Hands-Free Bible and keeps the same compact Live Console layout used in the existing desktop and web applications."
    />
  );
}

export function LiveConsoleBibleEngagedShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="on-screen-bible"
      bibleState="engaged"
      initialBibleQuery="Num 2 3"
      title="On-screen Bible"
      subtitle="This engaged On-screen Bible state reflects compact scripture entry, immediate live projection to Audience and Lower Third previews, and active verse highlighting within the loaded chapter for quick manual control."
    />
  );
}

export function LiveConsoleHandsFreeBibleShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="hfb"
      hfbState="empty"
      title="Hands-Free Bible"
      subtitle="This is the default loaded Live Console state. HFB opens pre-selected, presents the empty transcript, detected verses, and queue surfaces, and keeps the same theme and functional direction already approved."
    />
  );
}

export function LiveConsoleHandsFreeBibleEngagedShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="hfb"
      hfbState="engaged"
      title="Hands-Free Bible"
      subtitle="This working-state HFB shell reflects live transcript capture, detected verse activation, audience preview updates, lower-third population, and recent detection continuity while preserving the same theme and Live Console structure."
    />
  );
}

export function LiveConsoleSongsShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="songs"
      songState="empty"
      title="Songs"
      subtitle="Songs remain a primary Live Console pathway with local song search, section-based projection, and pace mode in the same Live Console interface language."
    />
  );
}

export function LiveConsoleSongsEngagedShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="songs"
      songState="engaged"
      title="Songs"
      subtitle="This engaged Songs state reflects current-song activation, highlighted lyric sections, populated Audience and Lower Third outputs, and continued recent-detection history inside the approved Live Console frame."
    />
  );
}

export function LiveConsoleSongsPaceShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="songs"
      songState="pace"
      title="Songs"
      subtitle="This Pace Mode Songs state preserves the engaged song layout while adding BPM controls, play and pause flow, and a visible lyric progress bar for congregation sing-along."
    />
  );
}

export function LiveConsoleAssetsShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="on-screen-bible"
      title="Assets"
      subtitle="Assets are available as an imported supporting module inside Live Console scope without changing the core Live Console visual identity."
    />
  );
}

export function LiveConsoleSettingsShell() {
  return (
    <LiveConsoleDesktopFrame
      primaryMode="on-screen-bible"
      title="Settings"
      subtitle="Settings remain operational tooling inside the Live Console product boundary and should not override the core Live Console UI language."
    />
  );
}
