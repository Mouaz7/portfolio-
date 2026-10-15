/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables so the whole site flips with the theme.
        // Dark defaults and light-mode overrides live in app/global.css.
        white: "var(--fg)",
        black: "var(--bg)",
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
        },
        // Legacy accent name kept so existing cornflowerblue-* utilities flip to teal.
        cornflowerblue: {
          100: "var(--accent)",
          200: "var(--accent-strong)",
        },
        gray: {
          100: "var(--fg-70)",
          200: "var(--fg-50)",
          300: "var(--fg-10)",
        },
        steelblue: "rgba(14, 96, 151, 0)",
      },
      fontFamily: {
        urbanist: "var(--font-urbanist)",
      },
    },
    screens: {},
  },
  corePlugins: {
    preflight: false,
  },
};
