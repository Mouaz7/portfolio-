import {
  linkedSkillNames,
  matchesProjectTechnology,
  requestedProjectTechnology,
} from "@/lib/projects/technology-filter";
import { AEGISDB_REPOSITORY_URL, withAegisDbPreview } from "@/lib/projects/aegisdb-preview";

const project = {
  id: "example",
  title: "Example",
  description: "",
  category: "Systems",
  github_url: "https://github.com/Mouaz7/example",
  languages: ["Python", "PostgreSQL", "React Native"],
  visibility: "public" as const,
};

describe("skill-to-project filtering", () => {
  it("matches exact technologies case-insensitively and only deliberate aliases", () => {
    expect(matchesProjectTechnology(project, "python")).toBe(true);
    expect(matchesProjectTechnology(project, "SQL")).toBe(true);
    expect(matchesProjectTechnology(project, "React")).toBe(true);
    expect(matchesProjectTechnology(project, "Java")).toBe(false);
    expect(matchesProjectTechnology(project, "all")).toBe(true);
    expect(matchesProjectTechnology({ languages: ["HTML"] }, "HTML5")).toBe(true);
    expect(matchesProjectTechnology({ languages: ["CSS"] }, "CSS3")).toBe(true);
    expect(matchesProjectTechnology({ languages: ["Shell"] }, "Bash")).toBe(true);
  });

  it("only exposes skill links that have matching published project data", () => {
    expect(linkedSkillNames(
      [{ name: "Python" }, { name: "Swift" }, { name: "LLM Integration" }],
      [project, { ...project, languages: ["AI"] }],
    )).toEqual(["Python", "LLM Integration"]);
  });

  it("ignores malformed or oversized query values", () => {
    expect(requestedProjectTechnology([" Python ", "Java"])).toBe("Python");
    expect(requestedProjectTechnology(" ")).toBeNull();
    expect(requestedProjectTechnology("x".repeat(81))).toBeNull();
  });

  it("shows the public AegisDB repository with its verified Java stack until sync", () => {
    const preview = withAegisDbPreview([project], "en", null);
    expect(preview).toHaveLength(2);
    expect(preview[1]).toMatchObject({
      title: "AegisDB",
      github_url: AEGISDB_REPOSITORY_URL,
      visibility: "public",
    });
    expect(preview[1].languages).toEqual(expect.arrayContaining([
      "Java", "Raft", "MVCC", "Docker", "Prometheus", "Python", "Bash",
      "GitHub Actions", "CI/CD", "Git", "GitHub",
    ]));
    expect(matchesProjectTechnology(preview[1], "Java")).toBe(true);
    expect(matchesProjectTechnology(preview[1], "Python")).toBe(true);
    expect(withAegisDbPreview([project], "en", "Build")).toHaveLength(1);
    expect(withAegisDbPreview([{ ...project, github_url: AEGISDB_REPOSITORY_URL }], "en", null))
      .toHaveLength(1);
  });
});
