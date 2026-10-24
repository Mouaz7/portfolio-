import { expect, test } from "@playwright/test";

test("legacy public URLs retain permanent redirects, locale and query parameters", async ({ request }) => {
  for (const locale of ["", "/en", "/sv", "/ar"]) {
    for (const name of ["skills", "projects", "contact"]) {
      const query = "?technology=C%2B%2B&from=old";
      const response = await request.get(`${locale}/${name}-page${query}`, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      const destination = new URL(response.headers().location, response.url());
      expect(destination.pathname).toBe(`${locale === "/en" ? "" : locale}/${name}`);
      expect(destination.search).toBe(query);
    }
  }
});
