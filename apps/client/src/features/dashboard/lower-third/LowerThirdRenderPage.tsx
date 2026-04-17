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

// Stamp class BEFORE first paint – eliminates purple gradient flash
if (typeof document !== "undefined") {
  document.documentElement.classList.add("lower-third-render");
}

import { useEffect, useMemo, useRef, useState } from "react";
import { LowerThirdRenderer } from "@/features/lowerThird/LowerThirdRenderer";
import { DEFAULT_TEMPLATES } from "@/features/lowerThird/defaultTemplates";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import type { LowerThirdBindingData } from "@/features/lowerThird/types";

const CHANNEL_NAME = "qworship-lower-third-sync";

// OBS user-agent contains "OBS"
const IS_OBS =
  typeof navigator !== "undefined" && /OBS/i.test(navigator.userAgent);

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

  const [syncState, setSyncState] = useState<SyncState>({
    enabled: true,
    isVisible: false,
    templateId: "glass-scripture",
    activeData: null,
  });

  // Debug counters — visible in browser, hidden in OBS
  const [sseStatus, setSseStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [msgCount, setMsgCount] = useState(0);

  const sseRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Transparent body ─────────────────────────────────────────────────────
  useEffect(() => {
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

  // ── BroadcastChannel – same-browser tabs ─────────────────────────────────
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = (ev) => {
        const { type, payload } = ev.data ?? {};
        if (type !== "LOWER_THIRD_UPDATE") return;
        setMsgCount((n) => n + 1);
        setSyncState((prev) => ({
          enabled: payload.enabled ?? prev.enabled,
          isVisible: payload.isVisible ?? prev.isVisible,
          templateId: payload.selectedTemplateId ?? prev.templateId,
          activeData:
            payload.activeData !== undefined
              ? payload.activeData
              : prev.activeData,
        }));
      };
    } catch {}
    return () => {
      ch?.close();
    };
  }, []);

  // ── Electron Native IPC – cross-window without cloud ──────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && window.api && window.api.live) {
      console.log("Subscribing to native Electron IPC for projection updates...");
      const unsubscribe = window.api.live.onMessage((msg: any) => {
        if (msg.type === "LOWER_THIRD_SYNC") {
          const d = msg.body;
          setMsgCount((n) => n + 1);
          setSyncState((prev) => ({
            enabled: d.enabled ?? prev.enabled,
            isVisible: d.isVisible ?? prev.isVisible,
            templateId: d.template?.id ?? prev.templateId,
            activeData: "bindingData" in d ? d.bindingData : prev.activeData,
          }));
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // ── SSE – OBS browser source ─────────────────────────────────────────────
  useEffect(() => {
    function connect() {
      const uid = new URLSearchParams(window.location.search).get("uid");
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
        } catch {}
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
  }, []);

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
      {/* ── Debug status badge (hidden in OBS) ─────────────────────────── */}
      {!IS_OBS && (
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
                      : "#facc15",
              }}>
              {sseStatus}
            </span>{" "}
            | msgs: {msgCount}
          </div>
          <div>
            uid:{" "}
            {new URLSearchParams(window.location.search).get("uid") ?? "(none)"}
          </div>
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
