import type { KeyboardEvent, ReactNode } from "react";
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Clock3,
  Mic,
  Monitor,
  Music4,
  Search,
  Settings2,
  Upload,
} from "lucide-react";

import qworshipLogo from "@assets/Group 1_1753843572404.png";
import { useAuthStore } from "@/features/auth/auth.store";
import { BIBLE_BOOKS_LCC, BIBLE_VERSIONS_LCC, findBibleBookByName, getBibleVerseCountForChapter } from "@/features/dashboard/data/bibleBooks";
import { useBibleRAMCache } from "@/features/dashboard/hooks/useBibleRAMCache";
import { type Song, useSongs } from "@/features/songs/api/useSongs";
import { fetchBibleChapterWithFallback } from "@/lib/sharedBibleEngine";
import { LowerThirdRenderer } from "@/features/lowerThird/LowerThirdRenderer";
import { MainPresentationRenderer } from "@/features/mainPresentation/MainPresentationRenderer";
import type { LowerThirdBindingData } from "@/features/lowerThird/types";
import { lookupOffline, parseVoiceCommand } from "@/lib/offlineBibleEngine";
import { resolveMediaUrl } from "@/lib/queryClient";
import { useMainPresentationStore } from "@/stores/useMainPresentationStore";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import { useLiveConsoleStore } from "@/stores/useLiveConsoleStore";
import { useDisplayModeStore, type DisplayMode } from "@/stores/useDisplayModeStore";
import { useLocalWhisper } from "@/hooks/useLocalWhisper";
import { useRawAudioStream } from "@/hooks/useRawAudioStream";
import { useAudioDevices } from "@/hooks/use-audio-devices";
import { useToast } from "@/hooks/use-toast";
import type { LiveConsoleSpeechMode } from "@/types/liveConsole";

type PrimaryMode = "on-screen-bible" | "hfb" | "songs";
type HfbState = "empty" | "engaged";
type BibleState = "empty" | "engaged";
type SongState = "empty" | "engaged" | "pace";

type BibleSearchResult = {
  book: string;
  chapter: number;
  verse: number | null;
  version?: string;
};

type HfbTranscriptEntry = {
  text: string;
  tone: "speech" | "command";
};

type HfbSettingsState = {
  usageMode: LiveConsoleSpeechMode;
  usageModeExplicitChoice: boolean;
  autoStartListening: boolean;
  noiseFiltering: boolean;
  highlightCommands: boolean;
  autoProjectDetectedVerse: boolean;
  transcriptBatchSize: number;
};

type ResolvedChapterOverride = {
  book: string;
  chapter: number;
  version: string;
  verses: Array<{ number: number; text: string }>;
};

type LiveConsoleDesktopFrameProps = {
  primaryMode: PrimaryMode;
  title: string;
  subtitle: string;
  hfbState?: HfbState;
  bibleState?: BibleState;
  songState?: SongState;
  initialBibleQuery?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPaceProjectionData(lines: string[], progress: number) {
  if (!lines.length) {
    return {
      lineIdx: -1,
      lineProgress: 0,
    };
  }

  const scaledProgress = clamp(progress * lines.length, 0, lines.length);
  const safeLineIdx = Math.min(Math.floor(scaledProgress), lines.length - 1);
  const lineProgress = safeLineIdx < 0 ? 0 : clamp(scaledProgress - safeLineIdx, 0, 1);

  return {
    lineIdx: safeLineIdx,
    lineProgress,
  };
}

const versions = BIBLE_VERSIONS_LCC;
const books = BIBLE_BOOKS_LCC.map((book) => book.name);
const HFB_SETTINGS_STORAGE_KEY = "qworship_live_console_hfb_settings";
const defaultHfbSettings: HfbSettingsState = {
  usageMode: "offline",
  usageModeExplicitChoice: false,
  autoStartListening: false,
  noiseFiltering: true,
  highlightCommands: true,
  autoProjectDetectedVerse: true,
  transcriptBatchSize: 8,
};

const startupDetections = [
  { title: "Please select a scripture or song to get started", body: "" },
];
const hfbDetections = [
  { title: "GEN 6:2", body: "And the LORD said, My spirit shall not always strive with man..." },
  { title: "LEV 2:2", body: "And he shall bring it to Aaron's sons the priests..." },
  { title: "LEV 2:3", body: "And the remnant of the meat offering shall be Aaron's..." },
  { title: "LEV 2:4", body: "And if thou bring an oblation of a meat offering..." },
];
const mixedDetections = [
  { title: "GEN 6:2", body: "Leviticus Chapter 2 Verse 1" },
  { title: "LEV 2:2", body: "Leviticus Chapter 2 Verse 2" },
  { title: "LEV 2:3", body: "Leviticus Chapter 2 Verse 3" },
  { title: "LEV 2:4", body: "Leviticus Chapter 2 Verse 4" },
  { title: "AMAZING GRACE", body: "V1" },
  { title: "AMAZING GRACE", body: "V2" },
  { title: "AMAZING GRACE", body: "V3" },
];
const transcript = [
  "Today we are going to speak",
  "About the goodness of God",
  "Lets open our Bibles to the book of",
  "Genesis chapter 6 from verse 2 says",
];
const recentSongs = [
  "Amazing Grace - John Newton",
  "Goodness of God - Cece Winans",
  "God is Good - Thomas Greene",
  "The Love of God - Don Moen",
];
const songTitle = "Amazing Grace - John Newton";
const songSections = [
  {
    title: "Verse 1",
    lines: [
      "Amazing grace",
      "How sweet the sound",
      "That saved a wretch like me",
      "I once was lost, but now I'm found",
      "Was blind, but now I see",
    ],
  },
  {
    title: "Verse 2",
    lines: [
      "'Twas grace that taught my heart to fear",
      "And grace my fears relieved",
      "How precious did that grace appear",
      "The hour I first believed",
    ],
  },
  {
    title: "Verse 3",
    lines: [
      "My chains are gone",
      "I've been set free",
      "My God, my Savior has ransomed me",
      "And like a flood His mercy reigns",
      "Unending love, amazing grace",
    ],
  },
  {
    title: "Verse 4",
    lines: [
      "The Lord has promised good to me",
      "His word my hope secures",
      "He will my shield and portion be",
      "As long as life endures",
    ],
  },
  {
    title: "Verse 5",
    lines: ["'Twas grace that taught my heart to fear"],
  },
];

const defaultExampleSong: Song = {
  id: "example-song",
  title: "Example Song",
  artist: "Qworship",
  dateAdded: new Date(0).toISOString(),
  alternativeTitles: ["Example", "Sample Song"],
  sections: [
    {
      id: "example-verse-1",
      type: "verse",
      number: 1,
      label: "Verse 1",
      content: "This is your example song\nIt shows how verses can be arranged\nYou can edit the lyrics, title, and sections\nThen project them from the Live Console",
    },
    {
      id: "example-chorus-1",
      type: "chorus",
      number: 1,
      label: "Chorus",
      content: "This is the chorus section\nAdd repeated lines here\nUse it to demonstrate your song structure",
    },
  ],
  lyrics: "This is your example song\nIt shows how verses can be arranged\nYou can edit the lyrics, title, and sections\nThen project them from the Live Console\n\nThis is the chorus section\nAdd repeated lines here\nUse it to demonstrate your song structure",
};

const shortNames: Record<string, string> = {
  Genesis: "Gen",
  Numbers: "Num",
  Matthew: "Matt",
};

type SongSectionView = {
  key: string;
  title: string;
  lines: string[];
};

function displaySongTitle(song?: Song | null) {
  if (!song) return "";
  return [song.title, song.artist].filter(Boolean).join(" - ") || song.title;
}

function matchesSongQuery(song: Song, query: string) {
  const haystacks = [song.title, song.artist, ...(song.alternativeTitles ?? [])]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return haystacks.some((value) => value.includes(query));
}

function extractSongSections(song?: Song | null): SongSectionView[] {
  const normalizeSongSectionTitle = (value: string, fallbackIndex: number) => {
    const cleaned = value.replace(/^\[|\]$/g, "").trim();
    const lower = cleaned.toLowerCase();

    if (/^(verse|v)\s*\d+/i.test(cleaned)) {
      const number = cleaned.match(/\d+/)?.[0] || String(fallbackIndex + 1);
      return `Verse ${number}`;
    }

    if (/^(chorus|c)(\s*\d+)?$/i.test(cleaned)) {
      const number = cleaned.match(/\d+/)?.[0];
      return number ? `Chorus ${number}` : "Chorus";
    }

    if (/^pre[- ]?chorus/i.test(lower)) return "Pre-Chorus";
    if (/^bridge/i.test(lower)) return "Bridge";
    if (/^tag/i.test(lower)) return "Tag";
    if (/^intro/i.test(lower)) return "Intro";
    if (/^outro/i.test(lower)) return "Outro";

    return cleaned || `Verse ${fallbackIndex + 1}`;
  };

  const normalizeSongLines = (lines: string[]) =>
    lines
      .flatMap((line) =>
        line
          .replace(/\u00a0/g, " ")
          .replace(/\s+/g, " ")
          .replace(/([a-z0-9,;:])([A-Z][a-z])/g, "$1\n$2")
          .replace(/([.!?])\s*([A-Z])/g, "$1\n$2")
          .split(/\r?\n/),
      )
      .map((line) => line.trim())
      .filter(Boolean);

  if (song?.sections?.length) {
    return song.sections
      .map((section, index) => ({
        key: section.id ?? `${section.type}-${section.number}-${index}`,
        title: normalizeSongSectionTitle(section.label || `${section.type} ${section.number}`, index),
        lines: normalizeSongLines(section.content.split(/\r?\n/)),
      }))
      .filter((section) => section.lines.length > 0);
  }

  if (song?.lyrics) {
    const blocks = song.lyrics
      .split(/\n\s*\n/)
      .map((block) => block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean))
      .filter((lines) => lines.length > 0);

    if (blocks.length) {
      return blocks
        .map((lines, index) => {
          const firstLine = lines[0] || "";
          const headerMatch = firstLine.match(/^\[(.+)\]$/);
          const title = normalizeSongSectionTitle(headerMatch?.[1] || firstLine, index);
          const contentLines = headerMatch ? lines.slice(1) : lines;

          return {
            key: `lyrics-${index + 1}`,
            title,
            lines: normalizeSongLines(contentLines),
          };
        })
        .filter((section) => section.lines.length > 0);
    }
  }

  return [];
}

function parseBibleSearch(value: string): BibleSearchResult | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = parseVoiceCommand(trimmed, "kjv");
  if (!parsed.parsedReference) return null;

  const numberGroups = trimmed.match(/\d+/g) ?? [];
  const numberedBookOffset = /^\d/.test(parsed.parsedReference.book) ? 1 : 0;
  const hasExplicitVerse = numberGroups.length >= 2 + numberedBookOffset;

  return {
    book: parsed.parsedReference.book,
    chapter: parsed.parsedReference.chapter,
    verse: hasExplicitVerse ? parsed.parsedReference.verseStart || 1 : null,
  };
}

function shortRef(book: string, chapter: number, verse: number) {
  return `${shortNames[book] ?? book} ${chapter}:${verse}`;
}

function searchInput(book: string, chapter: number, verse: number | null) {
  return verse == null ? `${shortNames[book] ?? book} ${chapter}` : `${shortNames[book] ?? book} ${chapter} ${verse}`;
}

function splitColumns<T>(verses: T[]) {
  const midpoint = Math.ceil(verses.length / 2);
  return [verses.slice(0, midpoint), verses.slice(midpoint)];
}

