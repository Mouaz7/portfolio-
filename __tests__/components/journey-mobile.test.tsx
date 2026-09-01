import { act, render, screen, waitFor } from "@/tests/test-utils";
import GitGraph from "@/components/journey/GitGraph";
import {
  JOURNEY_MOBILE_MEDIA,
  JOURNEY_MOBILE_STAGE,
  journeyMobileStageHeight,
} from "@/components/journey/constants";
import JourneyPage from "@/app/journey/journey-page";
import {
  computeFluidStageWidth,
  computeViewportFitScale,
} from "@/hooks/useViewportFitStage";

jest.mock("@/components/navigation/Header", () => ({
  __esModule: true,
  default: function HeaderMock({
    disableRouteTouch = false,
  }: {
    disableRouteTouch?: boolean;
  }) {
    return (
      <header
        data-testid="header"
        data-disable-route-touch={disableRouteTouch ? "true" : "false"}
        data-mock-height="52"
      />
    );
  },
}));

jest.mock("@/components/ui/LoadingAnimation", () => ({
  __esModule: true,
  default: function LoadingAnimationMock({ text }: { text: string }) {
    return <div>{text}</div>;
  },
}));

const sampleItems = [
  {
    id: "bth-1",
    title: "B.Sc. Software Engineering - BTH",
    description: "Built the foundations for the journey timeline and portfolio narrative.",
    from: "2023-08-01",
    to: "2026-06-01",
    topic: "campus-track",
  },
  {
    id: "softhouse-1",
    title: "Full-Stack Developer Intern - Softhouse",
    description: "Built a real-time Slack and scheduling workflow for consultants.",
    from: "2025-01-01",
    to: "2025-05-31",
    topic: "consulting-track",
  },
  {
    id: "bth-2",
    title: "Student Mentor - BTH",
    description: "Mentored and onboarded new students.",
    from: "2025-09-01",
    to: "2026-06-01",
    topic: "mentorship-track",
  },
  {
    id: "bth-3",
    title: "C++ Teaching Assistant (OOP) - BTH",
    description: "Taught C++ and OOP during lab sessions.",
    from: "2025-09-01",
    to: "2026-06-01",
    topic: "teaching-track",
  },
  {
    id: "bth-4",
    title: "Algorithms Course Assistant - BTH",
    description: "Supported course exercises and student workshops.",
    from: "2025-09-01",
    to: "2026-06-01",
    topic: "algo-track",
  },
  {
    id: "bth-5",
    title: "M.Sc. Software Engineering - BTH",
    description: "Master’s degree in Software Engineering at BTH.",
    from: "2026-08-01",
    to: "2028-06-30",
    topic: "master",
  },
];

