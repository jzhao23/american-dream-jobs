"use client";

import { useState, useEffect, useRef } from "react";

interface FlagLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// SVG American flag for fallback
function AmericanFlagSVG({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      {/* Red and white stripes */}
      <rect width="60" height="40" fill="#B22234" />
      <rect y="3.08" width="60" height="3.08" fill="white" />
      <rect y="9.23" width="60" height="3.08" fill="white" />
      <rect y="15.38" width="60" height="3.08" fill="white" />
      <rect y="21.54" width="60" height="3.08" fill="white" />
      <rect y="27.69" width="60" height="3.08" fill="white" />
      <rect y="33.85" width="60" height="3.08" fill="white" />
      {/* Blue canton */}
      <rect width="24" height="21.54" fill="#3C3B6E" />
      {/* Stars (simplified 5x4 grid for clarity at small sizes) */}
      <g fill="white">
        {/* Row 1 */}
        <circle cx="4" cy="2.7" r="1.2" />
        <circle cx="8.8" cy="2.7" r="1.2" />
        <circle cx="13.6" cy="2.7" r="1.2" />
        <circle cx="18.4" cy="2.7" r="1.2" />
        {/* Row 2 */}
        <circle cx="6.4" cy="5.4" r="1.2" />
        <circle cx="11.2" cy="5.4" r="1.2" />
        <circle cx="16" cy="5.4" r="1.2" />
        <circle cx="20.8" cy="5.4" r="1.2" />
        {/* Row 3 */}
        <circle cx="4" cy="8.1" r="1.2" />
        <circle cx="8.8" cy="8.1" r="1.2" />
        <circle cx="13.6" cy="8.1" r="1.2" />
        <circle cx="18.4" cy="8.1" r="1.2" />
        {/* Row 4 */}
        <circle cx="6.4" cy="10.8" r="1.2" />
        <circle cx="11.2" cy="10.8" r="1.2" />
        <circle cx="16" cy="10.8" r="1.2" />
        <circle cx="20.8" cy="10.8" r="1.2" />
        {/* Row 5 */}
        <circle cx="4" cy="13.5" r="1.2" />
        <circle cx="8.8" cy="13.5" r="1.2" />
        <circle cx="13.6" cy="13.5" r="1.2" />
        <circle cx="18.4" cy="13.5" r="1.2" />
        {/* Row 6 */}
        <circle cx="6.4" cy="16.2" r="1.2" />
        <circle cx="11.2" cy="16.2" r="1.2" />
        <circle cx="16" cy="16.2" r="1.2" />
        <circle cx="20.8" cy="16.2" r="1.2" />
        {/* Row 7 */}
        <circle cx="4" cy="18.9" r="1.2" />
        <circle cx="8.8" cy="18.9" r="1.2" />
        <circle cx="13.6" cy="18.9" r="1.2" />
        <circle cx="18.4" cy="18.9" r="1.2" />
      </g>
    </svg>
  );
}

export function FlagLogo({ size = "md", className = "" }: FlagLogoProps) {
  const [useFallback, setUseFallback] = useState(false);
  const emojiRef = useRef<HTMLSpanElement>(null);

  // Size mappings
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const svgSizeClasses = {
    sm: "w-5 h-3.5",
    md: "w-6 h-4",
    lg: "w-7 h-5",
  };

  useEffect(() => {
    // Check if emoji renders properly by measuring its width
    // Regional indicator emojis (flags) should render as a single glyph
    // If they render as two separate characters (US), the width will be different
    if (emojiRef.current) {
      const span = emojiRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Get computed font from the span
        const computedStyle = window.getComputedStyle(span);
        ctx.font = computedStyle.font;

        // Measure the flag emoji
        const flagWidth = ctx.measureText("🇺🇸").width;
        // Measure a regular two-character string for comparison
        const twoCharWidth = ctx.measureText("AA").width;

        // If the flag renders as two separate regional indicators,
        // it will be roughly the same width as two characters
        // A proper emoji should be narrower (single glyph)
        // Also check if the width is 0 (no emoji support at all)
        if (flagWidth === 0 || flagWidth >= twoCharWidth * 0.9) {
          setUseFallback(true);
        }
      }
    }
  }, []);

  return (
    <span
      className={`inline-flex items-center ${className}`}
      role="img"
      aria-label="American flag"
    >
      {useFallback ? (
        <AmericanFlagSVG className={svgSizeClasses[size]} />
      ) : (
        <span ref={emojiRef} className={sizeClasses[size]}>
          🇺🇸
        </span>
      )}
    </span>
  );
}
