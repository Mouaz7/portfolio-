import { fireEvent, render, screen, waitFor } from "@/tests/test-utils";
import ProjectsPage from "@/app/projects-page/projects-page";
import React from "react";
import { MANUAL_PORTFOLIO_URL } from "@/lib/projects/githubSync";

jest.mock("@/components/navigation/Header", () => ({
  __esModule: true,
  default: function HeaderMock() {
    return <header data-testid="header" />;
  },
}));

jest.mock("@/components/ui/LoadingAnimation", () => ({
  __esModule: true,
  default: function LoadingAnimationMock({ text }: { text: string }) {
    return <div>{text}</div>;
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: function ImageMock({
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  },
}));

const sampleProjects = [
  {
    id: "move-out",
    title: "Move-Out: Moving Box System",
    description: "Web app for managing moving boxes via QR codes.",
    category: "Full-Stack",
    github_url: "https://github.com/example/move-out",
    languages: ["Node.js", "Express", "PostgreSQL", "Supabase", "Security"],
    cover_image_url: "/project-icons/nodejs-badge.svg",
  },
  {
    id: "portfolio",
    title: "Developer Portfolio",
    description: "Portfolio with journey and theming.",
    category: "Full-Stack",
    github_url: MANUAL_PORTFOLIO_URL,
    languages: ["Next.js", "TypeScript", "Tailwind", "Supabase"],
    cover_image_url: "/project-icons/nextjs.svg",
  },
  {
    id: "eshop",
    title: "E-Shop Management System",
    description: "Node.js commerce platform.",
    category: "Full-Stack",
    github_url: "https://github.com/example/eshop-management-system",
    languages: ["Node.js", "Express", "MySQL", "EJS"],
    cover_image_url: "/project-icons/nodejs-badge.svg",
  },
  {
    id: "build",
    title: "Auto Healing DevOps Platform",
    description: "AI-based auto-healing CI/CD pipeline.",
    category: "Build",
    github_url: "https://github.com/example/auto-healing-devops-platform",
    languages: ["Python", "Jenkins", "Docker", "JSON", "AI"],
    cover_image_url: "/project-icons/python.svg",
  },
  {
    id: "campus",
    title: "Campus360",
    description: "Mobile navigation app.",
    category: "Mobile",
    github_url: "https://github.com/example/campus360",
    languages: ["Kotlin", "Java"],
    cover_image_url: "/project-icons/android.svg",
  },
  {
    id: "threads",
    title: "Concurrency Systems",
    description: "POSIX thread exercises.",
    category: "Systems",
    github_url: "https://github.com/example/concurrency-systems",
    languages: ["C", "Linux"],
    cover_image_url: "/project-icons/c.svg",
  },
];

const sampleRepositoryStats = {
  "example/move-out": {
    stars: 12,
    watchers: 2,
    forks: 3,
    language: "TypeScript",
    isFork: false,
    isArchived: false,
    updatedAt: "2026-06-12T00:00:00Z",
  },
  "Mouaz7/portfolio-": {
    stars: 29,
    watchers: 4,
    forks: 2,
    language: "TypeScript",
    isFork: false,
    isArchived: false,
    updatedAt: "2026-06-20T00:00:00Z",
  },
  "example/eshop-management-system": {
    stars: 3,
    watchers: 1,
    forks: 1,
    language: "JavaScript",
    isFork: true,
    isArchived: false,
    updatedAt: "2026-05-10T00:00:00Z",
  },
};

describe("projects page layout guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/github/repo-stats") {
        return {
          ok: true,
          json: async () => ({ stats: sampleRepositoryStats }),
        };
      }

      return {
        ok: true,
        json: async () => sampleProjects,
      };
    }) as typeof fetch;
  });

  it("shows the established terminal loader before server-preloaded projects", async () => {
    render(
      <ProjectsPage
        initialProjects={sampleProjects.map((project) => ({
          ...project,
          visibility: "public" as const,
        }))}
        initialRepositoryStats={sampleRepositoryStats}
      />,
    );

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading projects...")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Move-Out: Moving Box System")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("renders project rows with stable hooks and one GitHub link per row", async () => {
    const { container } = render(<ProjectsPage />);

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Full-Stack/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading projects...")).not.toBeInTheDocument();
    });

    const rows = Array.from(container.querySelectorAll(".projects-project-row"));
    expect(rows).toHaveLength(3);

    rows.forEach((row) => {
      expect(row.querySelector(".projects-repo-heading")).toBeInTheDocument();
      expect(row.querySelectorAll(".projects-visibility-badge")).toHaveLength(2);
      expect(row.querySelector(".projects-project-body")).toBeInTheDocument();
      expect(row.querySelector(".projects-project-copy")).toBeInTheDocument();
      expect(row.querySelector(".projects-repo-metadata")).toBeInTheDocument();
      expect(row.querySelector(".projects-project-title-link")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Open Move-Out: Moving Box System")).toBeInTheDocument();
    expect(screen.getByLabelText("Open Developer Portfolio")).toBeInTheDocument();
    expect(screen.queryByText("No Icon")).not.toBeInTheDocument();
    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.queryByText("Firebase")).not.toBeInTheDocument();
    expect(screen.getAllByText("Express").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PostgreSQL").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Supabase").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Security").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".projects-project-media")).toHaveLength(0);

    fireEvent.animationEnd(container.querySelector(".projects-category-content")!, {
      animationName: "projectCategoryEnter",
    });

    expect(container.querySelectorAll(".projects-project-row")).toHaveLength(3);
    expect(screen.getByText("Move-Out: Moving Box System")).toBeInTheDocument();
  });

  it("filters desktop repositories by search, language, and GitHub type", async () => {
    const { container } = render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading projects...")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Stars: 29")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Repositories" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search repositories"), {
      target: { value: "portfolio" },
    });
    expect(container.querySelectorAll(".projects-project-row")).toHaveLength(1);

    fireEvent.change(screen.getByLabelText("Search repositories"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Repository language"), {
      target: { value: "TypeScript" },
    });
    expect(container.querySelectorAll(".projects-project-row")).toHaveLength(1);

    fireEvent.change(screen.getByLabelText("Repository language"), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByLabelText("Repository type"), {
      target: { value: "fork" },
    });
    expect(container.querySelectorAll(".projects-project-row")).toHaveLength(1);
    expect(screen.getByText("E-Shop Management System")).toBeInTheDocument();
  });

  it("renders category filters in fixed order and keeps one accent per category", async () => {
    const { container } = render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading projects...")).not.toBeInTheDocument();
    });

    const filterLabels = Array.from(container.querySelectorAll(".projects-filter-chip")).map((chip) =>
      chip.textContent?.replace(/\d+/g, "").trim(),
    );

    expect(filterLabels).toEqual(["Full-Stack", "Build", "Mobile", "Systems"]);

    const rows = Array.from(container.querySelectorAll(".projects-project-row"));
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveStyle("--card-accent-rgb: 8, 185, 190");
    expect(rows[1]).toHaveStyle("--card-accent-rgb: 8, 185, 190");
    expect(rows[2]).toHaveStyle("--card-accent-rgb: 8, 185, 190");

    expect(container.querySelectorAll(".projects-project-media")).toHaveLength(0);

    const buildFilter = screen.getByRole("button", { name: /Build/i });
    expect(buildFilter).toHaveStyle("--shell-accent-rgb: 218, 130, 37");
    fireEvent.click(buildFilter);
    fireEvent.animationEnd(container.querySelector(".projects-category-content")!, {
      animationName: "projectCategoryExit",
    });

    await waitFor(() => {
      expect(screen.getAllByText("Jenkins").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Jenkins").length).toBeGreaterThan(0);
    expect(screen.getAllByText("JSON").length).toBeGreaterThan(0);
  });

  it("uses the compact mobile project row when the mobile breakpoint matches", async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(max-width: 540px)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { container } = render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Full-Stack/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading projects...")).not.toBeInTheDocument();
    });

    expect(container.querySelectorAll(".projects-mobile-card-row")).toHaveLength(3);
    expect(container.querySelector(".projects-mobile-terminal-prompt")).toHaveTextContent(
      "$ git log --graph Full-Stack",
    );
    await waitFor(() => {
      expect(container.querySelector(".projects-mobile-rail-primary")).toBeInTheDocument();
      expect(container.querySelector(".projects-mobile-rail-secondary")).toBeInTheDocument();
    });
    expect(container.querySelectorAll('[data-rail="primary"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-rail="secondary"]')).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Repositories" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Open Developer Portfolio")).toHaveAttribute(
      "href",
      MANUAL_PORTFOLIO_URL,
    );
    expect(container.querySelector(`a[href="${MANUAL_PORTFOLIO_URL}#readme"]`)).toBeInTheDocument();
    expect(container.querySelector(`a[href="${MANUAL_PORTFOLIO_URL}/activity"]`)).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByLabelText("Stars: 29; Watching: 4; Forks: 2"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Build/i }));
    fireEvent.animationEnd(container.querySelector(".projects-category-content")!, {
      animationName: "projectCategoryExit",
    });

    await waitFor(() => {
      expect(screen.getByText("Auto Healing DevOps Platform")).toBeInTheDocument();
    });
    expect(container.querySelectorAll(".projects-mobile-card-row")).toHaveLength(1);
    expect(container.querySelector(".projects-mobile-rail-secondary")).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-rail="primary"]')).toHaveLength(1);
    expect(container.querySelector(".projects-mobile-terminal-prompt")).toHaveTextContent(
      "$ git log --graph Build",
    );
    expect(screen.getByText("End of history")).toBeInTheDocument();
    expect(screen.getByText("1 repository")).toBeInTheDocument();
  });
});
