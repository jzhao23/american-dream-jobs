"use client";

import { useState, useEffect } from "react";

interface FlagLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// 5-pointed star path centered at origin with radius 1
const STAR_PATH = "M0,-1 L0.224,-0.309 L0.951,-0.309 L0.363,0.118 L0.588,0.809 L0,-0.118 L-0.588,0.809 L-0.363,0.118 L-0.951,-0.309 L-0.224,-0.309 Z";

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <path
      d={STAR_PATH}
      fill="white"
      transform={`translate(${cx}, ${cy}) scale(${r})`}
    />
  );
}

// SVG American flag matching the emoji appearance
function AmericanFlagSVG({ className }: { className?: string }) {
  // Official US flag proportions: 1.9:1, using 247x130 for precision
  const width = 247;
  const height = 130;
  const stripeHeight = height / 13;
  const cantonWidth = 98.8; // 40% of width
  const cantonHeight = 7 * stripeHeight; // 7 stripes tall
  const starRadius = 4.1;

  // Star positions: 9 rows alternating 6 and 5 stars
  const stars: { cx: number; cy: number }[] = [];
  const starRows = 9;
  const starColsOdd = 6;
  const starColsEven = 5;
  const hSpacingOdd = cantonWidth / (starColsOdd + 1);
  const hSpacingEven = cantonWidth / (starColsEven + 1);
  const vSpacing = cantonHeight / (starRows + 1);

  for (let row = 0; row < starRows; row++) {
    const isOddRow = row % 2 === 0;
    const cols = isOddRow ? starColsOdd : starColsEven;
    const hSpacing = isOddRow ? hSpacingOdd : hSpacingEven;
    for (let col = 0; col < cols; col++) {
      stars.push({
        cx: hSpacing * (col + 1),
        cy: vSpacing * (row + 1),
      });
    }
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      {/* 13 stripes alternating red and white */}
      <rect width={width} height={height} fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect
          key={i}
          y={i * stripeHeight}
          width={width}
          height={stripeHeight}
          fill="white"
        />
      ))}
      {/* Blue canton */}
      <rect width={cantonWidth} height={cantonHeight} fill="#3C3B6E" />
      {/* 50 stars */}
      {stars.map((star, i) => (
        <Star key={i} cx={star.cx} cy={star.cy} r={starRadius} />
      ))}
    </svg>
  );
}

// Detect if flag emoji renders properly (not as "US" text)
function checkFlagEmojiSupport(): boolean {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  canvas.width = 20;
  canvas.height = 20;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  // Draw the flag emoji
  ctx.font = "16px sans-serif";
  ctx.fillText("🇺🇸", 0, 16);

  // Sample pixels - a proper flag emoji will have colored pixels
  // If it renders as "US" text, the pattern will be different
  const imageData = ctx.getImageData(0, 0, 20, 20).data;

  // Check for any non-black pixels with color (flag has red/blue)
  let hasColor = false;
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];

    // Look for red or blue pixels (flag colors)
    if (a > 0 && ((r > 150 && g < 100 && b < 100) || (b > 100 && r < 100 && g < 100))) {
      hasColor = true;
      break;
    }
  }

  return hasColor;
}

export function FlagLogo({ size = "md", className = "" }: FlagLogoProps) {
  // Start with SVG to avoid flash of "US" text, then switch to emoji if supported
  const [useEmoji, setUseEmoji] = useState(false);

  const emojiSizeClasses = {
    sm: "text-lg leading-none",
    md: "text-xl leading-none",
    lg: "text-2xl leading-none",
  };

  const svgSizeClasses = {
    sm: "w-5 h-3.5",
    md: "w-6 h-4",
    lg: "w-7 h-5",
  };

  useEffect(() => {
    // Check if flag emoji is supported on this device
    if (checkFlagEmojiSupport()) {
      setUseEmoji(true);
    }
  }, []);

  return (
    <span
      className={`inline-flex items-center ${className}`}
      role="img"
      aria-label="American flag"
    >
      {useEmoji ? (
        <span className={emojiSizeClasses[size]}>🇺🇸</span>
      ) : (
        <AmericanFlagSVG className={svgSizeClasses[size]} />
      )}
    </span>
  );
}
