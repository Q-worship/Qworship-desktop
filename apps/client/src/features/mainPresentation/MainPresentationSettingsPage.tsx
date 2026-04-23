import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useMainPresentationStore,
  DEFAULT_SETTINGS,
  type MainPresentationSettings,
} from "@/stores/useMainPresentationStore";
import { BackgroundMediaPicker } from "./BackgroundMediaPicker";
import { useAuthStore } from "@/features/auth/auth.store";
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
  Image as ImageIcon,
  Layout,
  ExternalLink,
  Link,
  Type,
  Palette,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NdiSettingsPanel } from "@/features/dashboard/NdiSettingsPanel";

interface MainPresentationSettingsPageProps {
  onClose: () => void;
}

// ── Gradient Stop ─────────────────────────────────────────────────────────────
interface GradientStop {
  id: string;
  color: string;
  position: number; // 0–100
}

function buildGradientCss(angle: number, stops: GradientStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopsStr = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  return `linear-gradient(${angle}deg, ${stopsStr})`;
}

function parseGradientToState(
  css: string,
): { angle: number; stops: GradientStop[] } | null {
  try {
    const match = css.match(/linear-gradient\((\d+)deg,(.+)\)/);
    if (!match) return null;
    const angle = parseInt(match[1]);
    const stopParts = match[2].split(",").map((s) => s.trim());
    const stops: GradientStop[] = stopParts.map((part, i) => {
      const tokens = part.split(" ");
      const position = parseInt(tokens[tokens.length - 1]);
      const color = tokens.slice(0, tokens.length - 1).join(" ");
      return { id: String(i), color, position };
    });
    return { angle, stops };
  } catch {
    return null;
  }
}

