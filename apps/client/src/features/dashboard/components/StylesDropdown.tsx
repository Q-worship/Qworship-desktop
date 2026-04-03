import React from "react";

interface StylesDropdownProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onApplyStyle: (
    type: "style" | "fontName" | "fontSize" | "color" | "textAlign",
    value: string,
  ) => void;
  onClose: () => void;
}

export function StylesDropdown({
  isOpen,
  position,
  onApplyStyle,
  onClose,
}: StylesDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed bg-gradient-to-b from-[#2a1f3d] to-[#1a0f2e] border border-[#8356F3]/30 rounded-lg shadow-2xl z-[9999] w-[220px] styles-dropdown backdrop-blur-sm"
      style={{
        top: position.top,
        left: position.left,
        boxShadow: "0 25px 50px -12px rgba(131, 86, 243, 0.3)",
      }}>
      <div className="p-2">
        <div className="text-white text-sm font-medium px-3 py-2 border-b border-[#8356F3]/20">
          Please select a font style
        </div>
        <div className="space-y-1">
          <button
            onClick={() => {
              onApplyStyle("style", "MODERN GLOW");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#22d3ee",
                textShadow: "0 0 10px #22d3ee",
                fontWeight: "bold",
                fontSize: "12px",
              }}>
              MODERN GLOW
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "RETRO WAVE");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#ec4899",
                fontWeight: "bold",
                textShadow: "0 0 8px #ec4899",
                fontSize: "12px",
              }}>
              RETRO WAVE
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "MINIMAL LIGHT");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#d1d5db",
                fontWeight: "300",
                letterSpacing: "1px",
                fontSize: "12px",
              }}>
              MINIMAL LIGHT
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "SUNDAY SERIF");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#d4af37",
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
                fontSize: "12px",
              }}>
              SUNDAY SERIF
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "URBAN PRAISE");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#fbbf24",
                fontWeight: "900",
                textTransform: "uppercase",
                fontSize: "12px",
              }}>
              URBAN PRAISE
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "Heavenly Script");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#d1d5db",
                fontFamily: "cursive",
                fontStyle: "italic",
                fontSize: "12px",
              }}>
              Heavenly Script
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "MIDNIGHT FADE");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#9ca3af",
                fontWeight: "bold",
                opacity: 0.8,
                fontSize: "12px",
              }}>
              MIDNIGHT FADE
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "SUNRISE BOLD");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "#fbbf24",
                fontWeight: "900",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                fontSize: "12px",
              }}>
              SUNRISE BOLD
            </span>
          </button>

          <button
            onClick={() => {
              onApplyStyle("style", "GRACE OUTLINE");
              onClose();
            }}
            className="w-full text-left px-2 py-2 hover:bg-[#8356F3]/20 rounded transition-colors">
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "1px #d1d5db",
                fontWeight: "bold",
                fontSize: "12px",
              }}>
              GRACE OUTLINE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
