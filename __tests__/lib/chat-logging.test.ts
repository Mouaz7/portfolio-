import { maskQuestion } from "@/lib/chat/logging";

describe("chat logging helpers", () => {
  it("masks email, phone numbers, and urls before storage", () => {
    const masked = maskQuestion(
      "Contact me at mouaz@example.com or +46 70 123 45 67 and check https://example.com/profile"
    );

    expect(masked).toContain("[email]");
    expect(masked).toContain("[phone]");
    expect(masked).toContain("[url]");
    expect(masked).not.toContain("mouaz@example.com");
    expect(masked).not.toContain("+46 70 123 45 67");
    expect(masked).not.toContain("https://example.com/profile");
  });
});