function useResolvedChapter(active: BibleSearchResult, chapterOverride?: ResolvedChapterOverride | null) {
  const instantVerses = useMemo(() => {
    const versionKey = active.version?.toLowerCase() ?? "kjv";
    const expectedVerseCount = getBibleVerseCountForChapter(active.book, active.chapter);

    if (
      chapterOverride &&
      chapterOverride.book === active.book &&
      chapterOverride.chapter === active.chapter &&
      chapterOverride.version.toLowerCase() === versionKey &&
      chapterOverride.verses.length > 0
    ) {
      return chapterOverride.verses;
    }

    const ramVerses = useBibleRAMCache.getState().getChapter(versionKey, active.book, active.chapter);
    if (!ramVerses || ramVerses.length < expectedVerseCount) {
      return [] as Array<{ number: number; text: string }>;
    }

    return ramVerses.map((verse) => ({
      number: verse.number,
      text: verse.text,
    }));
  }, [active.book, active.chapter, active.version, chapterOverride]);

  const [resolvedVerses, setResolvedVerses] = useState<Array<{ number: number; text: string }>>(instantVerses);

  useEffect(() => {
    if (instantVerses.length > 0) {
      setResolvedVerses(instantVerses);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const passage = await fetchBibleChapterWithFallback({
          book: active.book,
          chapter: active.chapter,
          version: active.version?.toLowerCase() ?? "kjv",
          verseEnd: getBibleVerseCountForChapter(active.book, active.chapter),
        });

        if (cancelled) return;

        setResolvedVerses(passage?.verses ?? []);
      } catch (error) {
        if (!cancelled) {
          console.error("[LiveConsoleDesktopFrame] Failed to resolve chapter", {
            book: active.book,
            chapter: active.chapter,
            version: active.version,
            error,
          });
          setResolvedVerses([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active.book, active.chapter, active.version, instantVerses]);

  return instantVerses.length > 0 ? instantVerses : resolvedVerses;
}

async function resolveSingleVerseReference(params: {
  book: string;
  chapter: number;
  verse: number;
  version: string;
}) {
  const passage = await fetchBibleChapterWithFallback({
    book: params.book,
    chapter: params.chapter,
    version: params.version.toLowerCase(),
    verseEnd: getBibleVerseCountForChapter(params.book, params.chapter),
  });

  const verse = passage?.verses?.find((item) => item.number === params.verse) ?? null;
  if (!passage || !verse) return null;

  return {
    book: passage.book,
    chapter: passage.chapter,
    version: passage.version,
    verse,
  };
}

const headerActions = [
  { key: "songbook", label: "Songbook", path: "/songbook", icon: <Music4 className="h-3.5 w-3.5" /> },
  { key: "display", label: "Display Settings", path: "/settings?panel=display", icon: <Monitor className="h-3.5 w-3.5" /> },
  { key: "main", label: "Main Presentation Settings", path: "/main-presentation-settings", icon: <Upload className="h-3.5 w-3.5" /> },
  { key: "lower", label: "Lower Third Settings", path: "/lower-third-settings", icon: <Layers className="h-3.5 w-3.5" /> },
  { key: "settings", label: "General Settings", path: "/settings", icon: <Settings2 className="h-3.5 w-3.5" /> },
];

function ModeButton({
  active,
  label,
  icon,
  onClick,
  activeClass,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold ${
        active ? activeClass : "border-white/10 bg-[#15192a] text-gray-300"
      }`}
    >
      {icon}
      <span className="ml-1.5">{label}</span>
    </button>
  );
}

function Header({
  primaryMode,
  hfbState,
  onOpenSettings,
}: {
  primaryMode: PrimaryMode;
  hfbState: HfbState;
  onOpenSettings: () => void;
}) {
  const [, navigate] = useLocation();
  const desktopApi = (window as Window & {
    api?: {
      live?: {
        onWindowClosed?: (callback: () => void) => (() => void) | void;
        closeOutput?: () => Promise<{ success: boolean }>;
        openOutput?: (options: {
          route: string;
          targetDisplayId: string | null;
          connectionMethod: "wired" | "ndi" | "both";
          fullscreen: boolean;
          ndiSettings?: unknown;
          lowerThirdRenderUrl?: string | null;
        }) => Promise<{ success: boolean }>;
      };
    };
  }).api;
  const rememberModuleEntry = useLiveConsoleStore((state) => state.rememberModuleEntry);
  const isLiveEnabled = useDisplayModeStore((state) => state.isLiveEnabled);
  const targetDisplayId = useDisplayModeStore((state) => state.targetDisplayId);
  const connectionMethod = useDisplayModeStore((state) => state.connectionMethod);
  const fullscreenOnLive = useDisplayModeStore((state) => state.fullscreenOnLive);
  const ndiSettings = useDisplayModeStore((state) => state.ndiSettings);
  const getLowerThirdRenderUrl = useLowerThirdStore((state) => state.getRenderUrl);
  const setLiveEnabled = useDisplayModeStore((state) => state.setLiveEnabled);
  const setMode = useDisplayModeStore((state) => state.setMode);
  const clearMode = useDisplayModeStore((state) => state.clearMode);
  const returnPath = primaryMode === "on-screen-bible" ? "/bible" : primaryMode === "songs" ? "/songs" : "/live-console";
  const liveLabel = isLiveEnabled ? "EXIT LIVE" : "GO LIVE";

  useEffect(() => {
    const unsubscribe = desktopApi?.live?.onWindowClosed?.(() => {
      setLiveEnabled(false);
      clearMode();
    });

    return () => {
      unsubscribe?.();
    };
  }, [clearMode, setLiveEnabled]);

  const resolveDisplayMode = (): DisplayMode => {
    if (primaryMode === "songs") return "song";
    if (primaryMode === "on-screen-bible") return "on-screen-bible";
    if (primaryMode === "hfb") return "hfb-bible";
    return hfbState === "engaged" ? "hfb-bible" : "none";
  };

  const handleLiveToggle = async () => {
    if (isLiveEnabled) {
      await desktopApi?.live?.closeOutput?.();
      setLiveEnabled(false);
      clearMode();
      return;
    }

    const nextMode = resolveDisplayMode();
    setMode(nextMode);

    const opened = await desktopApi?.live?.openOutput?.({
      route: "/live",
      targetDisplayId,
      connectionMethod,
      fullscreen: fullscreenOnLive,
      ndiSettings,
      lowerThirdRenderUrl: getLowerThirdRenderUrl(),
    });

    if (opened?.success === false) {
      clearMode();
      setLiveEnabled(false);
      return;
    }

    setLiveEnabled(true);
  };

  return (
    <header className="flex items-center justify-between border-b border-[#2a2342] bg-[#2a1450] px-5 py-3">
      <div className="flex items-center">
        <p className="text-[18px] font-semibold text-white">Qworship Live Console</p>
      </div>

      <button
        type="button"
        onClick={() => void handleLiveToggle()}
        className="inline-flex items-center gap-3 rounded-md border border-white/10 bg-[#33185f] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
      >
        <span>{liveLabel}</span>
        <span className={`relative inline-flex h-4 w-8 rounded-full transition-colors ${isLiveEnabled ? "bg-emerald-400/80" : "bg-white/20"}`}>
          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-[#0f172a] transition-all ${isLiveEnabled ? "right-0.5" : "left-0.5"}`} />
        </span>
      </button>

      <div className="flex items-center gap-2">
        {headerActions.map((action) => (
          <button
            key={action.key}
            type="button"
            title={action.label}
            aria-label={action.label}
            onClick={() => {
              if (action.key === "settings") {
                onOpenSettings();
                return;
              }
              rememberModuleEntry(action.key, returnPath, returnPath);
              navigate(action.path);
            }}
            className="rounded-md border border-[#0D0D1A] bg-[#1b132d] p-2 text-gray-300 hover:text-white"
          >
            {action.icon}
          </button>
        ))}
      </div>
    </header>
  );
}

function HfbSettingsModal({
  open,
  onClose,
  settings,
  setSettings,
  audioDevices,
  selectedDeviceId,
  hasAudioPermission,
  isAudioDevicesLoading,
  audioDevicesError,
  selectedAudioDeviceLabel,
  onSelectDevice,
  onRequestPermission,
  onRefreshDevices,
  onUseDefaultDevice,
}: {
  open: boolean;
  onClose: () => void;
  settings: HfbSettingsState;
  setSettings: (updater: (current: HfbSettingsState) => HfbSettingsState) => void;
  audioDevices: Array<{ deviceId: string; label: string; isDefault: boolean }>;
  selectedDeviceId: string | null;
  hasAudioPermission: boolean;
  isAudioDevicesLoading: boolean;
  audioDevicesError: string | null;
  selectedAudioDeviceLabel: string;
  onSelectDevice: (deviceId: string) => void;
  onRequestPermission: () => Promise<boolean> | void;
  onRefreshDevices: () => Promise<void> | void;
  onUseDefaultDevice: () => void;
}) {
  const [activePanel, setActivePanel] = useState<"audio" | "usage" | "dynamic" | "preferences">("audio");

  if (!open) return null;

  const toggleSetting = (key: keyof Omit<HfbSettingsState, "usageMode" | "usageModeExplicitChoice" | "transcriptBatchSize">) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const settingRow = (
    label: string,
    description: string,
    key: keyof Omit<HfbSettingsState, "usageMode" | "usageModeExplicitChoice" | "transcriptBatchSize">,
  ) => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#4c3a75] bg-[#24133f] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
      <div>
        <p className="text-[12px] font-semibold text-white">{label}</p>
        <p className="mt-1 text-[10px] leading-4 text-[#a79acb]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => toggleSetting(key)}
        className={`inline-flex h-6 w-11 items-center rounded-full border transition-colors ${settings[key] ? "border-[#9b84ff] bg-[#7e63ff]" : "border-white/10 bg-white/10"}`}
      >
        <span className={`mx-0.5 h-4 w-4 rounded-full bg-[#0f0d17] transition-transform ${settings[key] ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  const panels = [
    {
      key: "audio" as const,
      title: "Audio Settings",
      blurb: "Control the microphone or audio input device used by Hands-free Bible.",
    },
    {
      key: "usage" as const,
      title: "Usage Mode",
      blurb: "Choose whether Hands-free Bible should prefer online or offline execution.",
    },
    {
      key: "dynamic" as const,
      title: "Dynamic HFB",
      blurb: "Adjust live command emphasis and automation behavior.",
    },
    {
      key: "preferences" as const,
      title: "Preferences",
      blurb: "Tune the Live Console experience for readability and operator control.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#120a24]/78 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[980px] overflow-hidden rounded-[28px] border border-[#5e4792] bg-[#1d1234] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-[#46356b] bg-[#2a1748] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[18px] font-semibold text-white">Q-worship Live Console Settings</p>
              <p className="mt-1 text-[11px] text-[#b9addf]">Use a focused one-panel workflow to manage Hands-free Bible settings without crowding the modal.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white hover:bg-white/10">Close</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {panels.map((panel) => {
              const selected = activePanel === panel.key;
              return (
                <button
                  key={panel.key}
                  type="button"
                  onClick={() => setActivePanel(panel.key)}
                  className={`min-w-[140px] rounded-md border px-4 py-3 text-center text-[12px] font-semibold transition-colors ${selected ? "border-[#9d85ff] bg-[#7f67ff] text-white" : "border-[#4d3a73] bg-[#3a295d] text-[#d7cdf8] hover:bg-[#49356f]"}`}
                >
                  {panel.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 bg-[#1a102d] p-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[26px] border border-[#4a396d] bg-[#21113a] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[13px] font-semibold text-[#cdbfff]">Settings Categories</p>
            <p className="mt-2 text-[10px] leading-5 text-[#a899cf]">Select one category at a time so the Live Console settings remain easier to scan and adjust during live preparation.</p>
            <div className="mt-5 space-y-3">
              {panels.map((panel) => {
                const selected = activePanel === panel.key;
                return (
                  <button
                    key={panel.key}
                    type="button"
                    onClick={() => setActivePanel(panel.key)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${selected ? "border-[#ad98ff] bg-[#2c1b52] text-white shadow-[inset_3px_0_0_#d8d0ff]" : "border-[#44345f] bg-[#261742] text-[#dbd1f9] hover:bg-[#2d1c4d]"}`}
                  >
                    <p className="text-[12px] font-semibold">{panel.title}</p>
                    <p className="mt-2 text-[10px] leading-4 text-[#aa9ccc]">{panel.blurb}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[28px] border border-[#342447] bg-[#120d1c] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
            {activePanel === "audio" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#7e63ff]/20 p-3 text-[#dcd3ff]">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-semibold text-white">Audio Settings</p>
                    <p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#a79acb]">Choose the microphone device used by Hands-free Bible while you test and refine voice capture in the Live Console.</p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-[#4c3a75] bg-[#211137] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f7bc2]">Selected input</p>
                  <p className="mt-2 text-[16px] font-semibold text-[#efe9ff]">{selectedAudioDeviceLabel}</p>
                  <p className="mt-2 text-[11px] text-[#9f92c6]">Permission {hasAudioPermission ? "granted" : "required"}{selectedDeviceId ? " · custom device selected" : " · default device in use"}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void onRequestPermission()} className="rounded-lg bg-[#7e63ff] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#927aff]">Allow Mic Access</button>
                  <button type="button" onClick={() => void onRefreshDevices()} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white hover:bg-white/10">Refresh Devices</button>
                  <button type="button" onClick={onUseDefaultDevice} className="rounded-lg border border-[#4c3a75] bg-[#261744] px-3 py-2 text-[11px] font-semibold text-[#d8cfff] hover:bg-[#311d56]">Use Default</button>
                </div>
                <div className="mt-5 max-h-[260px] overflow-y-auto pr-2 [scrollbar-color:#8d72ff_#1b112f] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[7px] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#1b112f] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8d72ff]">
                  {audioDevices.length ? audioDevices.map((device) => {
                    const selected = device.deviceId === selectedDeviceId || (!selectedDeviceId && device.isDefault);
                    return (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => onSelectDevice(device.deviceId)}
                        className={`mb-3 flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${selected ? "border-[#927aff] bg-[#33205e] text-white" : "border-[#40305f] bg-[#1a112d] text-[#d6cdf2] hover:bg-[#24173e]"}`}
                      >
                        <span className="text-[12px] font-semibold">{device.label}</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#b8abdf]">{device.isDefault ? "default" : selected ? "active" : "input"}</span>
                      </button>
                    );
                  }) : (
                    <p className="rounded-2xl border border-dashed border-[#4c3a75] px-4 py-5 text-[11px] text-[#ab9ed1]">{isAudioDevicesLoading ? "Scanning for microphone devices..." : "No microphone devices have been listed yet."}</p>
                  )}
                </div>
                {audioDevicesError ? <p className="mt-3 text-[10px] text-[#ff9ea5]">{audioDevicesError}</p> : null}
              </>
            ) : null}

            {activePanel === "usage" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#7e63ff]/20 p-3 text-[#dcd3ff]">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-semibold text-white">Usage Mode</p>
                    <p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#a79acb]">Set the default Hands-free Bible execution preference. Offline is now the default for the fastest local scripture access, while Online remains available whenever a connected transcription path is preferred.</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {(["online", "offline"] as const).map((mode) => {
                    const selected = settings.usageMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSettings((current) => ({
                          ...current,
                          usageMode: mode,
                          usageModeExplicitChoice: true,
                        }))}
                        className={`rounded-3xl border px-5 py-5 text-left transition-colors ${selected ? "border-[#a48cff] bg-[#34205d] text-white" : "border-[#43345f] bg-[#181026] text-[#c8bdf0] hover:bg-[#221536]"}`}
                      >
                        <p className="text-[13px] font-semibold uppercase tracking-[0.18em]">{mode}</p>
                        <p className="mt-3 text-[11px] leading-5 text-[#b9addf]">{mode === "online" ? "Use online mode when a connected transcription path is preferred for cloud-backed recognition." : "Use offline mode as the default preference for fast local scripture detection and resilient service-time operation."}</p>
                      </button>
                    );
                  })}
                </div>
                {settings.usageMode === "offline" ? (
                  <div className="mt-5 rounded-2xl border border-[#7b63c2] bg-[#24163c] px-4 py-4 text-[#e7deff]">
                    <p className="text-[12px] font-semibold">Offline mode notice</p>
                    <p className="mt-2 text-[11px] leading-5 text-[#c7bae8]">Offline mode is the recommended default for local resilience and fast service-time Bible access. In noisier rooms or with weaker microphones, recognition quality will still depend on microphone placement and speech clarity.</p>
                  </div>
                ) : null}
              </>
            ) : null}

            {activePanel === "dynamic" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#7e63ff]/20 p-3 text-[#dcd3ff]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-semibold text-white">Dynamic HFB Settings</p>
                    <p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#a79acb]">Adjust command emphasis and automation behavior while keeping the Live Console aligned with your current Hands-free Bible workflow.</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {settingRow("Auto-start listening", "Prepare the Live Console to enter listening mode immediately when you choose to enable that workflow later.", "autoStartListening")}
                  {settingRow("Noise filtering", "Keep microphone cleanup preferences ready for the offline and online optimization pass.", "noiseFiltering")}
                  {settingRow("Highlight detected commands", "Show detected Bible commands with stronger emphasis in the Live Transcript panel.", "highlightCommands")}
                  {settingRow("Auto-project detected verse", "Automatically send a detected verse to preview and live output as soon as a valid Bible command resolves.", "autoProjectDetectedVerse")}
                </div>
              </>
            ) : null}

            {activePanel === "preferences" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#7e63ff]/20 p-3 text-[#dcd3ff]">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-semibold text-white">Preferences</p>
                    <p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#a79acb]">Adapted for the Live Console so Hands-free Bible behavior stays tidy and operator-friendly during long services.</p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-[#4c3a75] bg-[#211137] px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold text-white">Transcript history size</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#a79acb]">Control how many short transcript batches remain visible before the panel scrolls older entries away.</p>
                    </div>
                    <span className="rounded-full bg-[#7e63ff]/20 px-3 py-1 text-[10px] font-semibold text-[#ddd4ff]">{settings.transcriptBatchSize} lines</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={14}
                    step={1}
                    value={settings.transcriptBatchSize}
                    onChange={(event) => setSettings((current) => ({ ...current, transcriptBatchSize: Number(event.target.value) }))}
                    className="mt-5 h-2 w-full cursor-pointer accent-[#8d72ff]"
                  />
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Tabs({ primaryMode }: { primaryMode: PrimaryMode }) {
  const [, navigate] = useLocation();

  return (
    <div className="flex gap-2 px-3 py-3">
      <ModeButton
        active={primaryMode === "on-screen-bible"}
        label="Bible"
        icon={<BookOpen className="inline h-3.5 w-3.5" />}
        onClick={() => navigate("/bible")}
        activeClass="border-indigo-400 bg-[#2b1d58] text-[#dbe4ff]"
      />
      <ModeButton
        active={primaryMode === "hfb"}
        label="Bible"
        icon={<img src={qworshipLogo} alt="" aria-hidden="true" className="inline h-3.5 w-3.5 object-contain" />}
        onClick={() => navigate("/live-console")}
        activeClass="border-pink-400 bg-[#4e1658] text-[#ffd6ef]"
      />
      <ModeButton
        active={primaryMode === "songs"}
        label="Songs"
        icon={<Music4 className="inline h-3.5 w-3.5" />}
        onClick={() => navigate("/songs")}
        activeClass="border-cyan-400 bg-[#16325d] text-[#c8f3ff]"
      />
    </div>
  );
}

function VersionRow({
  activeVersion,
  onSelectVersion,
}: {
  activeVersion: string;
  onSelectVersion: (version: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {versions.map((version, index) => {
        const selected = version === activeVersion;
        return (
          <button
            key={`${version}-${index}`}
            type="button"
            onClick={() => onSelectVersion(version)}
            className={`rounded-md border px-5 py-2 text-xs font-bold ${
              selected ? "border-[#756cff] bg-[#6d63ff] text-white" : "border-white/10 bg-black text-white"
            }`}
          >
            {version}
          </button>
        );
      })}
      <button type="button" className="rounded-md bg-[#6f63ff] px-4 py-2 text-xs font-bold text-white">
        Add more
      </button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#4b3a73] bg-[#25124a]">
      <div className="border-b border-[#4b3a73] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-white">
        {title}
      </div>
      {children}
    </div>
  );
}

function HfbLeft({
  state,
  isListeningMode,
  microphoneStatus,
  transcriptEntries,
  detectedReference,
  detectedVerseText,
  onToggleListening,
}: {
  state: HfbState;
  isListeningMode: boolean;
  microphoneStatus: string;
  transcriptEntries: HfbTranscriptEntry[];
  detectedReference: string | null;
  detectedVerseText: string | null;
  onToggleListening: (nextState: boolean) => void;
}) {
  if (state === "engaged") {
    return (
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-2">
        <div className="flex items-center justify-between rounded-xl border border-[#4b3a73] bg-[#241147] px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold text-[#d6ccff]">Qworship Hands-free Bible</p>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-[#2d1957] p-1 text-[9px] font-bold uppercase tracking-wide text-white/80">
            <button
              type="button"
              onClick={() => onToggleListening(true)}
              className={`rounded px-2 py-1 text-white ${isListeningMode ? "bg-[#7a63ff]" : "bg-white/10"}`}
            >
              On
            </button>
            <button
              type="button"
              onClick={() => onToggleListening(false)}
              className={`rounded px-2 py-1 text-white ${!isListeningMode ? "bg-[#7a63ff]" : "bg-white/10"}`}
            >
              Off
            </button>
          </div>
        </div>
        <Card title="Live Transcript">
          <div className="h-[188px] overflow-y-auto p-4 text-[12px] leading-6 text-gray-200">
            {transcriptEntries.length ? (
              transcriptEntries.map((entry, index) => (
                <p
                  key={`${entry.text}-${index}`}
                  className={entry.tone === "command" ? "font-semibold text-[#cbb8ff]" : index === transcriptEntries.length - 1 ? "text-white" : "text-gray-200"}
                >
                  {entry.text}
                </p>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-[#bdb1df]">{isListeningMode ? microphoneStatus : "Activate your mic to start giving Bible voice commands"}</p>
              </div>
            )}
          </div>
        </Card>
        <Card title="Detected Verses">
          <div className="p-4 text-[11px] text-white">
            {detectedReference ? (
              <>
                <p className="font-bold text-[#cbb8ff]">
                  {detectedReference}
                  <span className="ml-2 rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] text-emerald-200">LIVE</span>
                </p>
                <p className="mt-2 text-gray-300">{detectedVerseText}</p>
              </>
            ) : (
              <div className="flex h-[140px] flex-col items-center justify-center text-center text-[11px] text-gray-400">
                <p className="text-[13px] font-semibold text-[#d8d2eb]">No Verses Detected</p>
                <p className="mt-2 text-[10px] leading-5 text-[#8f83b3]">Verses from your voice command will appear here</p>
              </div>
            )}
          </div>
        </Card>
        <Card title="Queue">
          <div className="flex h-[140px] items-center justify-center text-center text-[11px] text-gray-400">
            No Verses in Queue
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-2">
      <div className="flex items-center justify-between rounded-xl border border-[#4b3a73] bg-[#241147] px-4 py-3">
        <p className="text-[11px] font-semibold text-[#d6ccff]">Qworship Hands-free Bible</p>
        <div className="flex items-center gap-1 rounded-md bg-[#2d1957] p-1 text-[9px] font-bold uppercase tracking-wide text-white/80">
          <button
            type="button"
            onClick={() => onToggleListening(true)}
            className={`rounded px-2 py-1 text-white ${isListeningMode ? "bg-[#7a63ff]" : "bg-white/10"}`}
          >
            On
          </button>
          <button
            type="button"
            onClick={() => onToggleListening(false)}
            className={`rounded px-2 py-1 text-white ${!isListeningMode ? "bg-[#7a63ff]" : "bg-white/10"}`}
          >
            Off
          </button>
        </div>
      </div>
      <Card title="Live Transcript">
        <div className="h-[188px] overflow-y-auto">
          {transcriptEntries.length ? (
            <div className="p-4 text-[12px] leading-6 text-gray-200">
              {transcriptEntries.map((entry, index) => (
                <p
                  key={`${entry.text}-${index}`}
                  className={entry.tone === "command" ? "font-semibold text-[#cbb8ff]" : index === transcriptEntries.length - 1 ? "text-white" : "text-gray-200"}
                >
                  {entry.text}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-5 text-center">
              <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full border border-[#5a4b84] bg-white/5 text-[#9c8cff]">
                <Mic className="h-4 w-4" />
              </div>
              <p className="max-w-[210px] text-[10px] font-medium leading-5 text-[#8f83b3]">
                {isListeningMode ? microphoneStatus : "Activate your mic to start giving Bible voice commands"}
              </p>
            </div>
          )}
        </div>
      </Card>
      <Card title="Detected Verses">
        <div className="flex h-[220px] flex-col justify-between px-5 py-4 text-center">
          {detectedReference ? (
            <div className="mt-4 flex flex-1 flex-col justify-center">
              <p className="text-[13px] font-semibold text-[#cbb8ff]">
                {detectedReference}
                <span className="ml-2 rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] text-emerald-200">LIVE</span>
              </p>
              <p className="mt-3 text-[11px] leading-6 text-gray-300">{detectedVerseText}</p>
            </div>
          ) : (
            <div className="mt-8 flex flex-1 flex-col items-center justify-center">
              <p className="text-[13px] font-semibold text-[#d8d2eb]">No Verses Detected</p>
              <p className="mt-2 text-[10px] leading-5 text-[#8f83b3]">Verses from your voice command will appear here</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 pb-1">
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5a4b84] text-[#b0a2db]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5a4b84] text-[#b0a2db]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
      <Card title="Queue">
        <div className="flex h-[230px] flex-col items-center justify-center px-5 text-center">
          <p className="text-[13px] font-semibold text-[#d8d2eb]">No Verses in Queue</p>
          <p className="mt-2 text-[10px] leading-5 text-[#8f83b3]">Verses from your voice command will appear here</p>
        </div>
      </Card>
    </div>
  );
}

function BibleLeft({
  query,
  setQuery,
  onSearch,
  onKeyDown,
  onSelectBook,
  onSelectChapter,
  onSelectVerse,
  active,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSearch: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSelectBook: (book: string) => void;
  onSelectChapter: (chapter: number) => void;
  onSelectVerse: (verse: number) => void;
  active: BibleSearchResult;
}) {
  const resolvedChapter = useResolvedChapter(active);
  const activeBook = findBibleBookByName(active.book) ?? BIBLE_BOOKS_LCC[0];
  const chapterNumbers = Array.from({ length: activeBook?.chapters ?? 1 }, (_, index) => index + 1);
  const availableVerses = resolvedChapter.length || getBibleVerseCountForChapter(active.book, active.chapter);

  return (
    <div className="flex flex-1 flex-col px-3 pb-3">
      <div className="mb-4 flex items-stretch gap-3 px-1">
        <div className="flex flex-1 overflow-hidden rounded-md border border-[#4b3a73] bg-[#32185f]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter Bible reference e.g John 3:16"
            className="w-full bg-transparent px-4 py-3 text-[11px] font-medium text-[#d8d2eb] outline-none placeholder:text-[#9c90bf]"
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="flex w-12 items-center justify-center rounded-md border border-[#6f63ff] bg-[#6f63ff] text-white"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#4b3a73] bg-[#25124a]">
        <div className="flex border-b border-[#4b3a73] bg-[#241147]">
          <div className="flex-1 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#bdb1df]">Book</div>
          <div className="w-[82px] border-l border-[#4b3a73] px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#bdb1df]">Chapter</div>
          <div className="w-[82px] border-l border-[#4b3a73] px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#bdb1df]">Verse</div>
        </div>
        <div className="flex h-[620px] overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-color:#a8a0bd_#ddd7e8] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[12px] [&::-webkit-scrollbar-track]:bg-[#ddd7e8] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#ddd7e8] [&::-webkit-scrollbar-thumb]:bg-[#aaa4b9]">
            {books.map((book) => (
              <button
                key={book}
                type="button"
                onClick={() => onSelectBook(book)}
                className={`mb-0.5 block w-full rounded px-3 py-1 text-left text-[11px] font-semibold ${active.book === book ? "bg-[#7b6cff] text-white" : "text-[#f0ecff]"}`}
              >
                {book}
              </button>
            ))}
          </div>
          <div className="w-[82px] overflow-y-auto border-l border-[#4b3a73] py-3 [scrollbar-color:#a8a0bd_#ddd7e8] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[12px] [&::-webkit-scrollbar-track]:bg-[#ddd7e8] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#ddd7e8] [&::-webkit-scrollbar-thumb]:bg-[#aaa4b9]">
            {chapterNumbers.map((chapter) => (
              <button
                key={chapter}
                type="button"
                onClick={() => onSelectChapter(chapter)}
                className={`block w-full rounded py-1 text-center text-[11px] font-semibold ${active.chapter === chapter ? "bg-[#7b6cff] text-white" : "text-[#f0ecff]"}`}
              >
                {chapter}
              </button>
            ))}
          </div>
          <div className="w-[82px] overflow-y-auto border-l border-[#4b3a73] py-3 [scrollbar-color:#a8a0bd_#ddd7e8] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[12px] [&::-webkit-scrollbar-track]:bg-[#ddd7e8] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#ddd7e8] [&::-webkit-scrollbar-thumb]:bg-[#aaa4b9]">
            {Array.from({ length: availableVerses }, (_, index) => index + 1).map((verse) => (
              <button
                key={verse}
                type="button"
                onClick={() => onSelectVerse(verse)}
                className={`block w-full rounded py-1 text-center text-[11px] font-semibold ${active.verse === verse ? "bg-[#7b6cff] text-white" : "text-[#f0ecff]"}`}
              >
                {verse}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SongsLeft({
  state,
  currentSongTitle,
  recentSongTitles,
  songQuery,
  searchResults,
  searchOpen,
  onSongQueryChange,
  onSongQueryFocus,
  onSongSearchKeyDown,
  onSelectSong,
  onOpenSongbook,
}: {
  state: SongState;
  currentSongTitle: string;
  recentSongTitles: string[];
  songQuery: string;
  searchResults: Song[];
  searchOpen: boolean;
  onSongQueryChange: (value: string) => void;
  onSongQueryFocus: () => void;
  onSongSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSelectSong: (songKey: string) => void;
  onOpenSongbook: () => void;
}) {
  const hasSong = Boolean(currentSongTitle.trim()) && (state === "engaged" || state === "pace");

  return (
    <div className="flex flex-1 flex-col px-3 pb-3">
      <div className="mb-4 flex items-stretch gap-3 px-1">
        <div className="relative flex-1">
          <div className="flex overflow-hidden rounded-md border border-[#4b3a73] bg-[#32185f]">
            <input
              value={songQuery}
              onChange={(event) => onSongQueryChange(event.target.value)}
              onFocus={onSongQueryFocus}
              onKeyDown={onSongSearchKeyDown}
              placeholder="Search Song"
              className="w-full bg-transparent px-4 py-3 text-[11px] font-medium text-[#d8d2eb] outline-none placeholder:text-[#8e83b5]"
            />
            <div className="flex w-12 items-center justify-center border-l border-[#4b3a73] bg-[#6f63ff] text-white">
              <Search className="h-4 w-4" />
            </div>
          </div>
          {searchOpen ? (
            <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-[#4b3a73] bg-[#25124a] shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
              {searchResults.length ? (
                searchResults.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSelectSong(song.id);
                    }}
                    className="block w-full border-b border-[#3b2b62] px-4 py-3 text-left last:border-b-0 hover:bg-[#2d1a54]"
                  >
                    <span className="block text-[12px] font-semibold text-white">{song.title}</span>
                    {song.artist ? <span className="mt-1 block text-[10px] text-[#aa9dd5]">{song.artist}</span> : null}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-[11px] text-[#9f93c3]">No songs found in your songbook</div>
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onOpenSongbook}
          className="self-stretch rounded-md border border-[#6f63ff] bg-[#6f63ff] px-3 text-[10px] font-bold uppercase tracking-wide text-white"
        >
          Songbook
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#4b3a73] bg-[#25124a]">
        <div className="border-b border-[#4b3a73] px-4 py-3 text-[14px] font-semibold text-white">Songs</div>
        <div className="border-b border-[#4b3a73] px-4 py-4">
          <p className="text-[12px] font-semibold text-[#a59adf]">Current Song</p>
          {hasSong ? (
            <button type="button" className="mt-3 block w-full rounded-md bg-[#8d72c4] px-3 py-3 text-left text-[12px] font-semibold text-white">
              {currentSongTitle}
            </button>
          ) : (
            <div className="mt-3 flex h-[112px] items-center justify-center rounded-md border border-[#7b6cff] bg-[#2a164f] px-4 text-center text-[11px] text-[#9f93c3]">
              Your current song selection will appear here
            </div>
          )}
        </div>
        <div className="px-4 py-4">
          <p className="mb-3 text-[12px] font-semibold text-[#a59adf]">Recent Songs</p>
          <div className="h-[428px] overflow-y-auto pr-2 [scrollbar-color:#a8a0bd_#ddd7e8] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[12px] [&::-webkit-scrollbar-track]:bg-[#ddd7e8] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#ddd7e8] [&::-webkit-scrollbar-thumb]:bg-[#aaa4b9]">
            {recentSongTitles.length ? (
              recentSongTitles.map((song) => (
                <button
                  key={song}
                  type="button"
                  onClick={() => onSelectSong(song)}
                  className="block w-full py-2 text-left text-[12px] font-semibold text-[#f0ecff] hover:text-white"
                >
                  {song}
                </button>
              ))
            ) : (
              <div className="pt-2 text-[11px] text-[#9f93c3]">Songs you search and open will appear here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HfbStage({
  state,
  active,
  onSelectVerse,
  onSelectVersion,
}: {
  state: HfbState;
  active: BibleSearchResult;
  onSelectVerse: (verse: number) => void;
  onSelectVersion: (version: string) => void;
}) {
  const verses = useResolvedChapter(active);
  const columns = splitColumns(verses);
  const midpoint = Math.ceil(verses.length / 2);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <div className="border-b border-[#4b3a73] bg-[#0f0d17] px-4 py-4">
        <VersionRow activeVersion={active.version || "KJV"} onSelectVersion={onSelectVersion} />
      </div>
      {state === "engaged" ? (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-12 overflow-y-auto px-5 py-6 pr-3 [scrollbar-color:#8d72ff_#140f23] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#140f23] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8d72ff]">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="space-y-2">
              {column.map((verse, index) => {
                const verseNumber = verse.number ?? (columnIndex === 0 ? index + 1 : midpoint + index + 1);
                const selected = verseNumber === active.verse;
                return (
                  <button
                    key={verseNumber}
                    type="button"
                    onClick={() => onSelectVerse(verseNumber)}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-[11px] leading-relaxed transition-colors ${selected ? "bg-[#6b53b9] text-white shadow-[0_0_0_1px_rgba(203,184,255,0.18)]" : "text-[#ece8f8] hover:bg-white/5"}`}
                  >
                    <span className={`mr-2 font-bold ${selected ? "text-[#d8cfff]" : "text-[#8d86a8]"}`}>{verseNumber}</span>
                    <span className={selected ? "font-semibold text-[#efe9ff]" : ""}>{verse.text}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
          <div className="absolute bottom-16 right-3 top-16 w-[3px] rounded-full bg-[#b49dff]" />
          <div className="h-[220px] w-[320px] rounded-[26px] border-2 border-dashed border-[#756cff] bg-black/20" />
        </div>
      )}
    </div>
  );
}

function BibleStage({
  active,
  onSelect,
  onSelectVersion,
}: {
  active: BibleSearchResult;
  onSelect: (verse: number) => void;
  onSelectVersion: (version: string) => void;
}) {
  const verses = useResolvedChapter(active);
  const columns = splitColumns(verses);
  const midpoint = Math.ceil(verses.length / 2);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <div className="border-b border-[#4b3a73] bg-[#0f0d17] px-5 py-4">
        <VersionRow activeVersion={active.version || "KJV"} onSelectVersion={onSelectVersion} />
      </div>
      <div className="grid min-h-0 max-h-[calc(100vh-220px)] flex-1 grid-cols-2 gap-x-12 overflow-y-auto px-5 py-6">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-2">
            {column.map((verse, index) => {
              const verseNumber = verse.number ?? (columnIndex === 0 ? index + 1 : midpoint + index + 1);
              const selected = verseNumber === active.verse;
              return (
                <button
                  key={verseNumber}
                  type="button"
                  onClick={() => onSelect(verseNumber)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-[11px] leading-relaxed transition-colors ${selected ? "bg-[#6b53b9] text-white shadow-[0_0_0_1px_rgba(203,184,255,0.18)]" : "text-[#ece8f8] hover:bg-white/5"}`}
                >
                  <span className={`mr-2 font-bold ${selected ? "text-[#d8cfff]" : "text-[#8d86a8]"}`}>{verseNumber}</span>
                  <span className={selected ? "font-semibold text-[#efe9ff]" : ""}>{verse.text}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SongsStage({
  state,
  currentSongTitle,
  sections,
  activeSectionIndex,
  paceBpm,
  pacePlaying,
  paceProgress,
  onSelectSection,
  onActivatePaceMode,
  onTogglePace,
  onDecreasePace,
  onIncreasePace,
  onClearProjection,
}: {
  state: SongState;
  currentSongTitle: string;
  sections: SongSectionView[];
  activeSectionIndex: number;
  paceBpm: number;
  pacePlaying: boolean;
  paceProgress: number;
  onSelectSection: (sectionIndex: number) => void;
  onActivatePaceMode: () => void;
  onTogglePace: () => void;
  onDecreasePace: () => void;
  onIncreasePace: () => void;
  onClearProjection: () => void;
}) {
  const isWorkingSong = Boolean(currentSongTitle.trim()) && sections.length > 0 && (state === "engaged" || state === "pace");
  const isPaceMode = state === "pace";
  const activeSectionLineCount = sections[activeSectionIndex]?.lines.length ?? 0;
  const pacedLineProgress = activeSectionLineCount > 0
    ? clamp(paceProgress * activeSectionLineCount, 0, activeSectionLineCount)
    : 0;

  const getPaceLineStyle = (sectionIndex: number, lineIndex: number): CSSProperties | undefined => {
    if (!isPaceMode || sectionIndex !== activeSectionIndex) return undefined;

    const lineProgress = clamp(pacedLineProgress - lineIndex, 0, 1);

    if (lineProgress <= 0) {
      return { color: "#b59df3" };
    }

    if (lineProgress >= 1) {
      return { color: "#f5c542" };
    }

    const progressPercent = Math.round(lineProgress * 100);

    return {
      backgroundImage: `linear-gradient(90deg, #f5c542 ${progressPercent}%, #b59df3 ${progressPercent}%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
    };
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      {isWorkingSong ? (
        <div className="border-b border-[#4b3a73] bg-[#11101a] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-white">{currentSongTitle}</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onActivatePaceMode}
                className="rounded border border-[#4b3a73] p-2 text-white transition hover:border-[#7f73ad] hover:text-[#f5c542]"
                title="Pace Mode"
              >
                <Clock3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onClearProjection}
                className="text-[11px] font-semibold text-pink-300 transition hover:text-pink-200"
              >
                Clear Screen
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isWorkingSong ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isPaceMode ? (
            <div className="mb-3 flex items-center justify-between rounded border border-[#4b3a73] bg-[#11101a] px-3 py-2 text-[10px] uppercase tracking-wide text-white/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#f5c542]">Pace Mode</span>
                <span className="rounded bg-[#1f2432] px-2 py-1 text-[10px] font-bold text-white">BPM</span>
                <button type="button" onClick={onDecreasePace} className="rounded bg-[#1d2740] px-2 py-1 text-[10px] font-bold text-white">-</button>
                <span className="rounded bg-[#263147] px-2 py-1 text-[10px] font-bold text-[#9cc3ff]">{paceBpm}</span>
                <button type="button" onClick={onIncreasePace} className="rounded bg-[#1d2740] px-2 py-1 text-[10px] font-bold text-white">+</button>
              </div>
              <button type="button" onClick={onTogglePace} className="rounded bg-[#263147] px-2 py-1 text-[10px] font-bold text-white">{pacePlaying ? "Pause" : "Play"}</button>
            </div>
          ) : null}
          {sections.map((section, index) => (
            <button
              key={section.key}
              type="button"
              onClick={() => onSelectSection(index)}
              className={`mb-4 block w-full rounded-lg px-5 py-4 text-left ${index === activeSectionIndex ? "bg-[#2a1848]" : "bg-transparent"}`}
            >
              <p className="mb-3 text-[13px] font-bold uppercase text-white/80">{section.title}</p>
              <div className={index === activeSectionIndex ? "text-[#b59df3]" : "text-white"}>
                {section.lines.map((line, lineIndex) => (
                  <p
                    key={`${section.key}-${lineIndex}-${line}`}
                    className="text-[13px] leading-6 transition-colors duration-200"
                    style={getPaceLineStyle(index, lineIndex)}
                  >
                    {line}
                  </p>
                ))}
              </div>
              {isPaceMode && index === activeSectionIndex ? (
                <div className="mt-4 h-1 rounded-full bg-[#2f2642]">
                  <div className="h-1 rounded-full bg-[#f5c542]" style={{ width: `${Math.round(paceProgress * 100)}%` }} />
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative flex-1 bg-black">
          <div className="absolute bottom-6 right-3 top-6 w-[3px] rounded-full bg-[#6f63ff]/80" />
        </div>
      )}
    </div>
  );
}

function Preview({
  mode,
  hfbState,
  bibleState,
  songState,
  active,
  currentSongTitle,
  currentSongSection,
  resolvedChapterOverride,
}: {
  mode: PrimaryMode;
  hfbState: HfbState;
  bibleState: BibleState;
  songState: SongState;
  active: BibleSearchResult;
  currentSongTitle: string;
  currentSongSection: SongSectionView;
  resolvedChapterOverride: ResolvedChapterOverride | null;
}) {
  const lastProjection = useLiveConsoleStore((state) => state.lastProjection);
  const mainPresentationSettings = useMainPresentationStore((state) => state.settings);
  const mainPresentationActiveData = useMainPresentationStore((state) => state.activeData);
  const lowerThirdActiveData = useLowerThirdStore((state) => state.activeData);
  const lowerThirdVisible = useLowerThirdStore((state) => state.isVisible);
  const getScriptureTemplate = useLowerThirdStore((state) => state.getScriptureTemplate);
  const getLyricTemplate = useLowerThirdStore((state) => state.getLyricTemplate);
  const getAnnouncementTemplate = useLowerThirdStore((state) => state.getAnnouncementTemplate);
  const chapterVerses = useResolvedChapter(active, resolvedChapterOverride);
  const showHfb = mode === "hfb" && hfbState === "engaged";
  const showBible = mode === "on-screen-bible" && bibleState === "engaged";
  const showSong = mode === "songs" && (songState === "engaged" || songState === "pace") && lastProjection.kind === "lyrics";
  const verseText = active.verse == null ? "" : chapterVerses[active.verse - 1]?.text ?? "";
  const reference = active.verse == null
    ? `${shortNames[active.book] ?? active.book} ${active.chapter}`
    : shortRef(active.book, active.chapter, active.verse);
  const projectedReference = lastProjection.reference || reference;
  const projectedBody = lastProjection.body || verseText;
  const projectedVersion = lastProjection.version || active.version || "KJV";
  const projectedSongTitle = lastProjection.title || currentSongTitle;
  const projectedSongSectionTitle = lastProjection.reference || currentSongSection.title;
  const projectedSongLines = (lastProjection.kind === "lyrics" ? lastProjection.body.split("\n") : []).filter(Boolean);
  const projectedSongPaceLineIdx = lastProjection.paceLineIdx ?? -1;
  const projectedSongPaceLineProgress = lastProjection.paceLineProgress ?? 0;

  const getProjectedSongLineStyle = (lineIndex: number): CSSProperties | undefined => {
    if (!showSong || projectedSongPaceLineIdx < 0) return undefined;

    if (lineIndex < projectedSongPaceLineIdx) {
      return { color: "#f5c542" };
    }

    if (lineIndex > projectedSongPaceLineIdx) {
      return undefined;
    }

    const progressPercent = Math.round(clamp(projectedSongPaceLineProgress, 0, 1) * 100);

    if (progressPercent <= 0) {
      return undefined;
    }

    if (progressPercent >= 100) {
      return { color: "#f5c542" };
    }

    return {
      backgroundImage: `linear-gradient(90deg, #f5c542 ${progressPercent}%, ${mainPresentationSettings.fontColor || "#ffffff"} ${progressPercent}%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
    };
  };

  const showAudienceProjection = showHfb || showBible || showSong;
  const scriptureLowerThirdTemplate = getScriptureTemplate();
  const lyricLowerThirdTemplate = getLyricTemplate();
  const announcementLowerThirdTemplate = getAnnouncementTemplate();
  const fallbackSongLines = projectedSongLines.length ? projectedSongLines : currentSongSection.lines;
  const derivedLowerThirdData: LowerThirdBindingData | null = showSong
    ? {
        verse: fallbackSongLines.join("\n"),
        reference: projectedSongSectionTitle || projectedSongTitle || "",
        version: projectedSongTitle || "",
        songTitle: projectedSongTitle || "",
        type: "lyrics",
        paceLines: lastProjection.paceLines,
        paceLineIdx: projectedSongPaceLineIdx,
        paceLineProgress: projectedSongPaceLineProgress,
      }
    : showHfb || showBible
      ? {
          verse: projectedBody,
          reference: projectedReference,
          version: projectedVersion,
          type: "scripture",
        }
      : lowerThirdActiveData;
  const previewLowerThirdData =
    lowerThirdActiveData &&
    ((showSong && lowerThirdActiveData.type === "lyrics") ||
      ((showHfb || showBible) && lowerThirdActiveData.type === "scripture") ||
      (!showSong && !showHfb && !showBible))
      ? lowerThirdActiveData
      : derivedLowerThirdData;
  const previewLowerThirdTemplate = showSong
    ? lyricLowerThirdTemplate
    : showHfb || showBible
      ? scriptureLowerThirdTemplate
      : lowerThirdActiveData?.type === "announcement"
        ? announcementLowerThirdTemplate
        : null;
  const showLowerThirdProjection = Boolean(previewLowerThirdTemplate && previewLowerThirdData && (showHfb || showBible || showSong || lowerThirdVisible));
  const audiencePreviewBackground =
    mainPresentationSettings.backgroundType === "gradient"
      ? mainPresentationSettings.backgroundValue
      : mainPresentationSettings.backgroundType === "media"
        ? "#000000"
        : mainPresentationSettings.backgroundValue || "#0f0f0f";
  const audiencePreviewMediaSrc =
    mainPresentationSettings.backgroundType === "media" && mainPresentationSettings.backgroundValue
      ? resolveMediaUrl(mainPresentationSettings.backgroundValue) || mainPresentationSettings.backgroundValue
      : "";

  return (
    <aside className="w-[360px] shrink-0 bg-[#25124a] px-4 py-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[18px] text-pink-400">◉</span>
        <h3 className="text-[18px] font-semibold uppercase tracking-wide text-[#cbb8ff]">Live Preview</h3>
      </div>

      <section className="mb-5">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/80">Audience</div>
        <div className="overflow-hidden rounded-lg border border-[#4b3a73] bg-black">
          {showAudienceProjection ? (
            <MainPresentationRenderer
              settings={mainPresentationSettings}
              activeData={mainPresentationActiveData}
              isVisible={showAudienceProjection}
              isPreview={true}
              className="relative flex h-[310px] overflow-hidden"
            />
          ) : (
            <div className="h-[310px] bg-black" />
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/80">Lower Third</div>
        <div className="overflow-hidden rounded-lg border border-[#4b3a73] bg-black">
          <div className="relative h-[184px] overflow-hidden bg-black">
            {showLowerThirdProjection ? (
              <>
                <div className="absolute left-3 top-3 z-20 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Live</div>
                <div
                  className="absolute inset-x-0 bottom-0 aspect-video"
                  style={{ width: "100%" }}
                >
                  <LowerThirdRenderer
                    template={previewLowerThirdTemplate}
                    data={previewLowerThirdData}
                    isVisible={true}
                    isPreview={true}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            aria-label="Lower Third Active"
            className="inline-flex items-center gap-2 rounded-full border border-[#4b3a73] bg-[#171428] px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d7d2eb]"
          >
            <span className="pl-1">Active</span>
            <span className="relative inline-flex h-5 w-9 rounded-full bg-[#6f63ff]">
              <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
            </span>
          </button>
        </div>
      </section>
    </aside>
  );
}

function Detections({
  mode,
  hfbState,
  bibleState,
  songState,
}: {
  mode: PrimaryMode;
  hfbState: HfbState;
  bibleState: BibleState;
  songState: SongState;
}) {
  const recentDetections = useLiveConsoleStore((state) => state.recentDetections);
  const liveItems = recentDetections.map((item) => ({
    title: item.title.toUpperCase(),
    body: item.body
      ? `${item.body.slice(0, 92)}${item.body.length > 92 ? "..." : ""}`
      : "Projected from the shared Live Console coordinator.",
  }));
  const items =
    mode === "hfb"
      ? liveItems.slice(0, 8)
      : mode === "on-screen-bible"
        ? bibleState === "engaged"
          ? [...liveItems, ...mixedDetections, { title: "NUM 2:3", body: "3 Those were the names of Aaron's sons..." }].slice(0, 8)
          : startupDetections
        : songState === "engaged" || songState === "pace"
          ? liveItems.length
            ? liveItems.slice(0, 8)
            : startupDetections
          : startupDetections;

  return (
    <div className="border-t border-[#4b3a73] bg-[#4a3573] px-5 py-6">
      <h4 className="mb-5 text-[11px] font-bold uppercase tracking-widest text-[#cbb8ff]">Recent Detections</h4>
      {mode === "hfb" && items.length === 0 ? (
        <div className="flex h-[112px] items-center justify-center rounded border border-dashed border-[#756cff]/60 bg-black/30 px-4 text-center text-[11px] text-[#d6ccff]">
          Current and previous Bible commands will appear here after they are detected.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className={`h-[112px] w-[190px] shrink-0 rounded border p-3 ${mode !== "hfb" && index === items.length - 1 ? "border-[#756cff]" : "border-[#756cff]"} bg-black text-white shadow-[0_0_0_1px_rgba(117,108,255,0.18)]`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#d6ccff]">{item.title}</p>
              <p className="mt-5 text-[9px] leading-4 text-gray-300">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function LiveConsoleDesktopFrame({
  primaryMode,
  title,
  subtitle,
  hfbState = "empty",
  bibleState = "empty",
  songState = "empty",
  initialBibleQuery,
}: LiveConsoleDesktopFrameProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const authenticatedUserId = useAuthStore((state) => state.user?.id ?? null);
  const { data: songsResponse } = useSongs();
  const fetchedSongs = songsResponse?.songs ?? [];
  const songs = fetchedSongs.some((song) => matchesSongQuery(song, "example song") || song.id === defaultExampleSong.id)
    ? fetchedSongs
    : [defaultExampleSong, ...fetchedSongs];
  const query = useLiveConsoleStore((state) => state.bibleQuery);
  const setQuery = useLiveConsoleStore((state) => state.setBibleQuery);
  const active = useLiveConsoleStore((state) => state.bibleReference);
  const setBibleReference = useLiveConsoleStore((state) => state.setBibleReference);
  const setPrimaryMode = useLiveConsoleStore((state) => state.setPrimaryMode);
  const liveHfbState = useLiveConsoleStore((state) => state.hfbState);
  const setHfbState = useLiveConsoleStore((state) => state.setHfbState);
  const liveBibleState = useLiveConsoleStore((state) => state.bibleState);
  const setBibleState = useLiveConsoleStore((state) => state.setBibleState);
  const liveSongState = useLiveConsoleStore((state) => state.songState);
  const setSongState = useLiveConsoleStore((state) => state.setSongState);
  const songSelection = useLiveConsoleStore((state) => state.songSelection);
  const setSongSelection = useLiveConsoleStore((state) => state.setSongSelection);
  const paceBpm = useLiveConsoleStore((state) => state.paceBpm);
  const pacePlaying = useLiveConsoleStore((state) => state.pacePlaying);
  const paceProgress = useLiveConsoleStore((state) => state.paceProgress);
  const setPaceBpm = useLiveConsoleStore((state) => state.setPaceBpm);
  const setPacePlaying = useLiveConsoleStore((state) => state.setPacePlaying);
  const setPaceProgress = useLiveConsoleStore((state) => state.setPaceProgress);
  const projectScripture = useLiveConsoleStore((state) => state.projectScripture);
  const projectLyrics = useLiveConsoleStore((state) => state.projectLyrics);
  const clearProjection = useLiveConsoleStore((state) => state.clearProjection);
  const rememberModuleEntry = useLiveConsoleStore((state) => state.rememberModuleEntry);

  const [songQuery, setSongQuery] = useState("");
  const [songSearchOpen, setSongSearchOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [hfbSettings, setHfbSettings] = useState<HfbSettingsState>(() => {
    if (typeof window === "undefined") return defaultHfbSettings;

    try {
      const saved = window.localStorage.getItem(HFB_SETTINGS_STORAGE_KEY);
      if (!saved) return defaultHfbSettings;

      const parsed = {
        ...defaultHfbSettings,
        ...JSON.parse(saved),
      } as HfbSettingsState;

      if (parsed.usageModeExplicitChoice !== true) {
        return defaultHfbSettings;
      }

      return parsed.usageMode === "offline" || parsed.usageMode === "online"
        ? parsed
        : defaultHfbSettings;
    } catch {
      return defaultHfbSettings;
    }
  });
  const [isListeningMode, setIsListeningMode] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState("Microphone is off");
  const [transcriptEntries, setTranscriptEntries] = useState<HfbTranscriptEntry[]>([]);
  const [detectedReference, setDetectedReference] = useState<string | null>(null);
  const [detectedVerseText, setDetectedVerseText] = useState<string | null>(null);
  const [resolvedChapterOverride, setResolvedChapterOverride] = useState<ResolvedChapterOverride | null>(null);
  const [recentSongIds, setRecentSongIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = window.sessionStorage.getItem("qworship_live_console_recent_song_ids");
      const parsed = JSON.parse(saved ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string").slice(0, 8) : [];
    } catch {
      return [];
    }
  });

  const { startRecording, stopRecording } = useRawAudioStream();
  const {
    devices: audioDevices,
    selectedDeviceId,
    hasPermission: hasAudioPermission,
    isLoading: audioDevicesLoading,
    error: audioDevicesError,
    selectDevice,
    getSelectedDevice,
    requestPermission,
    refreshDevices,
    clearDevice,
  } = useAudioDevices();

  const selectedAudioDevice = getSelectedDevice();
  const selectedAudioDeviceLabel = selectedAudioDevice?.label || "System default microphone";
  const currentChapterVerses = useResolvedChapter(active, resolvedChapterOverride);

  const applyBibleMatch = useCallback((match: any) => {
    if (match?.success === false || !match?.result) return;

    const verse = match.result.verses?.[0];
    if (!verse) return;

    const nextVersion = (match.result.version || match.requestedVersion || active.version || "KJV").toUpperCase();
    const nextVerse = verse.verse ?? active.verse ?? 1;
    const fullChapterVerses = Array.isArray(match.result.chapterVerses)
      ? match.result.chapterVerses
          .map((item: any) => ({
            number: Number(item?.number ?? item?.verse ?? 0),
            text: typeof item?.text === "string" ? item.text : "",
          }))
          .filter((item: { number: number; text: string }) => Number.isFinite(item.number) && item.number > 0 && item.text.trim())
      : [];
    const fallbackVerseText = fullChapterVerses.find((item) => item.number === nextVerse)?.text ?? "";
    const verseText = verse[nextVersion.toLowerCase()] || verse.kjv || fallbackVerseText;
    const reference = shortRef(match.result.book, match.result.chapter, nextVerse);

    setBibleReference({
      book: match.result.book,
      chapter: match.result.chapter,
      verse: nextVerse,
      version: nextVersion,
    });
    setResolvedChapterOverride(
      fullChapterVerses.length > 0
        ? {
            book: match.result.book,
            chapter: match.result.chapter,
            version: nextVersion,
            verses: fullChapterVerses,
          }
        : null,
    );
    setHfbState("engaged");
    setDetectedReference(reference);
    setDetectedVerseText(verseText);

    // Directly project to the live screens (Audience + Lower Third) and
    // preview panels without waiting for the useEffect chain. This ensures
    // voice commands (next verse, previous verse, verse N, chapter N) project
    // immediately regardless of the autoProjectDetectedVerse setting or
    // React render batching timing.
    if (verseText) {
      projectScripture({
        verseText,
        reference,
        version: nextVersion,
        detectionTitle: reference,
        userId: authenticatedUserId,
      });
    }
  }, [active.verse, active.version, authenticatedUserId, projectScripture, setBibleReference, setHfbState]);

  const executeVoiceNavigation = useCallback(async (
    commandType: string,
    direction: "next" | "previous" | undefined,
    targetVerse?: number,
    offset?: number,
  ) => {
    let nextBook = active.book;
    let nextChapter = active.chapter;
    let nextVerse = active.verse ?? 1;

    if (commandType === "verse_change") {
      nextVerse = direction === "next" ? nextVerse + 1 : Math.max(1, nextVerse - 1);
    } else if (commandType === "chapter_change") {
      nextChapter = direction === "next" ? nextChapter + 1 : Math.max(1, nextChapter - 1);
      nextVerse = 1;
    } else if (commandType === "jump_to_verse" && targetVerse) {
      nextVerse = targetVerse;
    } else if (commandType === "jump_relative" && offset) {
      nextVerse = Math.max(1, nextVerse + offset);
    }

    const result = await resolveSingleVerseReference({
      book: nextBook,
      chapter: nextChapter,
      verse: nextVerse,
      version: active.version,
    });

    if (!result) return;

    // Use lowercase version key so applyBibleMatch can find the text via
    // verse[nextVersion.toLowerCase()]. result.version is uppercase (e.g. "KJV")
    // so we must lowercase it here.
    applyBibleMatch({
      success: true,
      commandType: "lookup",
      result: {
        book: result.book,
        chapter: result.chapter,
        verses: [{
          verse: result.verse.number,
          [result.version.toLowerCase()]: result.verse.text,
          kjv: result.verse.text, // always populate kjv as final fallback
        }],
      },
    });
  }, [active.book, active.chapter, active.verse, active.version, applyBibleMatch]);

  const { connect, disconnect, sendPCMData, isConnected, setSpeechProvider, getSpeechProviders } = useLocalWhisper({
    onBibleMatch: (match) => {
      setMicrophoneStatus("Command detected");
      applyBibleMatch(match);
    },
    onPartialTranscript: (text) => {
      const trimmed = text.trim();
      if (!trimmed || /^\[(silence|pause|noise)\]$/i.test(trimmed)) {
        setMicrophoneStatus("Listening...");
        return;
      }
      setMicrophoneStatus(`Hearing: ${trimmed}`);
    },
    onFinalTranscript: (text) => {
      const trimmed = text.trim();
      if (!trimmed || /^\[(silence|pause|noise)\]$/i.test(trimmed)) {
        setMicrophoneStatus("Listening...");
        return;
      }

      const parsed = parseVoiceCommand(trimmed, (active.version || "KJV").toLowerCase() as any);
      const isLookupCommand =
        parsed.commandType === "lookup" && Boolean(parsed.parsedReference) && parsed.confidence >= 0.8;
      const isCommand =
        isLookupCommand || (parsed.commandType !== "lookup" && parsed.confidence >= 0.8);

      let transcriptText = trimmed;
      if (isLookupCommand && parsed.parsedReference) {
        const ref = parsed.parsedReference;
        const versePart = ref.verseEnd
          ? `verse ${ref.verseStart} to ${ref.verseEnd}`
          : `verse ${ref.verseStart}`;
        transcriptText = `${ref.book} chapter ${ref.chapter} ${versePart}`;
      } else if (!isCommand) {
        setMicrophoneStatus("Listening...");
        return;
      }

      setTranscriptEntries((current) => [...current, {
        text: transcriptText,
        tone: hfbSettings.highlightCommands && isCommand ? "command" : "speech",
      }].slice(-Math.max(4, hfbSettings.transcriptBatchSize)));
      setMicrophoneStatus("Listening...");
    },
    onSleepCommand: () => {
      setMicrophoneStatus("Sleeping. Say Bible to wake.");
    },
    onWakeCommand: () => {
      setMicrophoneStatus("Listening...");
    },
    onVersionChange: (version) => {
      const newVersion = version.toUpperCase();
      setBibleReference({ version: newVersion });
      setMicrophoneStatus(`Version changed to ${newVersion}`);

      // Re-fetch the current verse in the new version and project it
      // immediately to the live screens and preview panels.
      // We must pass the new version explicitly because active.version
      // won't have updated yet (React state is async).
      void (async () => {
        const result = await resolveSingleVerseReference({
          book: active.book,
          chapter: active.chapter,
          verse: active.verse ?? 1,
          version: newVersion,
        });
        if (!result) return;
        const verseText = result.verse.text;
        const reference = shortRef(result.book, result.chapter, result.verse.number ?? (active.verse ?? 1));
        setDetectedReference(reference);
        setDetectedVerseText(verseText);
        setHfbState("engaged");
        projectScripture({
          verseText,
          reference,
          version: newVersion,
          detectionTitle: reference,
          userId: authenticatedUserId,
        });
      })();
    },
    onNavigation: (commandType, direction, targetVerse, offset) => {
      void executeVoiceNavigation(commandType, direction, targetVerse, offset);
    },
  });

  const toggleHfbListening = useCallback(async (nextState: boolean) => {
    if (!nextState) {
      stopRecording();
      disconnect();
      setIsListeningMode(false);
      setMicrophoneStatus("Microphone is off");
      return;
    }

    try {
      if (!isConnected) {
        await connect();
      }
      await startRecording((pcmBuffer) => {
        sendPCMData(pcmBuffer);
      });
      setIsListeningMode(true);
      setHfbState("empty");
      setTranscriptEntries([]);
      setDetectedReference(null);
      setDetectedVerseText(null);
      setResolvedChapterOverride(null);
      setMicrophoneStatus("Listening...");
    } catch (error) {
      console.error("[LiveConsoleDesktopFrame] Failed to start HFB microphone", error);
      stopRecording();
      disconnect();
      setIsListeningMode(false);
      setHfbState("empty");
      setMicrophoneStatus("Failed to access microphone");
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access and check the selected input device.",
        variant: "destructive",
      });
    }
  }, [connect, disconnect, isConnected, sendPCMData, setHfbState, startRecording, stopRecording, toast]);

  useEffect(() => {
    if (primaryMode === "hfb" || !isListeningMode) return;

    stopRecording();
    disconnect();
    setIsListeningMode(false);
    setMicrophoneStatus("Microphone is off");
  }, [primaryMode, isListeningMode, disconnect, stopRecording]);

  const currentSong = songs.find((song) => song.id === songSelection.songId) ?? null;
  const currentSongTitle = currentSong ? songSelection.title || displaySongTitle(currentSong) : "";
  const currentSongSections = currentSong ? extractSongSections(currentSong) : [];
  const activeSongSectionIndex = currentSongSections.length
    ? Math.min(songSelection.sectionIndex, Math.max(currentSongSections.length - 1, 0))
    : 0;
  const activeSongSection = currentSongSections[activeSongSectionIndex] ?? {
    key: "empty-song",
    title: "",
    lines: [],
  };
  const activeSongLyricsText = activeSongSection.lines.join("\n");
  const activeSongPaceData = getPaceProjectionData(activeSongSection.lines, paceProgress);
  const normalizedSongQuery = songQuery.trim().toLowerCase();
  const songSearchResults =
    normalizedSongQuery.length >= 3
      ? songs.filter((song) => matchesSongQuery(song, normalizedSongQuery)).slice(0, 8)
      : [];
  const recentSongTitles = recentSongIds
    .map((songId) => songs.find((song) => song.id === songId))
    .filter((song): song is Song => Boolean(song))
    .map((song) => displaySongTitle(song));

  const selectSong = (selectedSong: Song) => {
    const selectedSections = extractSongSections(selectedSong);
    const selectedTitle = displaySongTitle(selectedSong);

    setSongState("engaged");
    setPacePlaying(false);
    setPaceProgress(0);
    setSongSearchOpen(false);
    setSongSelection({
      songId: selectedSong.id,
      title: selectedTitle,
      artist: selectedSong.artist,
      sectionIndex: 0,
      sectionTitle: selectedSections[0]?.title ?? "",
      lyrics: selectedSections[0]?.lines ?? [],
    });
  };

  useEffect(() => {
    setPrimaryMode(primaryMode);
    setHfbState(hfbState);
    setBibleState(bibleState);
    setSongState(songState);
  }, [primaryMode, hfbState, bibleState, songState, setPrimaryMode, setHfbState, setBibleState, setSongState]);

  useEffect(() => {
    const parsed = initialBibleQuery ? parseBibleSearch(initialBibleQuery) : null;
    const nextReference = !parsed
      ? { book: "Genesis", chapter: 1, verse: null, version: "KJV" }
      : {
          book: parsed.book,
          chapter: parsed.chapter,
          verse: parsed.verse,
          version: "KJV",
        };

    setBibleReference(nextReference);
    setQuery(initialBibleQuery ?? searchInput(nextReference.book, nextReference.chapter, nextReference.verse));
  }, [initialBibleQuery, setBibleReference, setQuery]);

  useEffect(() => {
    const resolvedUserId =
      authenticatedUserId ??
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("qworship_user_id") : null);

    useLowerThirdStore.getState().setUserId(resolvedUserId);
    useMainPresentationStore.getState().setUserId(resolvedUserId ? String(resolvedUserId) : null);
  }, [authenticatedUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("qworship_live_console_recent_song_ids", JSON.stringify(recentSongIds));
  }, [recentSongIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HFB_SETTINGS_STORAGE_KEY, JSON.stringify(hfbSettings));
  }, [hfbSettings]);

  useEffect(() => {
    const providerId = hfbSettings.usageMode === "online" ? "online-whisper" : "offline-vosk";

    void setSpeechProvider(providerId).then((result) => {
      if (!result?.success) {
        console.warn("[LiveConsoleDesktopFrame] Failed to switch speech provider", result?.error);
        setMicrophoneStatus(
          result?.error ||
            (providerId === "online-whisper"
              ? "Online Whisper failed to activate."
              : "Offline Vosk failed to activate."),
        );
        return;
      }

      setMicrophoneStatus(
        providerId === "online-whisper"
          ? "Online Whisper ready"
          : "Offline Vosk ready",
      );
    });
  }, [hfbSettings.usageMode, setSpeechProvider]);

  useEffect(() => {
    if (!showSettingsModal) return;
    void refreshDevices();
    void getSpeechProviders();
  }, [showSettingsModal, refreshDevices, getSpeechProviders]);

  useEffect(() => {
    if (!songSelection.songId) return;

    setRecentSongIds((currentIds) => {
      if (currentIds[0] === songSelection.songId) return currentIds;
      return [songSelection.songId, ...currentIds.filter((songId) => songId !== songSelection.songId)].slice(0, 8);
    });
  }, [songSelection.songId]);

  useEffect(() => {
    if (!songs.length || !songSelection.songId) return;

    const nextSong = songs.find((song) => song.id === songSelection.songId);
    if (!nextSong) return;

    const nextSections = extractSongSections(nextSong);
    const nextIndex = nextSections.length
      ? Math.min(songSelection.sectionIndex, Math.max(nextSections.length - 1, 0))
      : 0;
    const nextSection = nextSections[nextIndex] ?? {
      key: "empty-song",
      title: "",
      lines: [],
    };
    const nextTitle = displaySongTitle(nextSong);
    const nextLyrics = nextSection.lines.join("\n");
    const currentLyrics = songSelection.lyrics.join("\n");

    if (
      songSelection.songId === nextSong.id &&
      songSelection.title === nextTitle &&
      songSelection.artist === nextSong.artist &&
      songSelection.sectionIndex === nextIndex &&
      songSelection.sectionTitle === nextSection.title &&
      currentLyrics === nextLyrics
    ) {
      return;
    }

    setSongSelection({
      songId: nextSong.id,
      title: nextTitle,
      artist: nextSong.artist,
      sectionIndex: nextIndex,
      sectionTitle: nextSection.title,
      lyrics: nextSection.lines,
    });
  }, [songs, songSelection.songId, songSelection.title, songSelection.artist, songSelection.sectionIndex, songSelection.sectionTitle, songSelection.lyrics, setSongSelection]);

  useEffect(() => {
    if (primaryMode !== "hfb" || liveHfbState !== "engaged" || !hfbSettings.autoProjectDetectedVerse) return;
    if (!detectedReference || !detectedVerseText) return;

    projectScripture({
      verseText: detectedVerseText,
      reference: detectedReference,
      version: (active.version || "KJV").toUpperCase(),
      detectionTitle: detectedReference,
      userId: authenticatedUserId,
    });
  }, [primaryMode, liveHfbState, hfbSettings.autoProjectDetectedVerse, detectedReference, detectedVerseText, active.version, projectScripture, authenticatedUserId]);

  useEffect(() => {
    if (primaryMode !== "on-screen-bible" || liveBibleState !== "engaged" || active.verse == null) return;

    const immediateVerseText = currentChapterVerses[active.verse - 1]?.text ?? "";
    const immediateReference = shortRef(active.book, active.chapter, active.verse);

    if (immediateVerseText) {
      projectScripture({
        verseText: immediateVerseText,
        reference: immediateReference,
        version: (active.version || "KJV").toUpperCase(),
        detectionTitle: immediateReference,
        userId: authenticatedUserId,
      });
      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await resolveSingleVerseReference({
        book: active.book,
        chapter: active.chapter,
        verse: active.verse ?? 1,
        version: active.version,
      });

      if (cancelled || !result) return;

      const verseText = result.verse.text;
      const reference = shortRef(result.book, result.chapter, result.verse.number ?? active.verse);
      projectScripture({
        verseText,
        reference,
        version: result.version.toUpperCase(),
        detectionTitle: reference,
        userId: authenticatedUserId,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [primaryMode, liveBibleState, active.book, active.chapter, active.verse, active.version, currentChapterVerses, projectScripture, authenticatedUserId]);

  useEffect(() => {
    if (primaryMode !== "songs" || (liveSongState !== "engaged" && liveSongState !== "pace")) return;
    projectLyrics({
      lyrics: activeSongSection.lines,
      sectionTitle: activeSongSection.title,
      songTitle: currentSongTitle,
      detectionTitle: currentSongTitle,
      userId: authenticatedUserId,
      pace: liveSongState === "pace"
        ? {
            lines: activeSongSection.lines,
            lineIdx: activeSongPaceData.lineIdx,
            lineProgress: activeSongPaceData.lineProgress,
          }
        : undefined,
    });
  }, [primaryMode, liveSongState, activeSongSection.key, activeSongSection.title, activeSongLyricsText, currentSongTitle, projectLyrics, authenticatedUserId, activeSongPaceData.lineIdx, activeSongPaceData.lineProgress]);

  useEffect(() => {
    if (primaryMode !== "songs" || liveSongState !== "pace" || !pacePlaying) return;

    const interval = window.setInterval(() => {
      const nextProgress = paceProgress + Math.max(0.02, paceBpm / 6000);

      if (nextProgress < 1) {
        setPaceProgress(nextProgress);
        return;
      }

      const nextSectionIndex = activeSongSectionIndex + 1;
      const nextSection = currentSongSections[nextSectionIndex];

      if (nextSection) {
        setSongSelection({
          sectionIndex: nextSectionIndex,
          sectionTitle: nextSection.title,
          lyrics: nextSection.lines,
        });
        setPaceProgress(0);
        return;
      }

      setPaceProgress(1);
      setPacePlaying(false);
    }, 300);

    return () => window.clearInterval(interval);
  }, [primaryMode, liveSongState, pacePlaying, paceProgress, paceBpm, setPaceProgress, activeSongSectionIndex, currentSongSections, setSongSelection, setPacePlaying]);

  const runSearch = () => {
    const parsed = parseBibleSearch(query);
    if (!parsed) return;
    setBibleState(parsed.verse == null ? "empty" : "engaged");
    setBibleReference({
      book: parsed.book,
      chapter: parsed.chapter,
      verse: parsed.verse,
      version: active.version || "KJV",
    });
    setQuery(searchInput(parsed.book, parsed.chapter, parsed.verse));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") runSearch();
  };

  const onSongQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSongSearchOpen(false);
      return;
    }

    if (event.key === "Enter" && songSearchResults.length) {
      event.preventDefault();
      selectSong(songSearchResults[0]);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#21113d]">
      <Header primaryMode={primaryMode} hfbState={liveHfbState} onOpenSettings={() => setShowSettingsModal(true)} />
      <HfbSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={hfbSettings}
        setSettings={setHfbSettings}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        hasAudioPermission={hasAudioPermission}
        isAudioDevicesLoading={audioDevicesLoading}
        audioDevicesError={audioDevicesError}
        selectedAudioDeviceLabel={selectedAudioDeviceLabel}
        onSelectDevice={selectDevice}
        onRequestPermission={requestPermission}
        onRefreshDevices={refreshDevices}
        onUseDefaultDevice={clearDevice}
      />
      <div className="flex min-h-0 flex-1">
        <aside className="w-[320px] shrink-0 border-r border-[#4b3a73] bg-[#21113d]">
          <Tabs primaryMode={primaryMode} />
          {primaryMode === "hfb" ? (
            <HfbLeft
              state={liveHfbState}
              isListeningMode={isListeningMode}
              microphoneStatus={microphoneStatus}
              transcriptEntries={transcriptEntries}
              detectedReference={detectedReference}
              detectedVerseText={detectedVerseText}
              onToggleListening={toggleHfbListening}
            />
          ) : primaryMode === "on-screen-bible" ? (
            <BibleLeft
              query={query}
              setQuery={setQuery}
              onSearch={runSearch}
              onKeyDown={onKeyDown}
              onSelectBook={(book) => {
                setBibleState("empty");
                setBibleReference({ book, chapter: 1, verse: null });
                setQuery(searchInput(book, 1, null));
              }}
              onSelectChapter={(chapter) => {
                setBibleState("empty");
                setBibleReference({ chapter, verse: null });
                setQuery(searchInput(active.book, chapter, null));
              }}
              onSelectVerse={(verse) => {
                setBibleState("engaged");
                setBibleReference({ verse });
                setQuery(searchInput(active.book, active.chapter, verse));
              }}
              active={active}
            />
          ) : (
            <SongsLeft
              state={liveSongState}
              currentSongTitle={currentSongTitle}
              recentSongTitles={recentSongTitles}
              songQuery={songQuery}
              searchResults={songSearchResults}
              searchOpen={songSearchOpen && normalizedSongQuery.length >= 3}
              onSongQueryChange={(value) => {
                setSongQuery(value);
                setSongSearchOpen(value.trim().length >= 3);
              }}
              onSongQueryFocus={() => setSongSearchOpen(songQuery.trim().length >= 3)}
              onSongSearchKeyDown={onSongQueryKeyDown}
              onOpenSongbook={() => {
                rememberModuleEntry("songbook", "/songs", "/songs");
                navigate("/songbook");
              }}
              onSelectSong={(songKeyToSelect) => {
                const selectedSong = songs.find((song) => song.id === songKeyToSelect) ?? songs.find((song) => displaySongTitle(song) === songKeyToSelect);
                if (!selectedSong) return;
                selectSong(selectedSong);
              }}
            />
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[#4b3a73] bg-[#14111f] px-4 py-3">
            <h1 className="text-[16px] font-semibold text-white">{title}</h1>
            {primaryMode === "hfb" || primaryMode === "on-screen-bible" || primaryMode === "songs" ? null : <p className="mt-1 max-w-3xl text-sm text-gray-400">{subtitle}</p>}
          </div>

          <div className="flex min-h-0 flex-1">
            {primaryMode === "hfb" ? (
              <HfbStage
                state={liveHfbState}
                active={active}
                onSelectVerse={(verse) => {
                  // Update the navigation reference so the middle panel highlights
                  // the selected verse immediately.
                  setBibleReference({ verse });
                  setQuery(searchInput(active.book, active.chapter, verse));
                  // Ensure HFB state is engaged so the projection effect fires.
                  setHfbState("engaged");
                  // Directly project to the live screens using the already-loaded
                  // chapter verses — no async fetch, no stale closure, no effect
                  // timing issues. This mirrors exactly what the on-screen-bible
                  // mode does when a verse is clicked.
                  const verseText = currentChapterVerses[verse - 1]?.text ?? "";
                  const reference = shortRef(active.book, active.chapter, verse);
                  if (verseText) {
                    // Immediate projection from cached chapter data.
                    setDetectedReference(reference);
                    setDetectedVerseText(verseText);
                    projectScripture({
                      verseText,
                      reference,
                      version: (active.version || "KJV").toUpperCase(),
                      detectionTitle: reference,
                      userId: authenticatedUserId,
                    });
                  } else {
                    // Fallback: fetch the verse if not in cache (e.g. first load).
                    void (async () => {
                      const result = await resolveSingleVerseReference({
                        book: active.book,
                        chapter: active.chapter,
                        verse,
                        version: active.version,
                      });
                      if (!result) return;
                      const fetchedText = result.verse.text;
                      const fetchedRef = shortRef(result.book, result.chapter, result.verse.number ?? verse);
                      setDetectedReference(fetchedRef);
                      setDetectedVerseText(fetchedText);
                      projectScripture({
                        verseText: fetchedText,
                        reference: fetchedRef,
                        version: result.version.toUpperCase(),
                        detectionTitle: fetchedRef,
                        userId: authenticatedUserId,
                      });
                    })();
                  }
                }}
                onSelectVersion={(version) => {
                  const newVersion = version.toUpperCase();
                  setBibleReference({ version: newVersion });
                  // Re-fetch current verse in new version and project immediately.
                  void (async () => {
                    const result = await resolveSingleVerseReference({
                      book: active.book,
                      chapter: active.chapter,
                      verse: active.verse ?? 1,
                      version: newVersion,
                    });
                    if (!result) return;
                    const verseText = result.verse.text;
                    const reference = shortRef(result.book, result.chapter, result.verse.number ?? (active.verse ?? 1));
                    setDetectedReference(reference);
                    setDetectedVerseText(verseText);
                    setHfbState("engaged");
                    projectScripture({
                      verseText,
                      reference,
                      version: newVersion,
                      detectionTitle: reference,
                      userId: authenticatedUserId,
                    });
                  })();
                }}
              />
            ) : primaryMode === "on-screen-bible" ? (
              <BibleStage
                active={active}
                onSelect={(verse) => {
                  setBibleState("engaged");
                  setBibleReference({ verse });
                  setQuery(searchInput(active.book, active.chapter, verse));
                }}
                onSelectVersion={(version) => {
                  const newVersion = version.toUpperCase();
                  setBibleReference({ version: newVersion });
                  // Re-fetch current verse in new version and project immediately.
                  void (async () => {
                    const result = await resolveSingleVerseReference({
                      book: active.book,
                      chapter: active.chapter,
                      verse: active.verse ?? 1,
                      version: newVersion,
                    });
                    if (!result) return;
                    const verseText = result.verse.text;
                    const reference = shortRef(result.book, result.chapter, result.verse.number ?? (active.verse ?? 1));
                    setBibleReference({ verse: result.verse.number ?? (active.verse ?? 1) });
                    projectScripture({
                      verseText,
                      reference,
                      version: newVersion,
                      detectionTitle: reference,
                      userId: authenticatedUserId,
                    });
                  })();
                }}
              />
            ) : (
              <SongsStage
                state={liveSongState}
                currentSongTitle={currentSongTitle}
                sections={currentSongSections}
                activeSectionIndex={activeSongSectionIndex}
                paceBpm={paceBpm}
                pacePlaying={pacePlaying}
                paceProgress={paceProgress}
                onSelectSection={(sectionIndex) => {
                  const section = currentSongSections[sectionIndex];
                  if (!section) return;
                  setSongState(liveSongState === "pace" ? "pace" : "engaged");
                  setSongSelection({
                    sectionIndex,
                    sectionTitle: section.title,
                    lyrics: section.lines,
                  });
                }}
                onActivatePaceMode={() => {
                  setSongState("pace");
                  setPaceProgress(0);
                  setPacePlaying(true);
                }}
                onTogglePace={() => setPacePlaying(!pacePlaying)}
                onDecreasePace={() => setPaceBpm(paceBpm - 5)}
                onIncreasePace={() => setPaceBpm(paceBpm + 5)}
                onClearProjection={() => {
                  clearProjection(authenticatedUserId);
                  setPacePlaying(false);
                }}
              />
            )}

            <Preview
              mode={primaryMode}
              hfbState={liveHfbState}
              bibleState={liveBibleState}
              songState={liveSongState}
              active={active}
              currentSongTitle={currentSongTitle}
              currentSongSection={activeSongSection}
              resolvedChapterOverride={resolvedChapterOverride}
            />
          </div>
        </div>
      </div>

      <Detections mode={primaryMode} hfbState={liveHfbState} bibleState={liveBibleState} songState={liveSongState} />
    </div>
  );
}

export default LiveConsoleDesktopFrame;
