export const colors = {
  background: { canvas: "#08090c", surface: "#0f1117", elevated: "#151821" },
  foreground: { primary: "#fafafa", secondary: "#a1a1aa", muted: "#71717a" },
  brand: { 50: "#f5f3ff", 300: "#c4b5fd", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9" },
  semantic: { success: "#34d399", warning: "#fbbf24", danger: "#fb7185", info: "#60a5fa" },
} as const;

export const typography = {
  family: {
    sans: "Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, monospace",
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "4xl": "2.25rem",
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  12: "3rem",
  16: "4rem",
} as const;
export const radius = { sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem", full: "9999px" } as const;
export const shadows = {
  sm: "0 1px 2px rgb(0 0 0 / 0.2)",
  md: "0 12px 32px rgb(0 0 0 / 0.28)",
  glow: "0 0 28px rgb(124 58 237 / 0.3)",
} as const;
export const motion = {
  duration: { fast: 120, normal: 200, slow: 350 },
  easing: { standard: [0.2, 0, 0, 1], emphasized: [0.16, 1, 0.3, 1] },
} as const;

export const designTokens = { colors, typography, spacing, radius, shadows, motion } as const;
