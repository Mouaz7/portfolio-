// Keep the same API shape as next/font without making production builds depend
// on fetching Google Fonts. app/global.css still defines the Urbanist face when
// the browser can reach Google Fonts, with system fonts as the fallback.
export const urbanist = {
  variable: "font-urbanist",
};
