import React from "react";

interface CustomToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const CustomToggle: React.FC<CustomToggleProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type="button"
      className={`
        relative inline-flex h-6 w-11 !min-h-0 !min-w-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800
        ${checked ? "bg-purple-600" : "bg-gray-600"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{ minHeight: "unset", minWidth: "unset" }}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      aria-checked={checked}
      role="switch">
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
};
