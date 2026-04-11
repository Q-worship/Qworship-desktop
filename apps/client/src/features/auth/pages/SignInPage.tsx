import { LogIn } from "lucide-react";
import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/features/auth/auth.store";

const signinHero = new URL("../../../assets/splash/signin-hero.png", import.meta.url).href;

const QworshipLogo = () => (
  <div style={{ position: "relative", width: 52, height: 52 }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid #e94d8a" }} />
    <div style={{ position: "absolute", bottom: 1, right: 1, width: 13, height: 13, borderRadius: "50%", background: "#e94d8a" }} />
  </div>
);

export default function SignIn() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/project-selection");
    }
  }, [isAuthenticated, setLocation]);

  const handleDesktopAuth = () => {
    if (window.api && window.api.openWebAuth) {
      window.api.openWebAuth("https://app.qworship.com/desktop-auth");
    } else {
      window.open("https://app.qworship.com/desktop-auth", "_blank");
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{
          flex: "0 0 44%",
          background: "linear-gradient(160deg, #252044 0%, #1e1a3a 60%, #1a1530 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 52px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Subtle glow top-left */}
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(109,40,217,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />

        <h2 style={{ color: "#a78bfa", fontWeight: 700, fontSize: "1.9rem", marginBottom: 14, letterSpacing: "-0.01em" }}>
          Login
        </h2>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", lineHeight: 1.65, marginBottom: 44, maxWidth: 340 }}>
          Thank you for downloading Q-worship. Sign in securely via your browser — one click and you're in.
        </p>

        {/* IPC status */}
        {typeof window !== "undefined" && !window.api && (
          <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 20, fontSize: "0.72rem", color: "#f87171", fontFamily: "monospace" }}>
            IPC bridge missing — running outside Electron
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleDesktopAuth}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "14px 28px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            width: "100%",
            maxWidth: 340,
            boxShadow: "0 6px 28px rgba(109,40,217,0.45)",
            transition: "transform 0.15s, opacity 0.15s",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.92"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}
        >
          <LogIn size={18} />
          Sign In with Browser
        </button>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginTop: 16, maxWidth: 340 }}>
          Your browser will return you here automatically once authenticated.
        </p>


      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 100%)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "40px 32px 0",
        }}
      >
        {/* Radial glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Logo + tagline */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginBottom: 32 }}>
          <QworshipLogo />
          <h1
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              textAlign: "center",
              maxWidth: 340,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            Changing the way you deliver worship
          </h1>
        </div>

        {/* Hero image — centered */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px 48px",
          }}
        >
          <img
            src={signinHero}
            alt="Hands-free Bible in action with live worship"
            loading="lazy"
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "calc(100vh - 280px)",
              objectFit: "contain",
              display: "block",
              borderRadius: 12,
              filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.45))",
            }}
          />
        </div>

        {/* Bottom dots */}
        <div style={{ position: "absolute", bottom: 28, display: "flex", gap: 8, zIndex: 3 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? 22 : 8,
                height: 8,
                borderRadius: 10,
                background: i === 0 ? "#e94d8a" : "rgba(255,255,255,0.35)",
                transition: "width 0.3s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
