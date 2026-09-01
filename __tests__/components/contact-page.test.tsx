import { fireEvent, render, screen, waitFor } from "@/tests/test-utils";
import ContactPage from "@/app/contact-page/contact-page";

jest.mock("@/components/navigation/Header", () => ({
  __esModule: true,
  default: () => <header data-testid="header" />,
}));

jest.mock("@/components/navigation/Footer", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}));

jest.mock("@/components/contact/photo-social-container", () => ({
  __esModule: true,
  default: () => <section data-testid="portrait" />,
}));

describe("contact page form", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn() as typeof fetch;
  });

  it("validates required fields without sending a request", async () => {
    const fetchMock = global.fetch as jest.Mock;
    const { container } = render(<ContactPage initialLinks={[]} />);
    const form = container.querySelector<HTMLFormElement>(
      'form[aria-label="Contact form"]',
    );

    fireEvent.submit(form!);

    expect(await screen.findByText("Please fill in Name, Email, and Message.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("presents the form as a GitHub repository workflow with a working preview", () => {
    const { container } = render(<ContactPage initialLinks={[]} />);

    expect(container.querySelector(".contact-repository-owner")).toHaveTextContent("Mouaz7");
    expect(container.querySelector(".contact-repository-title strong")).toHaveTextContent(
      "contact-form",
    );
    expect(screen.getByText("Pull requests")).toBeInTheDocument();
    expect(screen.queryByLabelText("Contact delivery pipeline")).not.toBeInTheDocument();
    expect(screen.getAllByText("Commit to main").length).toBeGreaterThan(0);

    fireEvent.change(container.querySelector("#contact-mobile-message")!, {
      target: { value: "Preview this commit message." },
    });
    fireEvent.click(container.querySelector("#contact-mobile-preview-tab")!);

    expect(screen.getByText("Preview this commit message.")).toBeInTheDocument();
    expect(container.querySelector("#contact-mobile-preview-tab")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("prepares and sends a valid JSON submission", async () => {
    const submissionId = "11111111-1111-4111-8111-111111111111";
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, submissionId, uploads: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    const { container, unmount } = render(<ContactPage initialLinks={[]} />);

    fireEvent.change(container.querySelector("#contact-mobile-name")!, {
      target: { value: "Mouaz Test" },
    });
    fireEvent.change(container.querySelector("#contact-mobile-email")!, {
      target: { value: "test@example.com" },
    });
    fireEvent.change(container.querySelector("#contact-mobile-message")!, {
      target: { value: "A secure contact test." },
    });
    fireEvent.submit(container.querySelector('form[aria-label="Contact form"]')!);

    await waitFor(() => {
      expect(screen.getByText("Message sent")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/contact/prepare",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/contact/send",
      expect.objectContaining({
        body: JSON.stringify({ submissionId }),
        method: "POST",
      }),
    );
    unmount();
  });
});
