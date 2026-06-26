import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SkillCategoryCard } from "@/components/skills/SkillCategoryCard";

const items = [
  { id: "1", name: "React", src: "https://example.com/react.svg" },
  { id: "2", name: "TypeScript", src: "https://example.com/ts.svg" },
  { id: "3", name: "Next.js", src: "https://example.com/next.svg" },
];

describe("SkillCategoryCard", () => {
  it("shows skill names under icons in the mobile no-scroll board", () => {
    render(
      <SkillCategoryCard
        title="Web & Data"
        blurb="Web tooling"
        items={items}
        index={1}
        fill
      />
    );

    expect(screen.getByText("React")).toHaveClass("text-center");
    expect(screen.getByText("React")).not.toHaveClass("hidden");
    expect(screen.getAllByLabelText("React").some((el) => el.getAttribute("title") === "React")).toBe(true);
  });

  it("spans both mobile columns when mobileFullWidth is enabled", () => {
    render(
      <SkillCategoryCard
        title="Web & Data"
        blurb="Web tooling"
        items={items}
        index={1}
        fill
        mobileFullWidth
      />
    );

    expect(screen.getByLabelText("Web & Data")).toHaveClass("col-span-2");
    expect(screen.getByLabelText("Web & Data")).toHaveClass("sm:col-span-1");
  });

  it("shows labels and blurb outside the mobile no-scroll board", () => {
    render(
      <SkillCategoryCard
        title="APIs & Storage"
        blurb="Storage tooling"
        items={items}
        index={1}
      />
    );

    expect(screen.getByText("Storage tooling")).toBeInTheDocument();
    expect(screen.getByText("React")).not.toHaveClass("hidden");
  });
});