// ── GradientBuilder component ─────────────────────────────────────────────────
function GradientBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (css: string) => void;
}) {
  const parsed = parseGradientToState(value);
  const [angle, setAngle] = useState(parsed?.angle ?? 135);
  const [stops, setStops] = useState<GradientStop[]>(
    parsed?.stops ?? [
      { id: "1", color: "#0f0f0f", position: 0 },
      { id: "2", color: "#222244", position: 100 },
    ],
  );

  const emit = useCallback(
    (a: number, s: GradientStop[]) => {
      onChange(buildGradientCss(a, s));
    },
    [onChange],
  );

  const updateAngle = (v: number) => {
    setAngle(v);
    emit(v, stops);
  };

  const updateStop = (id: string, patch: Partial<GradientStop>) => {
    const updated = stops.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setStops(updated);
    emit(angle, updated);
  };

  const addStop = () => {
    const id = Date.now().toString();
    const position = Math.round(
      stops.reduce((sum, s) => sum + s.position, 0) / stops.length,
    );
    const updated = [...stops, { id, color: "#444466", position }];
    setStops(updated);
    emit(angle, updated);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    const updated = stops.filter((s) => s.id !== id);
    setStops(updated);
    emit(angle, updated);
  };

  const gradientPreview = buildGradientCss(angle, stops);

  return (
    <div className="space-y-4">
      {/* Preview bar */}
      <div
        className="w-full h-12 rounded-lg border border-gray-600 shadow-inner"
        style={{ background: gradientPreview }}
      />

      {/* Angle */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm text-gray-300">Angle</Label>
          <span className="text-xs font-mono text-purple-300">{angle}°</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => updateAngle(Number(e.target.value))}
            className="flex-1 h-2 rounded appearance-none bg-gray-700 accent-purple-500 cursor-pointer"
          />
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center flex-shrink-0"
            style={{ background: gradientPreview }}
            title={`${angle}°`}
          />
        </div>
      </div>

      {/* Color stops */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm text-gray-300">Colour Stops</Label>
          <button
            onClick={addStop}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stop
          </button>
        </div>

        <div className="space-y-2">
          {[...stops]
            .sort((a, b) => a.position - b.position)
            .map((stop) => (
              <div
                key={stop.id}
                className="flex items-center gap-2 bg-[#0a0614] border border-gray-700/60 rounded-lg px-3 py-2"
              >
                <GripVertical className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />

                {/* Color swatch + picker */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded border border-gray-600 cursor-pointer overflow-hidden"
                    style={{ background: stop.color }}
                  >
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) =>
                        updateStop(stop.id, { color: e.target.value })
                      }
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      title="Pick colour"
                    />
                  </div>
                </div>

                {/* Hex label */}
                <span className="text-xs font-mono text-gray-400 w-16 flex-shrink-0">
                  {stop.color}
                </span>

                {/* Position slider */}
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={stop.position}
                    onChange={(e) =>
                      updateStop(stop.id, { position: Number(e.target.value) })
                    }
                    className="flex-1 h-1.5 rounded appearance-none bg-gray-700 accent-purple-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-gray-500 w-8 text-right flex-shrink-0">
                    {stop.position}%
                  </span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeStop(stop.id)}
                  disabled={stops.length <= 2}
                  className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* CSS output (readonly) */}
      <div className="bg-[#0a0614] border border-gray-700/60 rounded-lg px-3 py-2">
        <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">
          Generated CSS
        </p>
        <p className="text-xs font-mono text-gray-400 break-all">
          {gradientPreview}
        </p>
      </div>
    </div>
  );
}

// ── ColorPickerField ──────────────────────────────────────────────────────────
function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-300">{label}</Label>
      <div className="flex items-center gap-3">
        {/* Colour swatch acts as the trigger */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded border border-gray-600 cursor-pointer overflow-hidden shadow-inner"
            style={{ background: value }}
          >
            <input
              type="color"
              value={value.startsWith("#") ? value : "#ffffff"}
              onChange={(e) => onChange(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              title="Pick colour"
            />
          </div>
        </div>
        {/* Hex text input stays editable for power users */}
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#0a0614] border-gray-700 text-white font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MainPresentationSettingsPage({
  onClose,
}: MainPresentationSettingsPageProps) {
  const { settings, setSettings, enabled, setEnabled } =
    useMainPresentationStore();

  const authUser = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [ltBase, setLtBase] = useState("http://localhost:3400");
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    fetch("/api/lower-third/config", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ltBaseUrl) setLtBase(d.ltBaseUrl);
      })
      .catch(() => {});
  }, []);

  const renderUrl = authUser?.id
    ? `${ltBase}/p/${authUser.id}`
    : `${ltBase}/p/me`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(renderUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast({
        title: "URL Copied",
        description: "Stream URL copied to clipboard",
      });
    });
  };

  // Every call to setSettings also triggers the SSE push via the store
  const handleUpdate = (updates: Partial<MainPresentationSettings>) => {
    setSettings(updates);
  };

  const bgType = settings.backgroundType;

  const previewBg =
    bgType === "gradient"
      ? settings.backgroundValue
      : bgType === "media"
        ? "#000000"
        : settings.backgroundValue || "#0f0f0f";

  return (
    <div
      className="flex flex-col min-h-screen bg-[#0f0920]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <header className="px-8 py-5 flex justify-between items-center border-b border-gray-700/40 flex-shrink-0 bg-[#0c0718]">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Main Presentation Settings
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure global patterns applied to all fullscreen presentation
            items
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

      {/* URL bar / NDI controls */}
      <div className="px-8 py-4 border-b border-gray-700/30 bg-[#0a0614] flex-shrink-0">
        {window.api?.ndi ? (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.1em]">NDI Output</h2>
            <NdiSettingsPanel />
          </div>
        ) : (
          <div className="space-y-1.5 sm:max-w-xl">
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
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-all ${
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
                {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
              <a
                href={renderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Open in browser"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add this as a Browser Source in OBS. Width: 1920, Height: 1080.
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8 relative">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Settings column ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Background */}
            <section className="bg-[#120a26] border border-gray-700/40 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-700/40">
                <Palette className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Background</h2>
              </div>

              {/* Type selector (solid / gradient / media) */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Background Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      handleUpdate({
                        backgroundType: "solid",
                        backgroundValue: "#0f0f0f",
                        backgroundMediaType: undefined,
                        backgroundMediaId: undefined,
                      })
                    }
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                      bgType === "solid"
                        ? "bg-purple-600/30 border-purple-500 text-purple-300"
                        : "bg-[#0a0614] border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    Solid Colour
                  </button>
                  <button
                    onClick={() =>
                      handleUpdate({
                        backgroundType: "gradient",
                        backgroundValue:
                          "linear-gradient(135deg, #0f0f0f 0%, #222244 100%)",
                        backgroundMediaType: undefined,
                        backgroundMediaId: undefined,
                      })
                    }
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                      bgType === "gradient"
                        ? "bg-purple-600/30 border-purple-500 text-purple-300"
                        : "bg-[#0a0614] border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    Gradient
                  </button>
                  <button
                    onClick={() =>
                      handleUpdate({
                        backgroundType: "media",
                      })
                    }
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                      bgType === "media"
                        ? "bg-purple-600/30 border-purple-500 text-purple-300"
                        : "bg-[#0a0614] border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Media
                  </button>
                </div>
              </div>

              {/* Solid colour picker */}
              {bgType === "solid" && (
                <ColorPickerField
                  label="Background Colour"
                  value={settings.backgroundValue}
                  onChange={(v) => handleUpdate({ backgroundValue: v })}
                />
              )}

              {/* Gradient builder */}
              {bgType === "gradient" && (
                <GradientBuilder
                  value={settings.backgroundValue}
                  onChange={(css) => handleUpdate({ backgroundValue: css })}
                />
              )}

              {/* Media picker */}
              {bgType === "media" && (
                <BackgroundMediaPicker
                  selectedMediaId={settings.backgroundMediaId}
                  selectedMediaSource={settings.backgroundMediaSource}
                  onSelect={({ id, url, mediaType, source }) =>
                    handleUpdate({
                      backgroundValue: url,
                      backgroundMediaType: mediaType,
                      backgroundMediaId: id,
                      backgroundMediaSource: source,
                    })
                  }
                  onClear={() =>
                    handleUpdate({
                      backgroundValue: "",
                      backgroundMediaType: undefined,
                      backgroundMediaId: undefined,
                      backgroundMediaSource: undefined,
                    })
                  }
                />
              )}
            </section>

            {/* Typography */}
            <section className="bg-[#120a26] border border-gray-700/40 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-700/40">
                <Type className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Typography</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Font Family</Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(val) => handleUpdate({ fontFamily: val })}
                  >
                    <SelectTrigger className="bg-[#0a0614] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                      <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                      <SelectItem value="'Roboto', sans-serif">
                        Roboto
                      </SelectItem>
                      <SelectItem value="'Playfair Display', serif">
                        Playfair Display
                      </SelectItem>
                      <SelectItem value="'Montserrat', sans-serif">
                        Montserrat
                      </SelectItem>
                      <SelectItem value="'Open Sans', sans-serif">
                        Open Sans
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Font Weight</Label>
                  <Select
                    value={settings.fontWeight}
                    onValueChange={(val) => handleUpdate({ fontWeight: val })}
                  >
                    <SelectTrigger className="bg-[#0a0614] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                      <SelectItem value="400">Regular (400)</SelectItem>
                      <SelectItem value="500">Medium (500)</SelectItem>
                      <SelectItem value="600">SemiBold (600)</SelectItem>
                      <SelectItem value="700">Bold (700)</SelectItem>
                      <SelectItem value="800">ExtraBold (800)</SelectItem>
                      <SelectItem value="900">Black (900)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Font colour picker */}
              <ColorPickerField
                label="Text Colour"
                value={settings.fontColor}
                onChange={(v) => handleUpdate({ fontColor: v })}
              />

              {/* Font size range */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-gray-300">
                    Font Size Range (px)
                  </Label>
                  <span className="text-xs text-gray-500 font-mono">
                    {settings.fontSizeMin} – {settings.fontSizeMax} px
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-500">Minimum</p>
                    <input
                      type="range"
                      min={12}
                      max={200}
                      value={settings.fontSizeMin}
                      onChange={(e) =>
                        handleUpdate({ fontSizeMin: Number(e.target.value) })
                      }
                      className="w-full h-2 rounded appearance-none bg-gray-700 accent-purple-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-500">Maximum</p>
                    <input
                      type="range"
                      min={24}
                      max={300}
                      value={settings.fontSizeMax}
                      onChange={(e) =>
                        handleUpdate({ fontSizeMax: Number(e.target.value) })
                      }
                      className="w-full h-2 rounded appearance-none bg-gray-700 accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Alignment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">
                    Horizontal Align
                  </Label>
                  <Select
                    value={settings.textAlign}
                    onValueChange={(val: any) =>
                      handleUpdate({ textAlign: val })
                    }
                  >
                    <SelectTrigger className="bg-[#0a0614] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">
                    Vertical Align
                  </Label>
                  <Select
                    value={settings.justifyContent}
                    onValueChange={(val: any) =>
                      handleUpdate({ justifyContent: val })
                    }
                  >
                    <SelectTrigger className="bg-[#0a0614] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                      <SelectItem value="flex-start">Top</SelectItem>
                      <SelectItem value="center">Middle</SelectItem>
                      <SelectItem value="flex-end">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>

          {/* ── Preview column ── */}
          <section className="lg:col-span-7 sticky top-0 bg-[#120a26] border border-gray-700/40 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-700/40">
              <Layout className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Live Preview</h2>
            </div>

            <div
              className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-600 shadow-2xl flex"
              style={{
                background: previewBg,
                justifyContent: settings.justifyContent,
                alignItems:
                  settings.textAlign === "center"
                    ? "center"
                    : settings.textAlign === "right"
                      ? "flex-end"
                      : "flex-start",
                padding: "6% 10%",
              }}
            >
              {/* Media background layer */}
              {bgType === "media" &&
                settings.backgroundValue &&
                (settings.backgroundMediaType === "video" ? (
                  <video
                    key={settings.backgroundValue}
                    src={settings.backgroundValue}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                ) : (
                  <img
                    src={settings.backgroundValue}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                ))}

              <div
                className="w-full relative z-10"
                style={{
                  color: settings.fontColor,
                  fontFamily: settings.fontFamily,
                  fontWeight: settings.fontWeight,
                  textAlign: settings.textAlign,
                  fontSize: `clamp(${settings.fontSizeMin * 0.35}px, 3.5vw, ${settings.fontSizeMax * 0.35}px)`,
                  lineHeight: "1.4",
                  whiteSpace: "pre-wrap",
                }}
              >
                For God so loved the world that he gave his one and only Son,
                that whoever believes in him shall not perish but have eternal
                life.
                <div
                  style={{
                    fontSize: "0.5em",
                    opacity: 0.8,
                    marginTop: "0.5em",
                    fontWeight: "500",
                    letterSpacing: "0.05em",
                  }}
                >
                  John 3:16 — KJV
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                Preview is scaled. Actual output adapts to the 1920×1080 OBS
                source.
              </span>
              <button
                onClick={() => handleUpdate(DEFAULT_SETTINGS)}
                className="text-red-400 hover:text-red-300 underline"
              >
                Reset to Defaults
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
