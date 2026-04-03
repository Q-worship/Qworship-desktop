/**
 * LowerThirdDemoPage  –  /lower-third-demo
 *
 * Transparent OBS-ready page that cycles through demo content:
 *   - John 3:16 (NIV)
 *   - Romans 8:28 (KJV)
 *   - A worship song lyric
 *
 * Each item stays visible for 5 seconds, then the next fades in.
 * Use this route to confirm OBS transparency and lower-third rendering
 * without needing to use the dashboard.
 *
 * OBS setup:
 *   • Browser Source → URL = <app-url>/lower-third-demo
 *   • Resolution: 1920×1080
 *   • ✅ Allow Transparency
 */

// Stamp class before first paint – eliminates purple gradient flash
if (typeof document !== "undefined") {
  document.documentElement.classList.add("lower-third-render");
}

import { useEffect, useMemo, useRef, useState } from "react";
import { LowerThirdRenderer } from "@/features/lowerThird/LowerThirdRenderer";
import { DEFAULT_TEMPLATES } from "@/features/lowerThird/defaultTemplates";
import type { LowerThirdBindingData } from "@/features/lowerThird/types";

const DEMO_ITEMS: Array<{ data: LowerThirdBindingData; templateId: string }> = [
  {
    templateId: "glass-scripture",
    data: {
      verse:
        "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16",
      version: "NIV",
      churchName: "",
    },
  },
  {
    templateId: "classic-solid",
    data: {
      verse:
        "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      reference: "Romans 8:28",
      version: "KJV",
      churchName: "",
    },
  },
  {
    templateId: "minimal-line",
    data: {
      verse:
        "Holy, holy, holy is the Lord God Almighty, who was, and is, and is to come.",
      reference: "Revelation 4:8",
      version: "WORSHIP",
      churchName: "Our Church",
    },
  },
];

const DISPLAY_DURATION_MS = 5000;
const TRANSITION_MS = 600;

export default function LowerThirdDemoPage() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTemplates = useMemo(() => DEFAULT_TEMPLATES, []);

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

  // ── Rotation logic ────────────────────────────────────────────────────────
  useEffect(() => {
    function schedule() {
      timerRef.current = setTimeout(() => {
        // Fade out
        setVisible(false);
        setTimeout(() => {
          setIndex((prev) => (prev + 1) % DEMO_ITEMS.length);
          setVisible(true);
          schedule();
        }, TRANSITION_MS);
      }, DISPLAY_DURATION_MS);
    }

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const current = DEMO_ITEMS[index];
  const template =
    allTemplates.find((t) => t.id === current.templateId) ?? allTemplates[0];

  return (
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
        opacity: visible ? 1 : 0,
        transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
      }}>
      {template && (
        <LowerThirdRenderer
          template={template}
          data={current.data}
          isVisible={visible}
          isPreview={false}
        />
      )}
    </div>
  );
}
