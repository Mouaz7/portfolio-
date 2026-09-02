import { fireEvent, render, screen, waitFor } from "@/tests/test-utils";
import CodeReviewPage from "@/app/code-review-page/code-review-page";

jest.mock("@/components/navigation/Header", () => ({
  __esModule: true,
  default: function HeaderMock() {
    return <header data-testid="header" />;
  },
}));

jest.mock("@/components/CodeReviewMarkdown", () => {
  function CodeReviewMarkdownMock({ markdown }: { markdown: string }) {
    return <div data-testid="review-markdown">{markdown}</div>;
  }

  return CodeReviewMarkdownMock;
});

describe("CodeReviewPage", () => {
  async function renderWorkspace() {
    render(<CodeReviewPage />);
    await screen.findByRole("heading", { name: "Understand and improve your code" });
  }

  it("shows the established terminal loader before the workspace", async () => {
    render(<CodeReviewPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading code review…");
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Understand and improve your code" })).toBeInTheDocument();
  });

  it("explains the review workflow before code is submitted", async () => {
    await renderWorkspace();

    expect(
      screen.getByRole("heading", { name: "Understand and improve your code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Paste a code snippet, choose the language and review focus/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "How code review works" })).toBeInTheDocument();
    expect(screen.getByText("Review findings")).toBeInTheDocument();
    expect(screen.getByText("Ready to analyze code")).toBeInTheDocument();
    expect(screen.getByText(/Paste code, choose a review focus/i)).toBeInTheDocument();
    expect(screen.getByText("No code is stored")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Response: Auto" })).toBeInTheDocument();
  });

  it("shows terminal loading state while review is running", async () => {
    global.fetch = jest.fn(() => new Promise<Response>(() => {})) as typeof fetch;

    await renderWorkspace();
    fireEvent.change(screen.getByLabelText("Code snippet"), { target: { value: "const x = 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByRole("status")).toHaveTextContent("Reviewing code…");
  });

  it("renders full-size editor workspace and submits markdown review", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        review: "## Summary\n\nUse const.",
        language: "sv",
        model: "poolside/laguna-xs-2.1",
      }),
    }) as typeof fetch;

    await renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Code language" }));
    expect(screen.getByRole("listbox", { name: "Code language options" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Python" }));
    fireEvent.change(screen.getByLabelText("Code snippet"), { target: { value: "let x = 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(screen.getByTestId("review-markdown")).toHaveTextContent("Use const."));
    expect(screen.getByRole("tab", { name: "Results" })).toHaveAttribute("aria-selected", "true");
    expect(fetch).toHaveBeenCalledWith(
      "/api/ai/code-review",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("answers a general coding question before a review exists", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "A closure keeps access to variables from its outer scope.",
        language: "en",
        model: "chat-model",
      }),
    }) as typeof fetch;

    await renderWorkspace();
    const chatToggle = screen.getByRole("button", { name: "Open code assistant" });
    expect(screen.getByRole("tab", { name: "AI Chat" })).toBeEnabled();
    fireEvent.click(chatToggle);

    expect(screen.getByRole("region", { name: "Code assistant" })).toBeInTheDocument();
    expect(screen.getByText("What would you like help with?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Explain a programming concept" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("A closure keeps access to variables from its outer scope.");
    const request = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0][1];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      message: "Explain a programming concept",
      code: "",
      review: "",
    });
  });

  it("switches to verified portfolio questions about Mouaz", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "Mouaz builds secure full-stack applications.",
        language: "en",
        model: "portfolio-model",
      }),
    }) as typeof fetch;

    await renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Open code assistant" }));
    fireEvent.click(screen.getByRole("button", { name: "About Mouaz" }));

    expect(screen.getByText("Ask about Mouaz")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask something about Mouaz...")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "What experience does Mouaz have?" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Mouaz builds secure full-stack applications.");
    expect(fetch).toHaveBeenCalledWith(
      "/api/ai/cv-chat",
      expect.objectContaining({ method: "POST" }),
    );
    const request = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0][1];
    expect(JSON.parse(String(request?.body))).toEqual({
      message: "What experience does Mouaz have?",
      history: [],
      language: "auto",
    });
  });

  it("opens a contextual review chat and sends the frozen review context", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          review: "## Finding\n\nGuard user before reading name.",
          language: "en",
          model: "review-model",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          answer: "Use optional chaining or an explicit guard.",
          language: "en",
          model: "chat-model",
        }),
      }) as typeof fetch;

    await renderWorkspace();
    fireEvent.change(screen.getByLabelText("Code snippet"), {
      target: { value: "const name = user.name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    const chatToggle = screen.getByRole("button", { name: "Open code assistant" });
    await waitFor(() => expect(chatToggle).toBeEnabled());
    expect(screen.getByRole("tab", { name: "AI Chat" })).toBeEnabled();
    fireEvent.click(chatToggle);

    expect(screen.getByRole("region", { name: "Code assistant" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Explain the most important finding" }));
    const question = screen.getByLabelText("Question for the code assistant");
    expect(question).toHaveValue("Explain the most important finding");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Use optional chaining or an explicit guard.");
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/ai/code-review/chat",
      expect.objectContaining({ method: "POST" }),
    );
    const secondRequest = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[1][1];
    const body = JSON.parse(String(secondRequest?.body));
    expect(body).toMatchObject({
      code: "const name = user.name",
      review: "## Finding\n\nGuard user before reading name.",
      message: "Explain the most important finding",
    });

    fireEvent.click(screen.getByRole("tab", { name: "AI Chat" }));
    expect(screen.getByRole("tab", { name: "AI Chat" })).toHaveAttribute("aria-selected", "true");
  });
});
