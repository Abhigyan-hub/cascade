/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#2A2A2E",
        input: "#2A2A2E",
        ring: "#7B2CBF",
        background: "#0B0B0E",
        foreground: "#F1F1F1",
        primary: {
          DEFAULT: "#7B2CBF",
          foreground: "#F1F1F1",
        },
        secondary: {
          DEFAULT: "#9D4EDD",
          foreground: "#F1F1F1",
        },
        accent: {
          DEFAULT: "#F5C542",
          foreground: "#0B0B0E",
        },
        destructive: {
          DEFAULT: "#B11226",
          foreground: "#F1F1F1",
        },
        muted: {
          DEFAULT: "#2A2A2E",
          foreground: "#A1A1AA",
        },
        card: {
          DEFAULT: "#1A1A1E",
          foreground: "#F1F1F1",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
