// SVG needs raw colors. The neutrals match tailwind.config.js (ink and bone). The two series
// were validated together for a dark surface: lightness band, chroma, color blindness, contrast.
export const CHART = {
  thisWeek: "#5b8bd6",
  lastWeek: "#d07090",
  surface: "#16171a",
  grid: "#2c2f35",
  text: "#e9e5dc",
  textMuted: "#a3a29d",
  textFaint: "#75767a",
} as const;
