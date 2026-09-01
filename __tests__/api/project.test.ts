/**
 * @jest-environment node
 */

import { GET } from "@/app/api/project/route";
import { supabase } from "@/lib/backend/supabaseClient";

jest.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

jest.mock("@/lib/backend/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function mockProjectQuery(data: unknown, error: unknown = null) {
  const query = {
    eq: jest.fn(),
    order: jest.fn(),
    ilike: jest.fn(),
    then: (resolve: (value: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve({ data, error }).then(resolve),
  };
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.ilike.mockReturnValue(query);

  const select = jest.fn().mockReturnValue(query);
  (supabase.from as jest.Mock).mockReturnValue({ select });
  return { query, select };
}

describe("/api/project", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("preserves the sorted response shape and adds its 30-minute shared cache policy", async () => {
    const projects = [
      {
        id: "first",
        title: "First",
        description: null,
        category: null,
        github_url: null,
        visibility: "public",
        languages: null,
        cover_image_href: null,
      },
      {
        id: "second",
        title: "Second",
        description: "Kept in database order",
        category: "Full-Stack",
        github_url: "https://github.com/Mouaz7/second",
        visibility: "public",
        languages: ["TypeScript"],
        cover_image_href: "/images/second.png",
      },
    ];
    const { query, select } = mockProjectQuery(projects);

    const response = await GET(new Request("http://localhost/api/project?category=Full-Stack"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=1800, s-maxage=1800, stale-while-revalidate=1800",
    );
    await expect(response.json()).resolves.toEqual([
      {
        id: "first",
        title: "First",
        description: "",
        category: "Build",
        github_url: "http://localhost:3000",
        languages: [],
        visibility: "public",
      },
      {
        id: "second",
        title: "Second",
        description: "Kept in database order",
        category: "Full-Stack",
        github_url: "https://github.com/Mouaz7/second",
        languages: ["TypeScript"],
        cover_image_url: "/images/second.png",
        visibility: "public",
      },
    ]);
    expect(supabase.from).toHaveBeenCalledWith("project");
    expect(select).toHaveBeenCalled();
    expect(query.ilike).toHaveBeenCalledWith("category", "Full-Stack");
    expect(query.order).toHaveBeenNthCalledWith(1, "sort_order", { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, "created_at", { ascending: false });
  });

  it("keeps the previous database error response", async () => {
    mockProjectQuery(null, { message: "database unavailable" });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(new Request("http://localhost/api/project"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db" });
    consoleError.mockRestore();
  });
});
