import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/features/auth/auth.store";
import qworshipLogo from "@assets/Group 1_1754122708985.png";

// Lazy-loaded splash images (Vite resolves to hashed URLs)
const enhanceImg = new URL("../../../assets/splash/Sermon-Record.png", import.meta.url).href;
const hfbImg = new URL("../../../assets/splash/hands-free-bible.png", import.meta.url).href;
const songbookImg = new URL("../../../assets/splash/song-book.png", import.meta.url).href;
const slidesImg = new URL("../../../assets/splash/slides.png", import.meta.url).href;
const mediaImg = new URL("../../../assets/splash/media.png", import.meta.url).href;

interface SlideConfig {
  id: string;
  tag: string;
  tagGradient: string;
  description: string;
  features: string[];
  image: string;
  imageAlt: string;
}

const SLIDES: SlideConfig[] = [
  {
    id: "enhance",
    tag: "ENHANCE",
    tagGradient: "#a78bfa, #8b5cf6",
    description: "Transform your church experience with one complete presentation system.",
    features: [
      "Hands-free Bible search and instant scripture projection",
      "Seamless song, media, and sermon presentation control",
      "Built for live worship, clarity, and effortless service flow",
    ],
    image: enhanceImg,
    imageAlt: "Qworship service builder and live presentation interface",
  },
  {
    id: "hfb",
    tag: "HANDS-FREE BIBLE",
    tagGradient: "#c084fc, #8b5cf6",
    description: "Experience effortless scripture access with voice-powered Bible presentation.",
    features: [
      "Search and project Bible verses instantly using simple voice commands",
      "Access 6+ Bible versions with fast, natural language navigation",
      "Keep services flowing smoothly with hands-free control and real-time display",
    ],
    image: hfbImg,
    imageAlt: "Hands-Free Bible companion showing Romans 8:15",
  },
  {
    id: "songbook",
    tag: "SONGBOOK",
    tagGradient: "#e879f9, #a855f7",
    description: "Organize, manage, and present worship songs with speed and simplicity.",
    features: [
      "Build and access your song library for every service and event",
      "Present lyrics clearly with smooth section-by-section navigation",
      "Keep worship flowing with fast song search, editing, and live display control",
    ],
    image: songbookImg,
    imageAlt: "Qworship songbook management interface",
  },
  {
    id: "slides",
    tag: "SLIDES",
    tagGradient: "#a78bfa, #6366f1",
    description: "Present scriptures, lyrics, and media with clarity on every screen.",
    features: [
      "Display Bible verses, song lyrics, and presentation content in real time",
      "Create smooth, readable visuals for worship services and live events",
      "Keep your congregation engaged with clean slides and effortless control",
    ],
    image: slidesImg,
    imageAlt: "Qworship slides main stage display",
  },
  {
    id: "media",
    tag: "MEDIA",
    tagGradient: "#f472b6, #a855f7",
    description: "Present scriptures, lyrics, and media with clarity on every screen.",
    features: [
      "Import and display images, videos, and custom media overlays",
      "Control your full service flow from a single live control console",
      "Deliver polished, professional presentations every service",
    ],
    image: mediaImg,
    imageAlt: "Qworship media and slides presentation mode",
  },
];

// ── Sub-components ──────────────────────────────────────────────────────────


