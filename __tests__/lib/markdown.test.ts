import { parseMarkdownBlocks } from "@/lib/ai/markdown";

describe("AI markdown parser", () => {
  it("renders headings, lists and fenced code as safe blocks", () => {
    expect(
      parseMarkdownBlocks(
        "## Summary\n\n- Use const\n- Add validation\n\n```typescript\nconst x = 1;\n```",
      ),
    ).toEqual([
      { type: "heading", level: 2, text: "Summary" },
      { type: "list", ordered: false, items: ["Use const", "Add validation"] },
      { type: "code", language: "typescript", code: "const x = 1;" },
    ]);
  });

  it("does not interpret raw HTML as markup", () => {
    expect(parseMarkdownBlocks("<script>alert(1)</script>")).toEqual([
      { type: "paragraph", lines: ["<script>alert(1)</script>"] },
    ]);
  });
});
