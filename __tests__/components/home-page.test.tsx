import { render, screen } from "@/tests/test-utils";

import HomePage from "@/app/home-page";

describe("Premium home redesign", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the original Hello, Mouaz identity, and animated role sequence", () => {
    const { container } = render(<HomePage />);

    expect(
      container.querySelector("[data-home-layout='asymmetric-profile']"),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-home-hero]")).toBeInTheDocument();
    expect(container.querySelector("[data-home-title]")).toBeInTheDocument();
    expect(container.querySelector("[data-home-stage]")).toBeInTheDocument();
    expect(container.querySelector("[data-home-portrait]")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "I’m Mouaz Software Engineer" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Mouaz Naji" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(container.querySelector("[data-home-role-sequence]")).toHaveAttribute(
      "data-home-role-sequence",
      "Software Engineer|Designer|Developer|AI Developer|Web Developer|Cybersecurity|Software Engineer",
    );
    expect(container.querySelector("[data-role-cycler]")).toHaveAttribute(
      "data-role-cycler-reserved",
      "Software Engineer|Designer|Developer|AI Developer|Web Developer|Cybersecurity|Software Engineer",
    );
    expect(container.querySelector("[data-role-cycler-reserve]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      Array.from(container.querySelectorAll("[data-role-cycler-reserve-word]"))
        .map((word) => word.textContent),
    ).toEqual([
      "Software Engineer",
      "Designer",
      "Developer",
      "AI Developer",
      "Web Developer",
      "Cybersecurity",
      "Software Engineer",
    ]);
    const portrait = screen.getByAltText("Mouaz Naji portrait");
    expect(portrait).toBeInTheDocument();
    expect(portrait).toHaveAttribute("fetchpriority", "high");

    expect(container.querySelector("[data-home-cosmos]")).not.toBeInTheDocument();
    expect(container.querySelector("[data-orb]")).not.toBeInTheDocument();
  });

  it("keeps the personal logo and renders five competence areas with decorative icons", () => {
    const { container } = render(<HomePage />);

    expect(screen.getAllByRole("img", { name: "Mouaz" }).length).toBeGreaterThan(0);
    expect(container.querySelector("[data-home-capabilities]")).toBeInTheDocument();

    const capabilities = Array.from(
      container.querySelectorAll("[data-home-capability]"),
    ).map((item) => item.getAttribute("data-home-capability"));

    expect(capabilities).toEqual([
      "backend",
      "ai",
      "secure-web",
      "cloud-devops",
      "quality",
    ]);

    const expectedCapabilities = [
      ["Backend Systems", "APIs, databases and scalable architecture"],
      ["AI Integrations", "LLMs, automation and intelligent workflows"],
      ["Secure Web", "Authentication, validation and reliable systems"],
      ["Cloud & DevOps", "CI/CD, containers and reliable deployments"],
      ["Quality Engineering", "Testing, observability and system reliability"],
    ];

    for (const [title, description] of expectedCapabilities) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }

    for (const capability of capabilities) {
      const card = container.querySelector(
        `[data-home-capability='${capability}']`,
      );
      const icon = card?.querySelector(
        `[data-home-capability-icon='${capability}']`,
      );

      expect(icon).toBeInTheDocument();
      expect(icon?.tagName.toLowerCase()).toBe("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
    }

    expect(container.querySelector("[data-home-tech-rail]")).not.toBeInTheDocument();
    expect(container.querySelector("[data-home-tech]")).not.toBeInTheDocument();
  });

  it("renders server-provided home content without a client loading state", () => {
    const { container } = render(
      <HomePage
        content={{
          introPrefix: "I’m ",
          displayName: "Mouaz",
          rolePrefix: "Software ",
          roleWords: ["Architect"],
          capabilities: [
            {
              id: "backend",
              title: "Dynamic Backend",
              description: "Managed from Supabase.",
              iconKey: "backend",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "I’m Mouaz Software Architect" })).toBeInTheDocument();
    expect(screen.getByText("Dynamic Backend")).toBeInTheDocument();
    expect(screen.getByText("Managed from Supabase.")).toBeInTheDocument();
    expect(container.querySelector("[data-home-role-sequence]")).toHaveAttribute(
      "data-home-role-sequence",
      "Software Architect",
    );
  });

  it("renders ordered project and CV actions with the standard header", () => {
    const { container } = render(<HomePage />);

    const actions = container.querySelector("[data-home-actions]");
    const projectLink = screen.getByRole("link", { name: "View Projects" });
    const downloadButton = screen.getByRole("button", { name: "Download CV" });

    expect(actions).toBeInTheDocument();
    expect(actions?.firstElementChild).toBe(projectLink);
    expect(actions?.lastElementChild).toBe(downloadButton);
    expect(projectLink).toHaveAttribute("href", "/projects-page");
    expect(downloadButton).toHaveAttribute("data-download-href", "/api/cv");
    expect(container.querySelector("header")).toHaveAttribute(
      "data-route-navigation",
      "disabled",
    );
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });
});
