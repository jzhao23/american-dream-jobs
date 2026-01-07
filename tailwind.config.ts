import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // AI Risk colors (5 levels: very_low, low, medium, high, very_high)
    'text-green-600', 'bg-green-100',       // Very Low
    'text-emerald-600', 'bg-emerald-100',   // Low
    'text-yellow-600', 'bg-yellow-100',     // Medium
    'text-orange-600', 'bg-orange-100',     // High
    'text-red-600', 'bg-red-100',           // Very High
    // Importance colors
    'text-blue-600', 'bg-blue-100',
    'text-indigo-600', 'bg-indigo-100',
    'text-gray-600', 'bg-gray-100',
    // Category colors (all used in category-metadata.ts)
    'bg-slate-100', 'text-slate-800',
    'bg-emerald-100', 'text-emerald-800',
    'bg-amber-100', 'text-amber-800',
    'bg-blue-100', 'text-blue-800',
    'bg-indigo-100', 'text-indigo-800',
    'bg-purple-100', 'text-purple-800',
    'bg-pink-100', 'text-pink-800',
    'bg-orange-100', 'text-orange-800',
    'bg-fuchsia-100', 'text-fuchsia-800',
    'bg-red-100', 'text-red-800',
    'bg-rose-100', 'text-rose-800',
    'bg-sky-100', 'text-sky-800',
    'bg-yellow-100', 'text-yellow-800',
    'bg-lime-100', 'text-lime-800',
    'bg-teal-100', 'text-teal-800',
    'bg-cyan-100', 'text-cyan-800',
    'bg-gray-100', 'text-gray-800',
    'bg-green-100', 'text-green-800',
    'bg-stone-100', 'text-stone-800',
    'bg-zinc-100', 'text-zinc-800',
    'bg-violet-100', 'text-violet-800',
    'bg-neutral-100', 'text-neutral-800',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy primary colors (keeping for backward compatibility)
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Legacy secondary colors (keeping for backward compatibility)
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // New design system colors
        sage: {
          DEFAULT: "#4A6741",
          light: "#6B8B62",
          muted: "#E8EDE6",
          pale: "#F4F7F3",
          dark: "#3A5334",
        },
        cream: {
          DEFAULT: "#FAF7F2",
        },
        "warm-white": {
          DEFAULT: "#FFFCF7",
        },
        terracotta: {
          DEFAULT: "#C4704D",
          bg: "#FEF3E8",
        },
        "ds-slate": {
          DEFAULT: "#3D3D3D",
          light: "#6B6B6B",
          muted: "#9A9A9A",
        },
        gold: {
          DEFAULT: "#8B7335",
          bg: "#FEF8E8",
        },
        "ds-orange": {
          DEFAULT: "#B85C2C",
          bg: "#FEF0E8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Source Sans 3", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px rgba(74, 103, 65, 0.08)",
        hover: "0 8px 32px rgba(74, 103, 65, 0.14)",
        card: "0 2px 12px rgba(74, 103, 65, 0.06)",
      },
      borderRadius: {
        "2xl": "20px",
        xl: "14px",
      },
      animation: {
        fadeUp: "fadeUp 0.7s ease-out backwards",
        fadeDown: "fadeDown 0.6s ease-out",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeDown: {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
