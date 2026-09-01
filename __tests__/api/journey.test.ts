/**
 * @jest-environment node
 */

import { GET } from "@/app/api/journey/route";
import { supabase } from "@/lib/backend/supabaseClient";

const TEST_SUPABASE_ORIGIN = "https://portfolio-test.supabase.co";
const LEGACY_ICON_PREFIX = `/${"road"}${"map"}`;

jest.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

jest.mock("@/lib/backend/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

function createJourneyQuery(data: unknown, error: unknown = null) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockResolvedValue({ data, error });
  return query;
}

function mockJourneyQuery(data: unknown, error: unknown = null) {
  const query = createJourneyQuery(data, error);
  (supabase.from as jest.Mock).mockReturnValue(query);
  return query;
}

describe("/api/journey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = TEST_SUPABASE_ORIGIN;
    process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_SUPABASE_ORIGIN;
  });

  it("maps and chronologically sorts the six-row journey with its shared cache policy", async () => {
    const rows = [
      {
        id: "education",
        title: "edu: M.Sc. Software Engineering",
        details: null,
        start_date: "2026-08-01",
        end_date: "2028-06-30",
        icon_bucket: "journey",
        icon_path: `${TEST_SUPABASE_ORIGIN}/storage/v1/object/public/journey/bth.svg`,
        icon_alt: "BTH",
      },
      {
        id: "internship",
        title: "feat: Full-Stack Developer Intern (TeamTemp)",
        details: "Built a cross-platform survey app.",
        start_date: "2026-01-01",
        end_date: "2026-05-31",
        icon_bucket: "journey",
        icon_path: "softhouse.svg",
        icon_alt: "Softhouse",
      },
    ];
    const query = mockJourneyQuery(rows);
    const getPublicUrl = jest.fn((path: string) => ({
      data: { publicUrl: `https://storage.example.com/${path}` },
    }));
    (supabase.storage.from as jest.Mock).mockReturnValue({ getPublicUrl });

    const response = await GET(new Request("http://localhost/api/journey"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=7200, s-maxage=7200, stale-while-revalidate=7200",
    );
    await expect(response.json()).resolves.toEqual([
      {
        id: "internship",
        title: "feat: Full-Stack Developer Intern (TeamTemp)",
        description: "Built a cross-platform survey app.",
        icon: "https://storage.example.com/softhouse.svg",
        from: "2026-01-01",
        to: "2026-05-31",
        topic: "Softhouse",
        brand: null,
        mono: false,
      },
      {
        id: "education",
        title: "edu: M.Sc. Software Engineering",
        description: "",
        icon: `${TEST_SUPABASE_ORIGIN}/storage/v1/object/public/journey/bth.svg`,
        from: "2026-08-01",
        to: "2028-06-30",
        topic: "BTH",
        brand: null,
        mono: false,
      },
    ]);
    expect(supabase.from).toHaveBeenCalledWith("journey_item");
    expect(query.select).toHaveBeenCalledWith(
      "id,title,details,start_date,end_date,icon_bucket,icon_path,icon_alt",
    );
    expect(query.order).toHaveBeenCalledWith("start_date", { ascending: false });
    expect(query.eq).toHaveBeenCalledWith("is_active", true);
    expect(query.limit).toHaveBeenCalledWith(6);
    expect(supabase.storage.from).toHaveBeenCalledWith("journey");
    expect(getPublicUrl).toHaveBeenCalledWith("softhouse.svg");
  });

  it("returns the existing database error response", async () => {
    mockJourneyQuery(null, { message: "database unavailable" });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(new Request("http://localhost/api/journey"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db" });
    expect(consoleError).toHaveBeenCalledWith(
      "[/api/journey] db error:",
      { message: "database unavailable" },
    );
    consoleError.mockRestore();
  });

  it("maps legacy local logo paths to the Journey assets", async () => {
    mockJourneyQuery([
      {
        id: "bth",
        title: "B.Sc. Software Engineering – BTH",
        details: "Degree",
        start_date: "2023-08-28",
        end_date: "2026-06-15",
        icon_bucket: null,
        icon_path: `${LEGACY_ICON_PREFIX}/bth-logo.png`,
        icon_alt: "BTH",
      },
      {
        id: "softhouse",
        title: "Full-Stack Developer Intern – Softhouse",
        details: "Internship",
        start_date: "2025-01-13",
        end_date: "2025-05-31",
        icon_bucket: null,
        icon_path: `${LEGACY_ICON_PREFIX}/softhouse.png`,
        icon_alt: "Softhouse",
      },
    ]);

    const response = await GET(new Request("http://localhost/api/journey"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.map((item: { icon: string }) => item.icon)).toEqual([
      "/journey/bth-logo.webp",
      "/journey/softhouse.webp",
    ]);
  });

  it("reads the existing deployment while the Journey schema migration rolls out", async () => {
    const missingJourneyTable = createJourneyQuery(null, { code: "PGRST205" });
    const existingRows = createJourneyQuery([
      {
        id: "bth",
        title: "B.Sc. Software Engineering – BTH",
        details: "Degree",
        start_date: "2023-08-28",
        end_date: "2026-06-15",
        icon_bucket: null,
        icon_path: `${LEGACY_ICON_PREFIX}/bth-logo.png`,
        icon_alt: "BTH",
      },
    ]);
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(missingJourneyTable)
      .mockReturnValueOnce(existingRows);

    const response = await GET(new Request("http://localhost/api/journey"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body[0].icon).toBe("/journey/bth-logo.webp");
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect((supabase.from as jest.Mock).mock.calls[0][0]).toBe("journey_item");
    expect((supabase.from as jest.Mock).mock.calls[1][0]).toBe(
      `${"road"}${"map"}_item`,
    );
  });
});
