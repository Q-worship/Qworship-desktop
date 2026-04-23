import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Check,
  Copy,
  Trash2,
  Pencil,
  Eye,
  Layout,
  ExternalLink,
  BookOpen,
  Music,
  Megaphone,
  Link,
} from "lucide-react";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import { useAuthStore } from "@/features/auth/auth.store";
import { TEMPLATE_CATEGORIES } from "./defaultTemplates";
import { LowerThirdRenderer } from "./LowerThirdRenderer";
import type { LowerThirdTemplate, LowerThirdBindingData, TemplateCategory } from "./types";
import { NdiSettingsPanel } from "@/features/dashboard/NdiSettingsPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentTab = "bible" | "songs" | "announcements";

const TAB_SCRIPTURE_CATEGORIES: TemplateCategory[] = [
  "professional",
  "contemporary",
  "elegant",
  "branded",
];

interface LowerThirdSettingsPageProps {
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoredChurchName(): string {
  try {
    const stored = localStorage.getItem("qworship_user");
    if (stored) {
      const user = JSON.parse(stored);
      return user.organizationName || "My Church";
    }
  } catch {}
  return "My Church";
}

function getPlaceholderData(template: LowerThirdTemplate): LowerThirdBindingData {
  const churchName = getStoredChurchName();
  if (template.category === "lyrics") {
    return {
      verse: "Amazing grace, how sweet the sound\nThat saved a wretch like me",
      reference: "Verse 1",
      version: "Amazing Grace",
      churchName,
      songTitle: "Amazing Grace",
    };
  }
  if (template.category === "announcement") {
    return {
      verse: "Sunday Service — Join us for worship and fellowship",
      reference: "This Sunday",
      version: "10:00 AM",
      churchName,
      songTitle: "",
    };
  }
  return {
    verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    reference: "John 3:16",
    version: "NIV",
    churchName,
    songTitle: "",
  };
}

// ─── Template Card — 1920×1080 render scaled to card ─────────────────────────
//
// We render the lower third at its native 1920×1080 resolution so that ALL
// pixel-based CSS properties (fontSize, blur, borderRadius, letterSpacing) are
// computed correctly — identical to what the broadcast renderer shows.
// Then we CSS-scale the virtual canvas down to fit the card.
//
// useLayoutEffect reads offsetWidth synchronously BEFORE the first paint
// (after layout is committed), so scale is always correct from frame 1.
// A ResizeObserver keeps it accurate on window resize.

function TemplateCardPreview({ template }: { template: LowerThirdTemplate }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0);

  // Sync read — runs after layout, before paint. offsetWidth is correct here.
  useLayoutEffect(() => {
    if (outerRef.current) {
      setZoom(outerRef.current.offsetWidth / 1920);
    }
  }, []);