const CheckItem = ({ text }: { text: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
    <div
      style={{
        flexShrink: 0,
        marginTop: 2,
        width: 16,
        height: 16,
        borderRadius: 3,
        background: "rgba(233,77,138,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path
          d="M1 4L3.5 6.5L9 1"
          stroke="#e94d8a"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", lineHeight: 1.55 }}>
      {text}
    </span>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

export const SplashScreen = () => {
  const [, setLocation] = useLocation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"right" | "left">("right");
  const [animating, setAnimating] = useState(false);

  // Automatically bypass splash screen if the user is already authenticated
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation("/live-console");
    }
  }, [isAuthenticated, setLocation]);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const navigate = useCallback(
    (next: number) => {
      if (animating || next === current || next < 0 || next >= SLIDES.length) return;
      setDirection(next > current ? "right" : "left");
      setAnimating(true);
      setTimeout(() => {
        setCurrent(next);
        setAnimating(false);
      }, 300);
    },
    [animating, current]
  );

  const handleNext = () => {
    if (isLast) setLocation("/login");
    else navigate(current + 1);
  };

  const contentStyle: React.CSSProperties = {
    transition: "opacity 0.3s ease, transform 0.3s ease",
    opacity: animating ? 0 : 1,
    transform: animating
      ? `translateX(${direction === "right" ? "-20px" : "20px"})`
      : "translateX(0)",
  };

  const imageStyle: React.CSSProperties = {
    transition: "opacity 0.3s ease, transform 0.3s ease",
    opacity: animating ? 0 : 1,
    transform: animating
      ? `translateX(${direction === "right" ? "20px" : "-20px"})`
      : "translateX(0)",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(160deg, #0e0720 0%, #1a0832 40%, #0a0416 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      {/* Top purple gradient wash */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45%",
          background: "linear-gradient(180deg, rgba(100,30,180,0.55) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient centre glow */}
      <div
        style={{
          position: "absolute",
          top: "-5%",
          left: "25%",
          width: "50%",
          height: "50%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(130,50,220,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Layout ── */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 28,
            paddingBottom: 12,
          }}
        >
          <img src={qworshipLogo} alt="Q-worship" style={{ width: 44, height: 'auto', objectFit: "contain" }} />
          <h1
            style={{
              color: "#d8b4fe",
              fontWeight: 700,
              fontSize: "1.3rem",
              marginTop: 10,
              marginBottom: 2,
              letterSpacing: "-0.01em",
            }}
          >
            Welcome to Q-worship
          </h1>
          <p style={{ color: "rgba(216,180,254,0.55)", fontSize: "0.82rem", margin: 0 }}>
            Thank you for Downloading, Let's get you started!
          </p>
        </div>

        {/* Body — text left, image right */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            gap: 32,
            padding: "8px 40px 0",
            overflow: "hidden",
          }}
        >
          {/* Left panel */}
          <div style={{ flex: "0 0 38%", paddingTop: 20, ...contentStyle }}>
            <h2
              style={{
                color: "#a855f7",
                fontWeight: 900,
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                lineHeight: 1.05,
                marginBottom: 14,
                letterSpacing: "-0.01em",
              }}
            >
              {slide.tag}
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: 20,
                maxWidth: 320,
              }}
            >
              {slide.description}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {slide.features.map((feat) => (
                <CheckItem key={feat} text={feat} />
              ))}
            </div>

            {/* Nav row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 36,
              }}
            >
              <button
                onClick={handleNext}
                style={{
                  background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  padding: "9px 28px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(109,40,217,0.4)",
                  transition: "transform 0.15s, opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.opacity = "0.92";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {isLast ? "Get Started" : "Next"}
              </button>

              {/* Pill dots */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(idx)}
                    style={{
                      width: idx === current ? 22 : 7,
                      height: 7,
                      borderRadius: 10,
                      background:
                        idx === current
                          ? "linear-gradient(90deg, #7c3aed, #a855f7)"
                          : "rgba(255,255,255,0.22)",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right panel — image */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              height: "100%",
              overflow: "hidden",
              position: "relative",
              ...imageStyle,
            }}
          >
            {SLIDES.map((s, idx) => (
              <img
                key={s.id}
                src={s.image}
                alt={s.imageAlt}
                loading={idx === 0 ? "eager" : "lazy"}
                style={{
                  position: "absolute",
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 210px)",
                  objectFit: "contain",
                  objectPosition: "bottom center",
                  borderRadius: "10px 10px 0 0",
                  filter: "drop-shadow(0 -12px 40px rgba(109,40,217,0.3))",
                  transition: "opacity 0.4s ease",
                  opacity: idx === current ? 1 : 0,
                  pointerEvents: idx === current ? "auto" : "none",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
