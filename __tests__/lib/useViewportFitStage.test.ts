import {
  computeFluidStageWidth,
  computeViewportFitScale,
  selectViewportLayoutProfile,
} from "@/hooks/useViewportFitStage";

describe("computeViewportFitScale", () => {
  it("caps scale at 1 by default", () => {
    expect(computeViewportFitScale(2000, 1600, 1000, 800)).toBe(1);
  });

  it("allows opt-in upscaling when maxScale is larger than 1", () => {
    expect(computeViewportFitScale(2000, 1600, 1000, 800, 0, Number.POSITIVE_INFINITY)).toBe(2);
  });
});

describe("computeFluidStageWidth", () => {
  it("fills the available visual width at full scale", () => {
    expect(computeFluidStageWidth(378, 1, 332)).toBe(378);
  });

  it("compensates for viewport scaling so the visual width still fills", () => {
    expect(computeFluidStageWidth(308, 0.8, 332)).toBe(385);
  });

  it("uses the fallback before viewport measurements are available", () => {
    expect(computeFluidStageWidth(0, 1, 332)).toBe(332);
  });
});

describe("selectViewportLayoutProfile", () => {
  it("keeps a full-size layout in a roomy viewport", () => {
    expect(selectViewportLayoutProfile(1, 1440, 900)).toBe("fit");
  });

  it("uses the compact profile for short laptops", () => {
    expect(selectViewportLayoutProfile(0.8, 1366, 600)).toBe("compact");
  });

  it("protects readable overflow at extreme zoom sizes", () => {
    expect(selectViewportLayoutProfile(0.5, 390, 320)).toBe("accessible-overflow");
  });
});
