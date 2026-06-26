/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables so the whole site flips with the theme.
        // Defaults (dark) and the .light overrides live in app/global.css.
        white: "var(--fg)",
        black: "var(--bg)",
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
        },
        gray: {
          100: "var(--fg-70)",
          200: "var(--fg-50)",
          300: "var(--fg-10)",
        },
        steelblue: "rgba(14, 96, 151, 0)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        display: "var(--font-display)",
        mono: "var(--font-mono)",
      },
    },
    screens: {},
  },
  corePlugins: {
    preflight: false,
  },
};
