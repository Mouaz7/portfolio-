import { act, fireEvent, render, screen } from "@/tests/test-utils";
import { SkillCard } from "@/components/skills/SkillCard";
import SkillIcon from "@/components/skills/SkillIcon";
import SkillsGrid from "@/components/skills/SkillsGrid";

jest.mock("@/components/skills/useViewportStage", () => ({
  useViewportStage: () => ({
    isMeasured: true,
    profile: "fit",
    scale: 1,
    baseW: 730,
    baseH: 900,
    needsVerticalScroll: false,
    stageStyle: {},
    wrapperStyle: () => ({}),
  }),
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

const sampleItems = [
  {
    id: "react",
    name: "React",
    src: "/icons/react-dark.svg",
    srcLight: "/icons/react-light.svg",
  },
  {
    id: "next",
    name: "Next.js",
    src: "/icons/next.svg",
    mono: true,
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    src: "/icons/tailwind.svg",
  },
];
const linkedSkills = new Set(sampleItems.map((item) => item.name));

describe("skills card contrast pass", () => {
  it("releases temporary hints after completion and cancellation without changing the stagger", () => {
    render(<SkillCard categoryKey="frontend" title="Frontend" blurb="Browser interfaces."
      items={sampleItems} cardW={360} cardRatio={4 / 3} cardIndex={2}
      projectSkillNames={linkedSkills} />);
    const card = screen.getByLabelText("Frontend");
    expect(card).toHaveStyle({ animationDelay: "240ms" });
    fireEvent.animationStart(card);
    expect(card).toHaveStyle({ willChange: "transform, opacity, filter" });
    fireEvent.animationEnd(card);
    expect(card).toHaveStyle({ willChange: "transform" });
    fireEvent.animationStart(card);
    fireEvent(card, new Event("animationcancel"));
    expect(card).toHaveStyle({ willChange: "transform" });
  });

  it("waits for missing categories and removes loading immediately when they arrive", async () => {
    jest.useFakeTimers();
    const previousFetch = global.fetch;
    let resolveResponse!: (value: Response) => void;
    global.fetch = jest.fn(() => new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    }));
    try {
      render(<SkillsGrid initialSkills={[]} />);
      expect(screen.getByRole("status")).toHaveTextContent("Loading skills...");
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("/api/skill-categories?locale=en");
      await act(async () => {
        resolveResponse({ ok: true, json: async () => [{
          key: "frontend", title: "Frontend", blurb: "Browser interfaces.",
        }] } as Response);
      });
      // No timers are advanced: settled data must be visible immediately.
      expect(screen.queryByText("Loading skills...")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Frontend" })).toBeInTheDocument();
    } finally {
      global.fetch = previousFetch;
      jest.useRealTimers();
    }
  });

  afterEach(() => {
    document.documentElement.classList.remove("light");
  });

  it("renders server-preloaded skills without an artificial loading delay", () => {
    render(
      <SkillsGrid
        initialCategories={[{
          key: "frontend",
          title: "Frontend",
          blurb: "Browser interfaces.",
        }]}
        initialSkills={sampleItems.map((item, weight) => ({
          ...item,
          alt: item.name,
          category: "frontend",
          mono: item.mono ?? false,
          weight,
          xOffset: 0,
          yOffset: 0,
        }))}
        initialProjectSkillNames={["React", "Next.js", "Tailwind CSS"]}
      />,
    );

    expect(screen.queryByText("Loading skills...")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frontend" })).toBeInTheDocument();
  });

  it("renders each category as a GitHub-style repository without changing card geometry", () => {
    const { container } = render(
      <SkillCard
        categoryKey="frontend"
        title="Frontend & Mobile"
        blurb="Interfaces, frameworks, and app experiences for the browser and mobile."
        items={sampleItems}
        cardW={360}
        cardRatio={4 / 3}
        cardIndex={0}
        projectSkillNames={linkedSkills}
      />
    );

    const card = screen.getByLabelText("Frontend & Mobile");
    const title = screen.getByRole("heading", { name: "Frontend & Mobile" });
    const blurb = screen.getByText(
      "Interfaces, frameworks, and app experiences for the browser and mobile."
    );
    const label = screen.getByText("React");

    expect(card).toHaveStyle({ width: "360px", height: "270px" });
    expect(card.className).toContain("skills-card-surface");
    expect(card.className).not.toContain("bg-white/[0.02]");
    expect(card.className).not.toContain("border-white/10");

    expect(title.className).toContain("skills-card-title");
    expect(title.className).toContain("text-[21px]");

    expect(blurb.className).toContain("skills-card-body");
    expect(blurb.className).toContain("text-[13px]");
    expect(blurb.className).not.toContain("text-white/85");

    expect(label.className).toContain("skills-card-label");
    expect(label.className).toContain("text-[12px]");

    expect(screen.getByText("mouaz")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View projects using React" }))
      .toHaveAttribute("href", "/projects?technology=React");
    expect(screen.getByText("frontend")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByLabelText("Tracked skills: 3")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-skill-canvas]")).toHaveLength(3);
    expect(container.querySelectorAll("[data-level]")).toHaveLength(28);
    expect(
      container.querySelector<HTMLElement>('[data-skill-logo="React"]'),
    ).toHaveStyle({ "--skill-logo-scale": "0.859" });
    expect(
      container.querySelector<HTMLElement>('[data-skill-logo="Next.js"]'),
    ).toHaveStyle({ "--skill-logo-scale": "0.859" });
  });

  it("does not make a skill clickable when no published project matches", () => {
    const { container } = render(
      <SkillCard
        categoryKey="frontend"
        title="Frontend"
        blurb="Browser interfaces."
        items={sampleItems}
        cardW={360}
        cardRatio={4 / 3}
        cardIndex={0}
        projectSkillNames={new Set(["React"])}
      />,
    );

    expect(screen.getByRole("link", { name: "View projects using React" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View projects using Next.js" })).not.toBeInTheDocument();
    expect(container.querySelector('[data-skill-project-unavailable="Next.js"]'))
      .toHaveAttribute("title", "No published projects using Next.js yet");
  });

  it("keeps themed icon swapping for skills with srcLight", () => {
    render(
      <SkillIcon
        s={{
          name: "React",
          src: "/icons/react-dark.svg",
          srcLight: "/icons/react-light.svg",
        }}
      />
    );

    const icon = screen.getByRole("img", { name: "React" });

    expect(icon.className).toContain("skill-icon");
    expect(icon.className).toContain("skill-themed");
    expect(icon.className).not.toContain("skill-plain");
    expect(icon.parentElement).toHaveAttribute("data-skill-interaction");
    expect(icon.parentElement).not.toHaveClass("skills-icon-motion");
    expect(icon.getAttribute("style")).toContain("--icon-dark: url(/icons/react-dark.svg)");
    expect(icon.getAttribute("style")).toContain("--icon-light: url(/icons/react-light.svg)");
  });

  it("keeps the final category identical in size to every other card", () => {
    render(
      <SkillCard
        categoryKey="webdata"
        title="Web & Data"
        blurb="Web and data tools."
        items={sampleItems}
        cardW={360}
        cardRatio={4 / 3}
        cardIndex={8}
        projectSkillNames={linkedSkills}
      />
    );

    const card = screen.getByLabelText("Web & Data");

    expect(card).toHaveStyle({
      width: "360px",
      height: "270px",
    });
  });

  it("keeps mono treatment and adds plain contrast hook for icons without srcLight", () => {
    document.documentElement.classList.add("light");

    const { rerender } = render(
      <SkillIcon
        s={{
          name: "Next.js",
          src: "/icons/next.svg",
          mono: true,
        }}
      />
    );

    const monoIcon = screen.getByRole("img", { name: "Next.js" });
    expect(monoIcon.className).toContain("skill-mono");
    expect(monoIcon.className).not.toContain("skill-plain");

    rerender(
      <SkillIcon
        s={{
          name: "Tailwind CSS",
          src: "/icons/tailwind.svg",
        }}
      />
    );

    const plainIcon = screen.getByRole("img", { name: "Tailwind CSS" });
    expect(plainIcon.className).toContain("skill-plain");
    expect(plainIcon.className).toContain("skill-icon");
    expect(plainIcon.className).not.toContain("skill-themed");
  });
});
