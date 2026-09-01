import { render, screen, waitFor } from "@/tests/test-utils";
import { SkillCard } from "@/components/skills/SkillCard";
import SkillIcon from "@/components/skills/SkillIcon";
import SkillsGrid from "@/components/skills/SkillsGrid";

jest.mock("@/components/skills/useViewportStage", () => ({
  useViewportStage: () => ({
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

describe("skills card contrast pass", () => {
  afterEach(() => {
    document.documentElement.classList.remove("light");
  });

  it("shows the established terminal loader before server-preloaded skills", async () => {
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
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading skills...");
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
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
