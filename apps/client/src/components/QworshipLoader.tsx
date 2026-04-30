import React from "react";

const SIZE_MAP = {
  sm: {
    canvas: 80,
    ringR: 28,
    strokeW: 11,
    dotR: 5.5,
    orbitGap: 5,
  },
  md: {
    canvas: 200,
    ringR: 72,
    strokeW: 28,
    dotR: 14,
    orbitGap: 6,
  },
  lg: {
    canvas: 320,
    ringR: 115,
    strokeW: 45,
    dotR: 22,
    orbitGap: 10,
  },
} as const;

type LoaderSize = keyof typeof SIZE_MAP;

interface QworshipLoaderProps {
  size?: LoaderSize;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const ANIMATION_CSS = `
@keyframes qw-orbit {
  0%   { transform: rotate(135deg); }
  80%  { transform: rotate(495deg); }
  100% { transform: rotate(495deg); }
}

@keyframes qw-dot-pulse {
  0%,  77% { transform: scale(1); }
  80%      { transform: scale(1.18); }
  88%      { transform: scale(0.95); }
  94%      { transform: scale(1.06); }
  100%     { transform: scale(1); }
}

@keyframes qw-label-fade {
  0%, 79%  { opacity: 0.7; }
  80%, 90% { opacity: 1; }
  100%     { opacity: 0.7; }
}
`;

let styleInjected = false;

function injectStyles() {
  if (styleInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.id = "qworship-loader-styles";
  el.textContent = ANIMATION_CSS;
  document.head.appendChild(el);
  styleInjected = true;
}

export const QworshipLoader: React.FC<QworshipLoaderProps> = ({
  size = "md",
  label = "Loading Qworship",
  showLabel = true,
  className = "",
}) => {
  injectStyles();

  const { canvas, ringR, strokeW, dotR, orbitGap } = SIZE_MAP[size];
  const cx = canvas / 2;
  const cy = canvas / 2;
  const ringOuter = ringR + strokeW / 2;
  const orbitR = ringOuter + orbitGap + dotR;
  const dotCy = cy - orbitR;

  const wrapperStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  };

  const orbitGroupStyle: React.CSSProperties = {
    transformOrigin: `${cx}px ${cy}px`,
    transform: "rotate(135deg)",
    animation: "qw-orbit 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  };

  const dotStyle: React.CSSProperties = {
    transformOrigin: `${cx}px ${dotCy}px`,
    animation: "qw-dot-pulse 3s ease-in-out infinite",
  };

  const labelStyle: React.CSSProperties = {
    color: "#c084fc",
    fontSize: size === "sm" ? 10 : size === "lg" ? 15 : 13,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    opacity: 0.85,
    animation: "qw-label-fade 3s ease-in-out infinite",
    userSelect: "none",
  };

  return (
    <div style={wrapperStyle} className={className} role="status" aria-label={label}>
      <svg
        viewBox={`0 0 ${canvas} ${canvas}`}
        xmlns="http://www.w3.org/2000/svg"
        width={canvas}
        height={canvas}
        overflow="visible"
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={ringR}
          fill="none"
          stroke="#FF2D78"
          strokeWidth={strokeW}
        />

        <g style={orbitGroupStyle}>
          <circle style={dotStyle} cx={cx} cy={dotCy} r={dotR} fill="#FF2D78" />
        </g>
      </svg>

      {showLabel && <span style={labelStyle}>{label}</span>}
    </div>
  );
};

export default QworshipLoader;
