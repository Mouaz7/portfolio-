import { render, waitFor } from "@testing-library/react";

import SiteBackground from "@/components/ui/SiteBackground";

describe("SiteBackground", () => {
  beforeEach(() => {
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the capped adaptive background", async () => {
    const { container } = render(<SiteBackground />);
    const canvas = container.querySelector("canvas");

    await waitFor(() => expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled());
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute("data-background-fps", "0");
    expect(canvas).toHaveAttribute("data-background-mode", "animated");
    expect(canvas).toHaveAttribute("data-background-scale", "adaptive");
    expect(canvas).toHaveAttribute("data-background-profile", "css-soft");
    expect(canvas?.style.background).toContain("var(--wave-cyan-rgb)");
  });

  it("keeps the themed CSS fallback when phone WebGL is unavailable", async () => {
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext");
    jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("(max-width: 675px)"),
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { container } = render(<SiteBackground />);
    const canvas = container.querySelector("canvas");

    await waitFor(() => {
      expect(getContext).toHaveBeenCalledWith("webgl", expect.objectContaining({
        powerPreference: "low-power",
      }));
    });
    expect(canvas).toHaveAttribute("data-background-renderer", "css");
    expect(canvas).toHaveAttribute("data-background-mode", "animated");
    expect(canvas).toHaveAttribute("data-background-profile", "css-soft");
    expect(canvas?.style.background).toContain("var(--wave-cyan-rgb)");
    expect(canvas?.style.background).toContain("linear-gradient");
  });
});
