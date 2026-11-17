/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0e0f11",
          900: "#16171a",
          850: "#1b1d20",
          800: "#222429",
          700: "#2c2f35",
          600: "#3a3d44",
        },
        bone: {
          DEFAULT: "#e9e5dc",
          muted: "#a3a29d",
          faint: "#75767a",
        },
        accent: {
          DEFAULT: "#5b8bd6",
          soft: "#9bb8ea",
          deep: "#2f4f86",
        },
        rose: "#d07090",
      },
      fontFamily: {
        // San Francisco on iPhone/Mac so it feels like a native app
        sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', "system-ui", "sans-serif"],
        mono: ["ui-monospace", '"SF Mono"', "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