  // Keep up-to-date on resize
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setZoom(entry.contentRect.width / 1920);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ aspectRatio: "16/9" }}
    >
      {zoom > 0 && (
        <div
          style={{
            width: 1920,
            height: 1080,
            zoom: zoom,
            position: "relative",
            pointerEvents: "none",
          }}
        >
          <LowerThirdRenderer
            template={template}
            data={getPlaceholderData(template)}
            isVisible={true}
            isPreview={true}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LowerThirdSettingsPage({ onClose }: LowerThirdSettingsPageProps) {
  const [, navigate] = useLocation();
  const {
    scriptureTemplateId,
    lyricTemplateId,
    announcementTemplateId,
    setScriptureTemplateId,
    setLyricTemplateId,
    setAnnouncementTemplateId,
    setSelectedTemplateId,
    getAllTemplates,
    enabled,
    setEnabled,
    duplicateTemplate,
    deleteCustomTemplate,
  } = useLowerThirdStore();

  const authUser = useAuthStore((s) => s.user);

  // ── OBS URL ───────────────────────────────────────────────────────────────
  const [ltBase, setLtBase] = useState("http://localhost:3400");
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    fetch("/api/lower-third/config", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ltBaseUrl) setLtBase(d.ltBaseUrl); })
      .catch(() => {});
  }, []);

  const renderUrl = authUser?.id
    ? `${ltBase}/r/${authUser.id}`
    : `${ltBase}/r/me`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(renderUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ContentTab>("bible");
  const [selectedCategory, setSelectedCategory] = useState<
    TemplateCategory | "all" | "custom"
  >("all");

  // ── Template lists ────────────────────────────────────────────────────────
  const allTemplates = getAllTemplates();

  const bibleTemplates = allTemplates.filter(
    (t) => !["lyrics", "announcement"].includes(t.category)
  );
  const lyricsTemplates = allTemplates.filter((t) => t.category === "lyrics");
  const announcementTemplates = allTemplates.filter(
    (t) => t.category === "announcement"
  );

  const tabTemplates =
    activeTab === "bible"
      ? bibleTemplates
      : activeTab === "songs"
      ? lyricsTemplates
      : announcementTemplates;

  const availableCategories = TEMPLATE_CATEGORIES.filter((c) =>
    TAB_SCRIPTURE_CATEGORIES.includes(c.id)
  );

  const displayedTemplates =
    activeTab !== "bible"
      ? tabTemplates
      : selectedCategory === "all"
      ? tabTemplates
      : selectedCategory === "custom"
      ? tabTemplates.filter((t) => t.isCustom)
      : tabTemplates.filter((t) => t.category === selectedCategory);

  const activeIdForTab =
    activeTab === "bible"
      ? scriptureTemplateId
      : activeTab === "songs"
      ? lyricTemplateId
      : announcementTemplateId;

  const setActiveIdForTab = useCallback(
    (id: string) => {
      setSelectedTemplateId(id);
      if (activeTab === "bible") setScriptureTemplateId(id);
      else if (activeTab === "songs") setLyricTemplateId(id);
      else setAnnouncementTemplateId(id);
    },
    [
      activeTab,
      setSelectedTemplateId,
      setScriptureTemplateId,
      setLyricTemplateId,
      setAnnouncementTemplateId,
    ]
  );

  const handleTabChange = (tab: ContentTab) => {
    setActiveTab(tab);
    setSelectedCategory("all");
  };

  const { toast } = useToast();

  const handleEditTemplate = useCallback(
    async (template: LowerThirdTemplate) => {
      let targetId = template.id;
      if (template.isDefault) {
        try {
          await duplicateTemplate(template.id);
          const allT = getAllTemplates();
          const copied = allT[allT.length - 1];
          if (copied) {
            setSelectedTemplateId(copied.id);
            targetId = copied.id;
          }
        } catch (err: any) {
          toast({ title: "Cannot duplicate", description: err.message, variant: "destructive" });
          return;
        }
      } else {
        setSelectedTemplateId(template.id);
      }
      navigate(`/lower-third-editor/${targetId}`);
    },
    [duplicateTemplate, getAllTemplates, setSelectedTemplateId, navigate, toast]
  );

  const handleDeleteTemplate = useCallback(
    (id: string) => deleteCustomTemplate(id),
    [deleteCustomTemplate]
  );

  return (
    <div
      className="flex flex-col min-h-screen bg-[#0f0920]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="px-8 py-5 flex justify-between items-center border-b border-gray-700/40 flex-shrink-0 bg-[#0c0718]">
        <div>
          <h1 className="text-2xl font-bold text-white">Lower Third Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Choose and customize lower third templates for your presentations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-1.5 rounded-full border border-gray-700/50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active
            </span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                enabled ? "bg-purple-600" : "bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Config strip ───────────────────────────────────────────────── */}
      <div className="px-8 py-4 border-b border-gray-700/30 bg-[#0a0614] flex-shrink-0">
        {/* In the desktop app (Electron), show NDI streaming controls instead of the cloud URL */}
        {window.api?.ndi ? (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.1em]">NDI Output</h2>
            <NdiSettingsPanel />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Scripture */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-400" />
                Scripture Template
              </label>
              <Select value={scriptureTemplateId} onValueChange={setScriptureTemplateId}>
                <SelectTrigger className="bg-[#1a0f2e] border-gray-700/60 text-white text-sm h-10">
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white max-h-64">
                  {bibleTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-sm">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lyrics */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] flex items-center gap-1">
                <Music className="w-3 h-3 text-pink-400" />
                Lyrics Template
              </label>
              <Select value={lyricTemplateId} onValueChange={setLyricTemplateId}>
                <SelectTrigger className="bg-[#1a0f2e] border-gray-700/60 text-white text-sm h-10">
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white max-h-64">
                  {lyricsTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-sm">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* OBS Source URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] flex items-center gap-1">
                <Link className="w-3 h-3 text-blue-400" />
                Streaming Source URL
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#1a0f2e] border border-gray-700/60 rounded-lg overflow-hidden min-w-0">
                  <span className="pl-3 text-gray-500 flex-shrink-0">
                    <Link className="w-3 h-3" />
                  </span>
                  <span className="flex-1 text-xs text-gray-400 truncate px-2 py-2.5">
                    {renderUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-all ${
                    copiedUrl
                      ? "bg-green-600 text-white"
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  }`}
                  title={renderUrl}
                >
                  {copiedUrl ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedUrl ? "Copied!" : "Copy"}
                </button>
                <a
                  href={renderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 border border-gray-700/60 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  title="Open in browser"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <nav className="px-8 pt-1 border-b border-gray-700/40 flex gap-8 flex-shrink-0 bg-[#0c0718]">
        {(
          [
            {
              id: "bible" as ContentTab,
              label: "Bible",
              Icon: BookOpen,
              activeClass: "text-purple-400 border-purple-500",
            },
            {
              id: "songs" as ContentTab,
              label: "Songs",
              Icon: Music,
              activeClass: "text-pink-400 border-pink-500",
            },
            {
              id: "announcements" as ContentTab,
              label: "Announcements",
              Icon: Megaphone,
              activeClass: "text-indigo-400 border-indigo-500",
            },
          ] as const
        ).map(({ id, label, Icon, activeClass }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-2 px-1 py-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === id
                ? activeClass
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Category filter ──────────────────────────────────────────────── */}
      <div className="px-8 py-3 border-b border-gray-700/20 bg-[#0a0614] flex items-center gap-2 flex-wrap flex-shrink-0">
        {activeTab === "bible" ? (
          <>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              All Templates
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory("custom")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === "custom"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              Custom
            </button>
          </>
        ) : (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            {activeTab === "songs" ? (
              <>
                <Music className="w-3.5 h-3.5 text-pink-500" />
                Templates designed for worship lyrics
              </>
            ) : (
              <>
                <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                Templates designed for church announcements and events
              </>
            )}
          </p>
        )}

        <div className="flex-1" />
        <Button
          onClick={() => {
            // Navigate to editor with the currently active tab's template
            if (activeIdForTab) {
              navigate(`/lower-third-editor/${activeIdForTab}`);
            }
          }}
          variant="outline"
          size="sm"
          className="border-purple-500/40 text-purple-300 hover:bg-purple-600/20 bg-purple-500/5"
          disabled={!activeIdForTab}
        >
          <Eye className="w-4 h-4 mr-1.5" />
          Preview Active
        </Button>
      </div>

      {/* ── Template grid ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-[#4a4560] scrollbar-track-transparent">
        {displayedTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Layout className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No templates in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedTemplates.map((template) => {
              const isTabActive = activeIdForTab === template.id;
              const isScripture = scriptureTemplateId === template.id;
              const isLyric = lyricTemplateId === template.id;
              const isAnnouncement = announcementTemplateId === template.id;

              const activeBorder =
                activeTab === "songs"
                  ? "border-pink-500 ring-2 ring-pink-500/30"
                  : activeTab === "announcements"
                  ? "border-indigo-500 ring-2 ring-indigo-500/30"
                  : "border-purple-500 ring-2 ring-purple-500/30";

              const activeCheckBg =
                activeTab === "songs"
                  ? "bg-pink-600"
                  : activeTab === "announcements"
                  ? "bg-indigo-600"
                  : "bg-purple-600";

              return (
                <div
                  key={template.id}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-[1.02] ${
                    isTabActive
                      ? activeBorder
                      : "border-gray-700/50 hover:border-gray-600"
                  }`}
                  onClick={() => setActiveIdForTab(template.id)}
                >
                  {/* ── Template preview (inline renderer) ──── */}
                  <TemplateCardPreview template={template} />

                  {/* Active check */}
                  {isTabActive && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className={`${activeCheckBg} text-white rounded-full p-1`}>
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  )}

                  {/* Assignment badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {isScripture && (
                      <span className="flex items-center gap-1 bg-purple-700/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        <BookOpen className="w-2.5 h-2.5" /> Scripture
                      </span>
                    )}
                    {isLyric && (
                      <span className="flex items-center gap-1 bg-pink-700/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        <Music className="w-2.5 h-2.5" /> Songs
                      </span>
                    )}
                    {isAnnouncement && (
                      <span className="flex items-center gap-1 bg-indigo-700/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        <Megaphone className="w-2.5 h-2.5" /> Announce
                      </span>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-[52px] left-0 right-0 px-3 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        className="p-1.5 bg-gray-700/90 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTemplate(template.id);
                        }}
                        className="p-1.5 bg-gray-700/90 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5 text-white" />
                      </button>
                      {activeTab === "bible" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setScriptureTemplateId(template.id);
                          }}
                          className="p-1.5 bg-purple-700/90 hover:bg-purple-600 rounded-lg transition-colors"
                          title="Set as Scripture default"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-white" />
                        </button>
                      )}
                      {activeTab === "songs" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLyricTemplateId(template.id);
                          }}
                          className="p-1.5 bg-pink-700/90 hover:bg-pink-600 rounded-lg transition-colors"
                          title="Set as Lyrics default"
                        >
                          <Music className="w-3.5 h-3.5 text-white" />
                        </button>
                      )}
                      {activeTab === "announcements" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnnouncementTemplateId(template.id);
                          }}
                          className="p-1.5 bg-indigo-700/90 hover:bg-indigo-600 rounded-lg transition-colors"
                          title="Set as Announcement default"
                        >
                          <Megaphone className="w-3.5 h-3.5 text-white" />
                        </button>
                      )}
                      {template.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="p-1.5 bg-red-700/90 hover:bg-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Name + desc */}
                  <div className="bg-[#1a0f2e] px-4 py-3">
                    <h4 className="text-white text-sm font-semibold truncate">
                      {template.name}
                    </h4>
                    <p className="text-gray-400 text-xs truncate mt-0.5">
                      {template.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
