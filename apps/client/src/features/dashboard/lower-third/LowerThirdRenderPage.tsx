/**
 * LowerThirdRenderPage  –  /lower-third-render
 *
 * Transparent overlay for OBS browser source.
 * State is kept in sync via:
 *   1. BroadcastChannel  – same-browser dashboard tab → this tab
 *   2. Server-Sent Events – OBS browser source (isolated Chromium process)
 *
 * OBS setup:
 *   • Browser Source → URL = <app-url>/lower-third-render?uid=<your-id>
 *   • Resolution: 1920×1080  •  ✅ Allow Transparency
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LowerThirdRenderer } from "@/features/lowerThird/LowerThirdRenderer";
import { DEFAULT_TEMPLATES } from "@/features/lowerThird/defaultTemplates";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import type { LowerThirdBindingData } from "@/features/lowerThird/types";

const CHANNEL_NAME = "qworship-lower-third-sync";

// OBS user-agent contains "OBS"
const IS_OBS =
  typeof navigator !== "undefined" && /OBS/i.test(navigator.userAgent);
const IS_ELECTRON =
  typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);
const HIDE_DEBUG = IS_OBS || IS_ELECTRON;

function getUidFromLocation() {
  if (typeof window === "undefined") return null;

  const directUid = new URLSearchParams(window.location.search).get("uid");
  if (directUid) return directUid;

  const hash = window.location.hash || "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return null;

  return new URLSearchParams(hash.slice(queryIndex + 1)).get("uid");
}

interface SyncState {
  enabled: boolean;
  isVisible: boolean;
  templateId: string;
  activeData: LowerThirdBindingData | null;
}

export default function LowerThirdRenderPage() {
  const customTemplates = useLowerThirdStore((s) => s.customTemplates);
  const allTemplates = useMemo(
    () => [...DEFAULT_TEMPLATES, ...customTemplates],
    [customTemplates],
  );
  const uid = useMemo(() => getUidFromLocation(), []);
  const canUseSse =
    typeof window !== "undefined" && /^https?:$/i.test(window.location.protocol);

  const [syncState, setSyncState] = useState<SyncState>({
    enabled: true,
    isVisible: false,
    templateId: "glass-scripture",
    activeData: null,
  });

  // Debug counters — visible in browser, hidden in OBS/Electron
  const [sseStatus, setSseStatus] = useState<
    "disabled" | "connecting" | "connected" | "error"
  >(canUseSse ? "connecting" : "disabled");
  const [msgCount, setMsgCount] = useState(0);

  const sseRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Transparent body ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    document.documentElement.classList.add("lower-third-render");
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.classList.remove("lower-third-render");
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflow = "";
    };
  }, []);

  // ── Shared sync apply helper ─────────────────────────────────────────────
  const applySyncPayload = (payload: Partial<{
    enabled: boolean;
    isVisible: boolean;
    selectedTemplateId: string;
    templateId: string;
    activeData: LowerThirdBindingData | null;
  }>) => {
    setMsgCount((n) => n + 1);
    setSyncState((prev) => ({
      enabled: payload.enabled ?? prev.enabled,
      isVisible: payload.isVisible ?? prev.isVisible,
      templateId:
        payload.selectedTemplateId ?? payload.templateId ?? prev.templateId,
      activeData:
        payload.activeData !== undefined ? payload.activeData : prev.activeData,
    }));
  };

  // ── BroadcastChannel – same-browser tabs / Electron windows ─────────────
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = (ev) => {
        const { type, payload } = ev.data ?? {};
        if (type !== "LOWER_THIRD_UPDATE") return;
        applySyncPayload(payload ?? {});
      };
    } catch (error) {
      console.warn(
        "[LowerThirdRenderPage] Failed to initialize broadcast sync",
        error,
      );
    }
    return () => {
      ch?.close();
    };
  }, []);

  // ── Electron IPC – packaged desktop hidden NDI window ───────────────────
  useEffect(() => {
    const liveApi = (window as any).api?.live;
    if (!liveApi?.onMessage) return;

    return liveApi.onMessage((payload: any) => {
      if (payload?.type !== "LOWER_THIRD_UPDATE") return;
      applySyncPayload(payload.payload ?? {});
    });
  }, []);

  // ── SSE – OBS browser source / remote HTTP contexts ─────────────────────
  useEffect(() => {
    if (!canUseSse) {
      setSseStatus("disabled");
      return;
    }

    function connect() {
      setSseStatus("connecting");
      const url = uid
        ? `/api/lower-third/stream?uid=${uid}`
        : "/api/lower-third/stream";

      const es = new EventSource(url);
      sseRef.current = es;

      es.onopen = () => setSseStatus("connected");

      es.onmessage = (ev) => {
        setSseStatus("connected");
        setMsgCount((n) => n + 1);
        try {
          const d = JSON.parse(ev.data);
          // Server sends: { uid, enabled, isVisible, templateId, activeData }
          setSyncState((prev) => ({
            enabled: d.enabled ?? prev.enabled,
            isVisible: d.isVisible ?? prev.isVisible,
            templateId: d.templateId ?? prev.templateId,
            activeData: "activeData" in d ? d.activeData : prev.activeData,
          }));
        } catch (error) {
          console.warn(
            "[LowerThirdRenderPage] Failed to parse SSE payload",
            error,
          );
        }
      };

      es.onerror = () => {
        setSseStatus("error");
        es.close();
        sseRef.current = null;
        retryRef.current = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      sseRef.current?.close();
    };
  }, [canUseSse, uid]);

  // ── Render ────────────────────────────────────────────────────────────────
  const template =
    allTemplates.find((t) => t.id === syncState.templateId) ?? allTemplates[0];
  const isActive =
    syncState.enabled && syncState.isVisible && syncState.activeData != null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "transparent",
        overflow: "hidden",
      }}>
      {/* ── Debug status badge (hidden in OBS/Electron) ───────────────── */}
      {!HIDE_DEBUG && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 999,
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: 11,
            padding: "8px 12px",
            borderRadius: 6,
            lineHeight: 1.6,
            maxWidth: 360,
            wordBreak: "break-all",
          }}>
          <div>
            SSE:{" "}
            <span
              style={{
                color:
                  sseStatus === "connected"
                    ? "#4ade80"
                    : sseStatus === "error"
                      ? "#f87171"
                      : sseStatus === "disabled"
                        ? "#94a3b8"
                        : "#facc15",
              }}>
              {sseStatus}
            </span>{" "}
            | msgs: {msgCount}
          </div>
          <div>uid: {uid ?? "(none)"}</div>
          <div>
            enabled: {String(syncState.enabled)} | visible:{" "}
            {String(syncState.isVisible)}
          </div>
          <div>template: {syncState.templateId}</div>
          <div>
            activeData:{" "}
            {syncState.activeData
              ? `"${syncState.activeData.reference}"`
              : "null"}
          </div>
          <div>
            isActive:{" "}
            <span style={{ color: isActive ? "#4ade80" : "#f87171" }}>
              {String(isActive)}
            </span>
          </div>
        </div>
      )}

      {/* ── Transparent lower-third canvas ────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          background: "transparent",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 10,
        }}>
        {template && isActive && (
          <LowerThirdRenderer
            template={template}
            data={syncState.activeData!}
            isVisible={true}
            isPreview={false}
          />
        )}
      </div>
    </div>
  );
}
