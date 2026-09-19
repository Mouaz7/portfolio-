/**
 * @jest-environment node
 */

import {
  logServerError,
  safeErrorContext,
  safeLog,
} from "@/lib/security/safe-logger.server";

describe("safe server logger", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("emits only structured allowlisted context", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    safeLog("error", "api.contact.failed", {
      code: "storage_unavailable",
      route: "/api/contact",
      status: 503,
    });

    const record = JSON.parse(String(errorSpy.mock.calls[0][0]));
    expect(record).toMatchObject({
      code: "storage_unavailable",
      event: "api.contact.failed",
      level: "error",
      route: "/api/contact",
      status: 503,
    });
    expect(record.timestamp).toEqual(expect.any(String));
  });

  it("does not serialize provider messages or sensitive error properties", () => {
    const marker = "<sensitive provider body marker>";
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error(`upstream said ${marker}`), {
      body: marker,
      code: marker,
      email: "person@example.com",
      status: 502,
      token: marker,
    });

    logServerError("api.ai.failed", error, {
      provider: "nvidia",
      route: "/api/ai/code-review",
    });

    const output = String(errorSpy.mock.calls[0][0]);
    expect(output).not.toContain(marker);
    expect(output).not.toContain("person@example.com");
    expect(JSON.parse(output)).toMatchObject({
      code: "redacted",
      provider: "nvidia",
      status: 502,
    });
  });

  it("reduces unknown errors to a stable code", () => {
    expect(safeErrorContext("secret text")).toEqual({ code: "unknown_error" });
  });
});
