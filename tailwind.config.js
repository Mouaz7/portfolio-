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
        cornflowerblue: {
          100: "var(--accent)",
          200: "var(--accent-strong)",
          300: "var(--accent-faint)",
          400: "var(--accent-faint-2)",
        },
        black: "var(--bg)",
        gray: {
          100: "var(--fg-70)",
          200: "var(--fg-50)",
          300: "var(--fg-10)",
        },
        lightgray: "#d0d5dd",
        silver: "#b5bdc4",
        dimgray: "#656565",
        darkslategray: "rgba(52, 52, 52, 0.5)",
        darkslateblue: {
          100: "rgba(0, 68, 130, 0.1)",
          200: "rgba(0, 68, 130, 0)",
        },
        steelblue: "rgba(14, 96, 151, 0)",
      },
      fontFamily: {
        urbanist: "Urbanist",
      },
    },
    screens: {},
  },
  corePlugins: {
    preflight: false,
  },
};
