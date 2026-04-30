import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  Save,
  Type,
  Square,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Upload,
  Loader2,
  Plus,
  Check,
} from "lucide-react";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import { useAuthStore } from "@/features/auth/auth.store";
import { LowerThirdRenderer } from "./LowerThirdRenderer";
import type {
  LowerThirdTemplate,
  LowerThirdElement,
  AnimationType,
  TextAlign,
  FontStyle,
  ObjectFit,
  CompositeBindingPart,
  BindingField,
  LowerThirdBindingData,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEditorAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getStoredChurchName(): string {
  try {
    const stored = localStorage.getItem("qworship_user");
    if (stored) {
      const user = JSON.parse(stored);
      return user.organizationName || "My Church";
    }
  } catch (error) {
    console.warn("[LowerThirdEditorPage] Failed to read stored church name", error);
  }
  return "My Church";
}

function getPlaceholderData(template: LowerThirdTemplate): LowerThirdBindingData {
  const churchName = getStoredChurchName();
  if (template.category === "lyrics") {
    return {
      verse:
        "Amazing grace, how sweet the sound that saved a wretch like me! I once was lost, but now I'm found, was blind, but now I see.",
      reference: "Verse 1",
      version: "Amazing Grace",
      churchName,
      songTitle: "Amazing Grace",
      type: "lyrics",
    };
  }
  if (template.category === "announcement") {
    return {
      verse:
        "Sunday Service — Join us for worship and fellowship at our Church Auditorium",
      reference: "This Sunday",
      version: "10:00 AM",
      churchName,
      songTitle: "",
      type: "announcement",
    };
  }
  return {
    verse:
      "For God so loved the world that he gave his one and only Son, that whoever believeth in him should not perish but have everlasting life.",
    reference: "John 3:16",
    version: "NIV",
    churchName,
    songTitle: "",
    type: "scripture",
  };
}

function makeTextElement(): LowerThirdElement {
  return {
    id: crypto.randomUUID(),
    type: "text",
    name: "Text",
    x: 5,
    y: 70,
    width: 60,
    height: 20,
    rotation: 0,
    text: "New text",
    fontFamily: "Inter, sans-serif",
    fontSize: 48,
    fontSizeMin: 16,
    fontSizeMax: 96,
    fontSizeDynamic: true,
    fontWeight: 700,
    fontStyle: "normal",
    textColor: "#ffffff",
    textAlign: "left",
    lineHeight: 1.3,
    zIndex: 10,
    locked: false,
    visible: true,
    animation: { type: "fadeIn", duration: 400, delay: 0, easing: "ease-out" },
  };
}

function makeShapeElement(): LowerThirdElement {
  return {
    id: crypto.randomUUID(),
    type: "shape",
    name: "Shape",
    x: 0,
    y: 60,
    width: 100,
    height: 40,
    rotation: 0,
    backgroundColor: "rgba(80,40,180,0.85)",
    borderRadius: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    visible: true,
    animation: { type: "slideIn", duration: 400, delay: 0, easing: "ease-out" },
  };
}

function makeImageElement(src: string): LowerThirdElement {
  return {
    id: crypto.randomUUID(),
    type: "image",
    name: "Image",
    x: 5,
    y: 5,
    width: 30,
    height: 25,
    rotation: 0,
    src,
    objectFit: "contain",
    opacity: 1,
    zIndex: 5,
    locked: false,
    visible: true,
    animation: { type: "fadeIn", duration: 400, delay: 0, easing: "ease-out" },
  };
}

// ─── Gradient Builder (Popover) ───────────────────────────────────────────────

const GRADIENT_DIR_OPTIONS = [
  { label: "→ To Right", value: "to right" },
  { label: "← To Left", value: "to left" },
  { label: "↑ To Top", value: "to top" },
  { label: "↓ To Bottom", value: "to bottom" },
  { label: "↗ To Top Right", value: "to top right" },
  { label: "↖ To Top Left", value: "to top left" },
  { label: "↘ To Bottom Right", value: "to bottom right" },
  { label: "↙ To Bottom Left", value: "to bottom left" },
];

type GradientStop = { color: string; opacity: number; position: number };

/** Split a CSS gradient stop list on commas that are NOT inside parentheses. */
function splitGradientParts(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") {
      depth++;
      cur += ch;
    } else if (ch === ")") {
      depth--;
      cur += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function parseGradient(css: string): { dir: string; stops: GradientStop[] } {
  const defaultResult = {
    dir: "to right",
    stops: [
      { color: "#6366f1", opacity: 1, position: 0 },
      { color: "#0f0a20", opacity: 0.9, position: 100 },
    ],
  };
  if (!css) return defaultResult;
  try {
    // Match everything inside linear-gradient( ... )
    const m = css.match(/linear-gradient\(([\s\S]+)\)\s*$/);
    if (!m) return defaultResult;
    // The first top-level comma separates the direction from the stops
    const inner = splitGradientParts(m[1]);
    if (inner.length < 2) return defaultResult;
    const dir = inner[0].trim();
    const parts = inner.slice(1);
    const stops: GradientStop[] = parts.map((p) => {
      const tokens = p.split(/\s+/);
      const posToken = tokens.find((t) => t.endsWith("%"));
      const position = posToken ? parseFloat(posToken) : 0;
      // colorToken may be "rgba(...)" already reassembled or a hex
      const colorToken = tokens.find(
        (t) => t.startsWith("#") || t.startsWith("rgb"),
      );
      let color = "#000000";
      let opacity = 1;
      if (colorToken) {
        if (colorToken.startsWith("rgba")) {
          const nums = colorToken.match(/[\d.]+/g);
          if (nums && nums.length >= 4) {
            const hex = (n: number) => n.toString(16).padStart(2, "0");
            color = `#${hex(+nums[0])}${hex(+nums[1])}${hex(+nums[2])}`;
            opacity = parseFloat(nums[3]);
          }
        } else {
          color = colorToken;
        }
      }
      return { color, opacity, position };
    });
    return { dir, stops: stops.length > 0 ? stops : defaultResult.stops };
  } catch {
    return defaultResult;
  }
}

function buildGradient(dir: string, stops: GradientStop[]): string {
  const parts = stops
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => {
      const r = parseInt(s.color.slice(1, 3), 16);
      const g = parseInt(s.color.slice(3, 5), 16);
      const b = parseInt(s.color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${s.opacity}) ${s.position}%`;
    })
    .join(", ");
  return `linear-gradient(${dir}, ${parts})`;
}

function GradientBuilderPopover({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (css: string | undefined) => void;
}) {
  const parsed = parseGradient(value ?? "");
  const [dir, setDir] = useState(parsed.dir);
  const [stops, setStops] = useState<GradientStop[]>(parsed.stops);

  // Track whether the last `value` change came from our own emit() so we
  // don't re-parse and overwrite local state while the user is dragging a slider.
  const isInternalUpdate = useRef(false);

  // Only sync from the prop when an external source changes the value
  // (e.g. a different element is selected). Skip when we caused the change.
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const p = parseGradient(value ?? "");
    setDir(p.dir);
    setStops(p.stops);
  }, [value]);

  const emit = (newDir: string, newStops: GradientStop[]) => {
    if (newStops.length === 0) {
      onChange(undefined);
      return;
    }
    isInternalUpdate.current = true;
    onChange(buildGradient(newDir, newStops));
  };

  const updateStop = (idx: number, patch: Partial<GradientStop>) => {
    const next = stops.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setStops(next);
    emit(dir, next);
  };

  const changeDir = (d: string) => {
    setDir(d);
    emit(d, stops);
  };

  const addStop = () => {
    const next = [...stops, { color: "#ffffff", opacity: 1, position: 50 }];
    setStops(next);
    emit(dir, next);
  };

  const removeStop = (idx: number) => {
    const next = stops.filter((_, i) => i !== idx);
    setStops(next);
    emit(dir, next);
  };

  const previewCss = stops.length > 0 ? buildGradient(dir, stops) : "#1a0f2e";
  const dirLabel =
    GRADIENT_DIR_OPTIONS.find((o) => o.value === dir)?.label ?? dir;

  return (
    <Popover>
      {/* ── Trigger: compact gradient strip + direction + Edit button ──────── */}
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-2 h-9 rounded-md border border-gray-700/60
                     bg-[#0f0920] hover:border-purple-500/60 px-2 transition-colors group">
          {/* Live gradient preview */}
          <div
            className="flex-1 h-5 rounded"
            style={{ background: previewCss }}
          />
          <span className="text-[10px] text-gray-400 group-hover:text-purple-300 whitespace-nowrap shrink-0">
            {dirLabel}
          </span>
          <span className="text-[10px] text-purple-400 font-medium shrink-0">
            Edit ›
          </span>
        </button>
      </PopoverTrigger>

      {/* ── Popover panel ──────────────────────────────────────────────────── */}
      <PopoverContent
        side="left"
        align="start"
        className="w-[340px] p-4 bg-[#120825] border border-gray-700/70 shadow-2xl"
        sideOffset={8}>
        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Gradient Editor
        </p>

        {/* Full gradient preview */}
        <div
          className="h-8 rounded-md mb-3 border border-gray-700/40"
          style={{ background: previewCss }}
        />

        {/* Direction dropdown */}
        <div className="mb-4">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
            Direction
          </label>
          <Select value={dir} onValueChange={changeDir}>
            <SelectTrigger className="h-8 bg-[#0f0920] border-gray-700 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
              {GRADIENT_DIR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Colour stops */}
        <div className="space-y-3 mb-3">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider">
            Colour Stops
          </label>
          {stops.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-700/50 bg-[#0c0718] p-2.5 space-y-2">
              {/* Row 1: swatch + hex input + remove */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded cursor-pointer border border-gray-700/60 bg-transparent flex-shrink-0"
                  value={s.color}
                  onChange={(e) => updateStop(i, { color: e.target.value })}
                />
                <input
                  type="text"
                  className="flex-1 h-8 bg-[#1a0f2e] border border-gray-700/60 rounded px-2
                             text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  value={s.color}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v))
                      updateStop(i, { color: v });
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeStop(i)}
                  className="text-gray-600 hover:text-red-400 flex-shrink-0 p-1 rounded
                             hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: opacity slider */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-16 shrink-0">
                  Opacity
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1 accent-purple-500 h-1.5 cursor-pointer"
                  value={s.opacity}
                  onChange={(e) =>
                    updateStop(i, { opacity: parseFloat(e.target.value) })
                  }
                />
                <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">
                  {Math.round(s.opacity * 100)}%
                </span>
              </div>

              {/* Row 3: position slider */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-16 shrink-0">
                  Position
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1 accent-purple-500 h-1.5 cursor-pointer"
                  value={s.position}
                  onChange={(e) =>
                    updateStop(i, { position: parseFloat(e.target.value) })
                  }
                />
                <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">
                  {s.position}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Clear actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addStop}
            className="flex-1 h-8 rounded-md bg-[#1a0f2e] border border-gray-700/60
                       text-gray-300 hover:text-white hover:border-purple-500
                       text-xs transition-colors flex items-center justify-center gap-1">
            <Plus className="w-3 h-3" /> Add Stop
          </button>
          {stops.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStops([]);
                onChange(undefined);
              }}
              className="h-8 px-3 rounded-md bg-[#1a0f2e] border border-gray-700/60
                         text-gray-500 hover:text-red-400 hover:border-red-500
                         text-xs transition-colors">
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Element type icons ───────────────────────────────────────────────────────

const BINDING_FIELDS: { value: BindingField; label: string }[] = [
  { value: "verse", label: "Verse (main text)" },
  { value: "reference", label: "Reference (e.g. John 3:16)" },
  { value: "version", label: "Version / Translation (e.g. NIV)" },
  { value: "churchName", label: "Church Name" },
  { value: "songTitle", label: "Song Title" },
];

function BindingSection({
  element,
  onChange,
  inputCls,
}: {
  element: LowerThirdElement;
  onChange: (updates: Partial<LowerThirdElement>) => void;
  inputCls: string;
}) {
  const isComposite = !!(
    element.compositeBinding && element.compositeBinding.length > 0
  );
  const [mode, setMode] = useState<"single" | "composite">(
    isComposite ? "composite" : "single",
  );

  useEffect(() => {
    setMode(
      element.compositeBinding && element.compositeBinding.length > 0
        ? "composite"
        : "single",
    );
  }, [element.id]);

  const handleSingleChange = (field: string) => {
    if (field === "none") {
      onChange({ binding: undefined, compositeBinding: undefined });
    } else {
      onChange({
        binding: {
          field: field as BindingField,
          placeholder: element.binding?.placeholder,
        },
        compositeBinding: undefined,
      });
    }
  };

  const handleAddPart = () => {
    const next: CompositeBindingPart[] = [
      ...(element.compositeBinding ?? []),
      { field: "reference" },
    ];
    onChange({ compositeBinding: next, binding: undefined });
  };

  const handleRemovePart = (idx: number) => {
    const next = (element.compositeBinding ?? []).filter((_, i) => i !== idx);
    onChange({ compositeBinding: next.length > 0 ? next : undefined });
  };

  const handleUpdatePart = (
    idx: number,
    patch: Partial<CompositeBindingPart>,
  ) => {
    const next = (element.compositeBinding ?? []).map((p, i) =>
      i === idx ? { ...p, ...patch } : p,
    );
    onChange({ compositeBinding: next });
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        Data Binding
      </p>
      <div className="flex rounded overflow-hidden border border-gray-700/60">
        {(["single", "composite"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              if (m === "single") onChange({ compositeBinding: undefined });
              else
                onChange({
                  binding: undefined,
                  compositeBinding: [
                    { field: "reference" },
                    { field: "version", prefix: " (", suffix: ")" },
                  ],
                });
            }}
            className={`flex-1 text-[10px] py-1 transition-colors ${
              mode === m
                ? "bg-purple-600 text-white"
                : "bg-[#1a0f2e] text-gray-400 hover:bg-purple-900/40"
            }`}>
            {m === "single" ? "Single field" : "Merge fields"}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <Select
          value={element.binding?.field ?? "none"}
          onValueChange={handleSingleChange}>
          <SelectTrigger className={`${inputCls} w-full`}>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
            <SelectItem value="none">None</SelectItem>
            {BINDING_FIELDS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {mode === "composite" && (
        <div className="space-y-2">
          {(element.compositeBinding ?? []).map((part, idx) => (
            <div
              key={idx}
              className="bg-[#110a1f] border border-gray-700/40 rounded p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <Select
                  value={part.field}
                  onValueChange={(v) =>
                    handleUpdatePart(idx, { field: v as BindingField })
                  }>
                  <SelectTrigger className={`${inputCls} flex-1`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                    {BINDING_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => handleRemovePart(idx)}
                  className="text-gray-600 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <Label className="text-[9px] text-gray-500">Prefix</Label>
                  <Input
                    className={`${inputCls} text-[10px]`}
                    placeholder='e.g. "("'
                    value={part.prefix ?? ""}
                    onChange={(e) =>
                      handleUpdatePart(idx, {
                        prefix: e.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-500">Suffix</Label>
                  <Input
                    className={`${inputCls} text-[10px]`}
                    placeholder='e.g. ")"'
                    value={part.suffix ?? ""}
                    onChange={(e) =>
                      handleUpdatePart(idx, {
                        suffix: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPart}
            className="w-full h-7 rounded bg-[#1a0f2e] border border-gray-700/60 text-gray-400 hover:text-white hover:border-purple-500 transition-colors text-xs">
            + Add field
          </button>
          <p className="text-[9px] text-gray-600 leading-tight">
            Fields joined in order. Use prefix/suffix to add separators (e.g. "
            (" and ")").
          </p>
        </div>
      )}
    </div>
  );
}

function ElementIcon({ type }: { type: string }) {
  if (type === "text") return <Type className="w-3.5 h-3.5 text-purple-400" />;
  if (type === "shape") return <Square className="w-3.5 h-3.5 text-blue-400" />;
  return <ImageIcon className="w-3.5 h-3.5 text-green-400" />;
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertiesPanel({
  element,
  onChange,
}: {
  element: LowerThirdElement;
  onChange: (updates: Partial<LowerThirdElement>) => void;
}) {
  const fieldRow = (label: string, children: React.ReactNode) => (
    <div className="grid grid-cols-2 gap-2 items-center">
      <Label className="text-xs text-gray-400 text-right">{label}</Label>
      <div>{children}</div>
    </div>
  );

  const inputCls =
    "h-8 text-xs bg-[#1a0f2e] border-gray-700/60 text-white focus:border-purple-500";

  return (
    <div className="space-y-3 p-3">
      {/* Position & Size */}
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        Position & Size
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(["x", "y", "width", "height"] as const).map((k) => (
          <div key={k}>
            <Label className="text-[10px] text-gray-500 uppercase">{k}</Label>
            <Input
              type="number"
              className={inputCls}
              value={element[k]}
              onChange={(e) => onChange({ [k]: parseFloat(e.target.value) })}
            />
          </div>
        ))}
      </div>

      {/* Z-index & Opacity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-gray-500 uppercase">Z-Index</Label>
          <Input
            type="number"
            className={inputCls}
            value={element.zIndex}
            onChange={(e) => onChange({ zIndex: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[10px] text-gray-500 uppercase">
            Opacity %
          </Label>
          <Input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={inputCls}
            value={element.opacity ?? 1}
            onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {/* Text properties */}
      {element.type === "text" && (
        <>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pt-1">
            Typography
          </p>
          <div>
            <Label className="text-[10px] text-gray-500 uppercase">Text</Label>
            <textarea
              className="w-full text-xs bg-[#1a0f2e] border border-gray-700/60 text-white rounded p-2 min-h-[56px] focus:outline-none focus:border-purple-500"
              value={element.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
            />
          </div>
          {fieldRow(
            "Font",
            <Input
              className={inputCls}
              value={element.fontFamily ?? ""}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
            />,
          )}
          {fieldRow(
            "Size",
            <Input
              type="number"
              className={inputCls}
              value={element.fontSize ?? 48}
              onChange={(e) =>
                onChange({ fontSize: parseFloat(e.target.value) })
              }
            />,
          )}
          {fieldRow(
            "Weight",
            <Select
              value={String(element.fontWeight ?? 700)}
              onValueChange={(v) => onChange({ fontWeight: parseInt(v) })}>
              <SelectTrigger className={`${inputCls} w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          )}
          {fieldRow(
            "Align",
            <Select
              value={element.textAlign ?? "left"}
              onValueChange={(v) => onChange({ textAlign: v as TextAlign })}>
              <SelectTrigger className={`${inputCls} w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                {["left", "center", "right"].map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          )}
          {fieldRow(
            "Color",
            <input
              type="color"
              className="w-full h-8 rounded cursor-pointer border border-gray-700/60 bg-transparent"
              value={element.textColor ?? "#ffffff"}
              onChange={(e) => onChange({ textColor: e.target.value })}
            />,
          )}
          {/* Binding section */}
          <BindingSection
            element={element}
            onChange={onChange}
            inputCls={inputCls}
          />
        </>
      )}

      {/* Shape properties */}
      {element.type === "shape" && (
        <>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pt-1">
            Appearance
          </p>
          {fieldRow(
            "Fill",
            <input
              type="color"
              className="w-full h-8 rounded cursor-pointer border border-gray-700/60 bg-transparent"
              value={
                element.backgroundColor?.startsWith("rgba")
                  ? "#000000"
                  : (element.backgroundColor ?? "#000000")
              }
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
            />,
          )}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Gradient
            </p>
            <GradientBuilderPopover
              value={element.gradient}
              onChange={(css) => onChange({ gradient: css })}
            />
          </div>
          {fieldRow(
            "Radius",
            <Input
              type="number"
              className={inputCls}
              value={element.borderRadius ?? 0}
              onChange={(e) =>
                onChange({ borderRadius: parseFloat(e.target.value) })
              }
            />,
          )}
          {fieldRow(
            "Blur bg",
            <Input
              className={inputCls}
              placeholder="e.g. blur(8px)"
              value={element.backdropFilter ?? ""}
              onChange={(e) =>
                onChange({ backdropFilter: e.target.value || undefined })
              }
            />,
          )}
        </>
      )}

      {/* Image properties */}
      {element.type === "image" && (
        <>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pt-1">
            Image
          </p>
          {fieldRow(
            "Src URL",
            <Input
              className={inputCls}
              value={element.src ?? ""}
              onChange={(e) => onChange({ src: e.target.value })}
            />,
          )}
          {fieldRow(
            "Fit",
            <Select
              value={element.objectFit ?? "cover"}
              onValueChange={(v) => onChange({ objectFit: v as ObjectFit })}>
              <SelectTrigger className={`${inputCls} w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
                {["cover", "contain", "fill"].map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          )}
          {fieldRow(
            "Radius",
            <Input
              type="number"
              className={inputCls}
              value={element.borderRadius ?? 0}
              onChange={(e) =>
                onChange({ borderRadius: parseFloat(e.target.value) })
              }
            />,
          )}
        </>
      )}

      {/* Animation */}
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pt-1">
        Animation
      </p>
      {fieldRow(
        "Type",
        <Select
          value={element.animation?.type ?? "none"}
          onValueChange={(v) =>
            onChange({
              animation: {
                ...(element.animation ?? {
                  duration: 400,
                  delay: 0,
                  easing: "ease-out",
                }),
                type: v as AnimationType,
              },
            })
          }>
          <SelectTrigger className={`${inputCls} w-full`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a0f2e] border-gray-700 text-white">
            {["none", "fadeIn", "slideIn", "scaleIn", "rotateIn"].map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}
      {element.animation?.type !== "none" && (
        <>
          {fieldRow(
            "Duration",
            <Input
              type="number"
              className={inputCls}
              value={element.animation?.duration ?? 400}
              onChange={(e) =>
                onChange({
                  animation: {
                    ...element.animation!,
                    duration: parseInt(e.target.value),
                  },
                })
              }
            />,
          )}
          {fieldRow(
            "Delay",
            <Input
              type="number"
              className={inputCls}
              value={element.animation?.delay ?? 0}
              onChange={(e) =>
                onChange({
                  animation: {
                    ...element.animation!,
                    delay: parseInt(e.target.value),
                  },
                })
              }
            />,
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function LowerThirdEditorPage() {
  const params = useParams<{ templateId: string }>();
  const [, navigate] = useLocation();
  const authUser = useAuthStore((s) => s.user);

  const { getAllTemplates, updateCustomTemplate, addCustomTemplate, duplicateTemplate } =
    useLowerThirdStore();

  // ── Load template from store ───────────────────────────────────────────────
  const [template, setTemplate] = useState<LowerThirdTemplate | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef("");

  useEffect(() => {
    const all = getAllTemplates();
    const found = all.find((t) => t.id === params.templateId) ?? null;
    if (found) {
      const cloned = JSON.parse(JSON.stringify(found)) as LowerThirdTemplate;
      lastSavedSnapshotRef.current = JSON.stringify(cloned);
      setTemplate(cloned);
    }
  }, [getAllTemplates, params.templateId]);

  // ── Element helpers ────────────────────────────────────────────────────────
  const updateElement = useCallback(
    (id: string, updates: Partial<LowerThirdElement>) => {
      setTemplate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el,
          ),
        };
      });
    },
    [],
  );

  const addElement = (el: LowerThirdElement) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      // Place new element on top of all existing layers
      const maxZ = prev.elements.reduce((m, e) => Math.max(m, e.zIndex ?? 0), 0);
      const withZ = { ...el, zIndex: maxZ + 10 };
      return { ...prev, elements: [...prev.elements, withZ] };
    });
    setSelectedElementId(el.id);
  };

  const deleteElement = (id: string) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, elements: prev.elements.filter((el) => el.id !== id) };
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const moveElement = (id: string, dir: "up" | "down") => {
    setTemplate((prev) => {
      if (!prev) return prev;
      // Sort a copy by zIndex descending (top of list = visually on top)
      const sorted = [...prev.elements].sort((a, b) => b.zIndex - a.zIndex);
      const idx = sorted.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      // "up" moves toward the front of the sorted list (higher zIndex = on top)
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      // Swap only the zIndex values; leave everything else intact
      const aZ = sorted[idx].zIndex;
      const bZ = sorted[swapIdx].zIndex;
      // If both share the same zIndex, force a gap so the swap is visible:
      const newAZ = aZ === bZ ? bZ + 1 : bZ;
      const newBZ = aZ === bZ ? bZ     : aZ;
      return {
        ...prev,
        elements: prev.elements.map((el) => {
          if (el.id === sorted[idx].id)    return { ...el, zIndex: newAZ };
          if (el.id === sorted[swapIdx].id) return { ...el, zIndex: newBZ };
          return el;
        }),
      };
    });
  };

  // ── Image upload ───────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const b64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/lower-third/upload-asset", {
          method: "POST",
          credentials: "include",
          headers: getEditorAuthHeaders(),
          body: JSON.stringify({
            fileBase64: b64,
            mimeType: file.type,
            filename: file.name,
          }),
        });
        if (res.ok) {
          const { assetUrl } = await res.json();
          addElement(makeImageElement(assetUrl));
        }
        setUploading(false);
      };
    } catch {
      setUploading(false);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const persistTemplate = useCallback(
    async (draft: LowerThirdTemplate) => {
      if (!authUser?.id) return;
      setSaving(true);
      try {
        let saveTarget = { ...draft, updatedAt: new Date().toISOString() };

        // If editing a default template, auto-duplicate to a custom template first.
        if (saveTarget.isDefault) {
          const newId = `custom-${Date.now()}`;
          saveTarget = {
            ...saveTarget,
            id: newId,
            name: `${saveTarget.name} (Custom)`,
            isDefault: false,
            isCustom: true,
            createdAt: new Date().toISOString(),
            createdBy: "user",
          };
          await addCustomTemplate(saveTarget);
          setTemplate(saveTarget);
          navigate(`/lower-third-editor/${newId}`, { replace: true });
        } else {
          await updateCustomTemplate(saveTarget);
        }

        let finalTarget = saveTarget;

        try {
          const snapRes = await fetch("/api/lower-third/snapshot", {
            method: "POST",
            credentials: "include",
            headers: getEditorAuthHeaders(),
            body: JSON.stringify({
              template: saveTarget,
              bindingData: getPlaceholderData(saveTarget),
              templateId: saveTarget.id,
            }),
          });
          if (snapRes.ok) {
            const { thumbnailUrl } = await snapRes.json();
            finalTarget = { ...saveTarget, thumbnail: thumbnailUrl };
            await updateCustomTemplate(finalTarget);
            setTemplate((prev) => (prev ? { ...prev, thumbnail: thumbnailUrl } : prev));
          }
        } catch {
          // Snapshot is optional — don't fail the save.
        }

        lastSavedSnapshotRef.current = JSON.stringify(finalTarget);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3000);
      } finally {
        setSaving(false);
      }
    },
    [addCustomTemplate, authUser?.id, navigate, updateCustomTemplate],
  );

  const handleSave = async () => {
    if (!template || !authUser?.id) return;
    await persistTemplate(template);
  };

  useEffect(() => {
    if (!template || !authUser?.id) return;
    const nextSnapshot = JSON.stringify(template);
    if (nextSnapshot === lastSavedSnapshotRef.current) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void persistTemplate(template);
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [authUser?.id, persistTemplate, template]);

  // ── Selected element ───────────────────────────────────────────────────────
  const selectedElement =
    template?.elements.find((el) => el.id === selectedElementId) ?? null;

  if (!template) {
    return (
      <div className="min-h-screen bg-[#0f0920] flex items-center justify-center">
        <p className="text-gray-400">Template not found</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen bg-[#0f0920] overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-4 px-6 py-3 bg-[#0c0718] border-b border-gray-700/40 flex-shrink-0">
        <button
          onClick={() => navigate("/lower-third-settings")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex-1 min-w-0">
          <input
            className="bg-transparent text-white font-semibold text-lg focus:outline-none focus:border-b focus:border-purple-500 w-full truncate"
            value={template.name}
            onChange={(e) =>
              setTemplate((prev) =>
                prev ? { ...prev, name: e.target.value } : prev,
              )
            }
          />
        </div>

        {/* Add element buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => addElement(makeTextElement())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-sm transition-colors border border-purple-500/30">
            <Plus className="w-3.5 h-3.5" />
            <Type className="w-3.5 h-3.5" />
            Text
          </button>
          <button
            onClick={() => addElement(makeShapeElement())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-sm transition-colors border border-blue-500/30">
            <Plus className="w-3.5 h-3.5" />
            <Square className="w-3.5 h-3.5" />
            Shape
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-300 text-sm transition-colors border border-green-500/30 cursor-pointer">
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <Upload className="w-3.5 h-3.5" />
            Image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 text-sm ${
            saved
              ? "bg-green-600 hover:bg-green-600"
              : "bg-purple-600 hover:bg-purple-500"
          }`}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </Button>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: element list */}
        <aside className="w-52 flex-shrink-0 bg-[#0a0614] border-r border-gray-700/40 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 pt-4 pb-2">
            Elements
          </p>
          {template.elements.length === 0 && (
            <p className="text-xs text-gray-600 px-4">
              No elements yet. Add one above.
            </p>
          )}
          {[...template.elements]
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((el) => (
              <div
                key={el.id}
                onClick={() => setSelectedElementId(el.id)}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer group transition-colors ${
                  selectedElementId === el.id
                    ? "bg-purple-600/20 border-l-2 border-purple-500"
                    : "hover:bg-gray-800/40 border-l-2 border-transparent"
                }`}>
                <ElementIcon type={el.type} />
                <span className="flex-1 text-xs text-gray-300 truncate">
                  {el.name}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateElement(el.id, { visible: !el.visible });
                    }}
                    className="p-0.5 text-gray-500 hover:text-white">
                    {el.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveElement(el.id, "up");
                    }}
                    className="p-0.5 text-gray-500 hover:text-white">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveElement(el.id, "down");
                    }}
                    className="p-0.5 text-gray-500 hover:text-white">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(el.id);
                    }}
                    className="p-0.5 text-red-500 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
        </aside>

        {/* Centre: live inline preview */}
        <main className="flex-1 flex flex-col bg-[#1a1030] overflow-hidden">
          <p className="text-xs text-gray-500 text-center py-2 flex-shrink-0">
            Live Preview — updates every edit
          </p>

          {/* 16:9 canvas — renderer fills it exactly like the old iframe did */}
          <div className="relative w-full flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <div
              className="absolute inset-0"
              style={{ backgroundColor: template.backgroundColor || "#000000" }}
            >
              <LowerThirdRenderer
                template={template}
                data={getPlaceholderData(template)}
                isVisible={true}
                isPreview={true}
              />
            </div>
          </div>

          {/* Background color + name strip */}
          <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0 border-t border-gray-700/30">
            <label className="text-xs text-gray-500">Canvas bg</label>
            <input
              type="color"
              className="h-7 w-16 rounded cursor-pointer border border-gray-700/60 bg-transparent"
              value={template.backgroundColor || "#000000"}
              onChange={(e) =>
                setTemplate((prev) =>
                  prev ? { ...prev, backgroundColor: e.target.value } : prev,
                )
              }
            />
            <label className="text-xs text-gray-500">Name</label>
            <Input
              className="h-7 text-xs bg-[#1a0f2e] border-gray-700/60 text-white w-48"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev,
                )
              }
            />
          </div>
        </main>


        {/* Right: properties panel */}
        <aside className="w-64 flex-shrink-0 bg-[#0a0614] border-l border-gray-700/40 overflow-y-auto">
          {selectedElement ? (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {selectedElement.name} Properties
              </p>
              <PropertiesPanel
                key={selectedElement.id}
                element={selectedElement}
                onChange={(updates) =>
                  updateElement(selectedElement.id, updates)
                }
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 text-xs text-center px-4">
              <Square className="w-8 h-8 mb-2 opacity-20" />
              Select an element to edit its properties
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
