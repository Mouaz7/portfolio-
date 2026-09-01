import { normalizeContactSocial } from "@/lib/contact/social-links.server";

describe("contact social icon normalization", () => {
  it("keeps a safe SVG path and HTTPS URL", () => {
    const path = normalizeContactSocial({
      id: 1, name: "GitHub", href: "https://github.com/mouaz", svg_path: "M12 2L2 12", viewbox: "0 0 24 24",
    });
    const image = normalizeContactSocial({
      id: 2, name: "LinkedIn", href: "https://linkedin.com/in/mouaz", svg_path: "https://cdn.simpleicons.org/linkedin", viewbox: null,
    });
    expect(path?.svgPath).toBe("M12 2L2 12");
    expect(image?.svgPath).toBe("https://cdn.simpleicons.org/linkedin");
  });

  it("allows the canonical Beacons profile and sanitizes its inline icon", () => {
    const link = normalizeContactSocial({
      id: 3,
      name: "Beacons",
      href: "https://beacons.ai/mouaz98",
      svg_path: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" /></svg>',
      viewbox: "0 0 24 24",
    });

    expect(link?.href).toBe("https://beacons.ai/mouaz98");
    expect(decodeURIComponent(link?.svgPath ?? "")).toContain("<circle");
    expect(link?.viewBox).toBe("1 2 17 20");
  });

  it("sanitizes raw SVG and rejects executable content", () => {
    const icon = normalizeContactSocial({
      id: 1,
      name: "Safe",
      href: "https://github.com/mouaz",
      svg_path: '<svg viewBox="0 0 24 24" onclick="alert(1)"><script>alert(1)</script><path d="M1 1" /></svg>',
      viewbox: null,
    });
    const decoded = decodeURIComponent(icon?.svgPath ?? "");
    expect(icon?.svgPath).toMatch(/^data:image\/svg\+xml,/);
    expect(decoded).not.toMatch(/script|onclick/i);
  });

  it("rejects unsafe links and data URLs supplied by the database", () => {
    expect(normalizeContactSocial({ id: 1, name: "Bad", href: "javascript:alert(1)", svg_path: "M1 1", viewbox: null })).toBeNull();
    expect(normalizeContactSocial({ id: 1, name: "Bad", href: "https://example.com", svg_path: "data:image/svg+xml,<svg></svg>", viewbox: null })).toBeNull();
    expect(normalizeContactSocial({ id: 1, name: "GitHub", href: "https://github.com/mouaz", svg_path: "https://example.com/icon.svg", viewbox: null })?.svgPath).toBe("");
  });
});