function setJourneyMatchMedia(mobile: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query === JOURNEY_MOBILE_MEDIA ? mobile : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

describe("journey mobile layout", () => {
  let offsetHeightSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    setJourneyMatchMedia(false);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320, writable: true });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 460, writable: true });

    offsetHeightSpy = jest
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function offsetHeight(this: HTMLElement) {
        return Number(this.getAttribute?.("data-mock-height")) || 0;
      });
  });

  afterEach(() => {
    offsetHeightSpy.mockRestore();
  });

  it("shows the established terminal loader before server-preloaded journey data", async () => {
    render(<JourneyPage initialItems={sampleItems} />);

    expect(screen.getByText("Loading Journey...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading Journey...")).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading", { name: /Software Engineering/i })).toHaveLength(2);
  });

  it("switches into journey mobile mode at the shared breakpoint and hides topic chips", () => {
    const { container } = render(<GitGraph items={sampleItems} mobileStage />);
    const journey = screen.getByLabelText("Journey");
    expect(journey).toHaveAttribute("data-journey-mode", "mobile-stage");
    expect(screen.queryByLabelText("Journey branches")).not.toBeInTheDocument();

    const rows = Array.from(container.querySelectorAll(".commit-row"));
    expect(rows).toHaveLength(sampleItems.length);
    rows.forEach((row) => {
      expect(row).toHaveStyle({ height: `${JOURNEY_MOBILE_STAGE.rowHeight}px` });
    });

    expect(screen.queryByText("campus-track")).not.toBeInTheDocument();
    expect(screen.queryByText("consulting-track")).not.toBeInTheDocument();
    expect(screen.queryByText("Built a real-time Slack and scheduling workflow for consultants.")).not.toBeInTheDocument();
    screen.getAllByText("Verified").forEach((label) => {
      expect(label.className).toContain("max-[675px]:sr-only");
    });
  });

  it("uses known org logos instead of the fallback avatar in mobile mode", () => {
    const { container } = render(<GitGraph items={sampleItems} mobileStage />);

    expect(container.querySelector("[data-journey-fallback-avatar]")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "BTH" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Softhouse" })).toBeInTheDocument();
  });

  it("keeps mobile metadata and branch chips together without restoring topic chips", () => {
    const { container } = render(<GitGraph items={sampleItems} mobileStage />);

    expect(container.querySelectorAll(".commit-card")).toHaveLength(sampleItems.length);
    expect(container.querySelectorAll(".commit-mobile-meta")).toHaveLength(sampleItems.length);
    expect(screen.getAllByTitle(/^Commit /)).toHaveLength(sampleItems.length);
    expect(screen.getByText("Aug23–Jun26")).toBeInTheDocument();
    expect(screen.getAllByText("BTH").length).toBeGreaterThan(0);
    expect(screen.getByText("Softhouse")).toBeInTheDocument();
    expect(screen.getAllByTitle("bth/main").length).toBeGreaterThan(0);
    expect(screen.getByTitle("softhouse")).toBeInTheDocument();

    expect(screen.queryByText("campus-track")).not.toBeInTheDocument();
    expect(screen.queryByText("consulting-track")).not.toBeInTheDocument();
    expect(screen.queryByText("Built the foundations for the journey timeline and portfolio narrative.")).not.toBeInTheDocument();
  });

  it("renders continuous mobile rail lines with overshoot and raised nodes", () => {
    const { container } = render(<GitGraph items={sampleItems} mobileStage />);

    expect(container.querySelectorAll("svg[data-rail-overshoot='true']").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("svg[data-rail-node-y='42']").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".rail-card-connector")).toHaveLength(sampleItems.length);
    expect(container.querySelectorAll(".commit-rail-port")).toHaveLength(sampleItems.length);
  });

  it("keeps topic chips visible on desktop and does not stretch rows with flex fillers", () => {
    const { container } = render(<GitGraph items={sampleItems} />);

    expect(screen.getByLabelText("Journey")).toHaveAttribute("data-journey-mode", "desktop");
    expect(screen.getByText("campus-track")).toBeInTheDocument();
    expect(screen.getByText("consulting-track")).toBeInTheDocument();
    expect(screen.getAllByText("BTH").length).toBeGreaterThan(0);
    expect(screen.getByText("Softhouse")).toBeInTheDocument();
    expect(screen.getAllByTitle("bth/main").length).toBeGreaterThan(0);
    expect(screen.getByTitle("softhouse")).toBeInTheDocument();

    const rows = Array.from(container.querySelectorAll(".commit-row"));
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => expect(row.className).not.toMatch(/\bflex-1\b/));
    expect(screen.getByText("Built a real-time Slack and scheduling workflow for consultants.")).toBeInTheDocument();
  });

  it("computes a viewport fit scale that shrinks oversized mobile content", () => {
    expect(journeyMobileStageHeight(sampleItems.length)).toBe(
      JOURNEY_MOBILE_STAGE.headerHeight +
        JOURNEY_MOBILE_STAGE.headerGap +
        sampleItems.length * JOURNEY_MOBILE_STAGE.rowHeight +
        (sampleItems.length - 1) * JOURNEY_MOBILE_STAGE.rowGap
    );
    expect(computeViewportFitScale(320, 280, 320, 520)).toBeCloseTo(280 / 520);
    expect(computeViewportFitScale(320, 520, 280, 400, 0.5)).toBe(1);
  });

  it("fits the journey into the mobile viewport without enabling page scroll or swipe", async () => {
    setJourneyMatchMedia(true);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleItems,
    }) as typeof fetch;

    render(<JourneyPage />);

    expect(screen.getByTestId("header")).toHaveAttribute("data-disable-route-touch", "true");

    const content = screen.getByLabelText("Journey content");
    expect(content.className).toContain("overflow-hidden");
    expect(content.className).not.toContain("overflow-y-auto");

    await waitFor(() => {
      expect(content.querySelectorAll(".commit-row")).toHaveLength(sampleItems.length);
    });

    expect(await screen.findAllByText(/Software Engineering/i)).toHaveLength(2);
    await waitFor(() => {
      expect(screen.queryByText("Loading Journey...")).not.toBeInTheDocument();
    });

    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    const fitViewport = screen.getByLabelText("Journey content").querySelector("[data-journey-fit]");

    await waitFor(() => {
      const availableWidth = window.innerWidth - JOURNEY_MOBILE_STAGE.padX * 2;
      const expectedScale = computeViewportFitScale(
        availableWidth,
        window.innerHeight - 52 - JOURNEY_MOBILE_STAGE.padY * 2,
        JOURNEY_MOBILE_STAGE.width,
        journeyMobileStageHeight(sampleItems.length),
        JOURNEY_MOBILE_STAGE.minScale
      );
      expect(fitViewport).toHaveAttribute("data-journey-fit", "mobile-stage");
      expect(fitViewport?.firstElementChild).toHaveClass("shrink-0");
      expect(fitViewport).toHaveAttribute("data-journey-scale", expectedScale.toFixed(3));
      expect(fitViewport).toHaveAttribute(
        "data-journey-fluid-width",
        computeFluidStageWidth(availableWidth, expectedScale, JOURNEY_MOBILE_STAGE.width).toFixed(1)
      );
    });
  });
});
