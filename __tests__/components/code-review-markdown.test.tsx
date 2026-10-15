import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CodeReviewMarkdown from "@/components/CodeReviewMarkdown";

const mockCodeToTokens = jest.fn(() => ({
  tokens: [[{ content: "const x = 1;", color: "#ffffff" }]],
}));

jest.mock("@/lib/ai/shiki-highlighter", () => ({
  getCodeReviewHighlighter: jest.fn().mockResolvedValue({
    codeToTokens: mockCodeToTokens,
  }),
}));

describe("CodeReviewMarkdown", () => {
  it("renders headings, lists and safe code controls", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });

    render(
      <CodeReviewMarkdown
        markdown={"## Summary\n\n- Use const\n\n```typescript\nconst x = 1;\n```"}
      />,
    );

    expect(screen.getByRole("heading", { name: "Summary" })).toBeInTheDocument();
    expect(screen.getByText("Use const")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("const x = 1;")).toHaveStyle({ color: "#ffffff" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1;");
  });

  it("uses existing language aliases and preserves the plain-text fallback", async () => {
    const { rerender } = render(<CodeReviewMarkdown markdown={"```js\nconst x = 1;\n```"} />);

    await waitFor(() =>
      expect(mockCodeToTokens).toHaveBeenCalledWith("const x = 1;", {
        lang: "javascript",
        theme: "github-dark",
      }),
    );

    mockCodeToTokens.mockClear();
    rerender(<CodeReviewMarkdown markdown={"```unknown-language\nconst x = 1;\n```"} />);

    await waitFor(() =>
      expect(mockCodeToTokens).toHaveBeenCalledWith("const x = 1;", {
        lang: "text",
        theme: "github-dark",
      }),
    );
  });
});
