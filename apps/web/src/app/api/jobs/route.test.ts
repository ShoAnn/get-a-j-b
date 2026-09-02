import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    requireAuth: vi.fn(),
    internalApiGet: vi.fn(),
    internalApiPost: vi.fn(),
}));

vi.mock("@/lib/requireAuth", () => ({
    requireAuth: mocks.requireAuth,
}));
vi.mock("@/lib/server/api", () => ({
    internalApiClient: {
        get: mocks.internalApiGet,
        post: mocks.internalApiPost,
    },
}));

import { GET, POST } from "./route";
import { HttpError } from "@/types/errors";

function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

describe("GET /api/jobs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("requires auth and forwards with bearer token", async () => {
        mocks.requireAuth.mockResolvedValue("token-abc");
        mocks.internalApiGet.mockResolvedValue([
            {
                id: 1,
                user_id: 1,
                title: "Engineer",
                company: "Acme",
                location: "Remote",
                salary: 100000,
                current_status: "draft",
                created_at: "2026-09-02T00:00:00Z",
            },
        ]);

        const res = await GET();
        expect(res.status).toBe(200);
        expect(mocks.requireAuth).toHaveBeenCalled();
        expect(mocks.internalApiGet).toHaveBeenCalledWith(
            "/jobs",
            expect.anything(),
            { headers: { Authorization: "Bearer token-abc" } }
        );
    });

    it("returns 401 when requireAuth throws HttpError 401", async () => {
        mocks.requireAuth.mockRejectedValue(new HttpError("Unauthorized", 401));

        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("returns 403 when requireAuth throws HttpError 403", async () => {
        mocks.requireAuth.mockRejectedValue(new HttpError("Forbidden", 403));

        const res = await GET();
        expect(res.status).toBe(403);
    });

    it("returns 422 on ZodError from server", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        const { z } = await import("zod");
        const badSchema = z.object({ id: z.string() });
        mocks.internalApiGet.mockImplementation(async () => {
            badSchema.parse({ id: 1 });
            return [];
        });

        const res = await GET();
        expect(res.status).toBe(422);
    });

    it("returns 500 on unexpected error", async () => {
        mocks.requireAuth.mockRejectedValue(new Error("boom"));

        const res = await GET();
        expect(res.status).toBe(500);
    });
});

describe("POST /api/jobs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("forwards body to Go with bearer token and returns 200", async () => {
        mocks.requireAuth.mockResolvedValue("token-abc");
        mocks.internalApiPost.mockResolvedValue({
            id: 1,
            user_id: 1,
            title: "Engineer",
            company: "Co",
            location: "Remote",
            salary: 100000,
            requirements: "x",
            current_status: "draft",
            created_at: "2026-09-02T00:00:00Z",
        });

        const body = {
            title: "Engineer",
            company: "Co",
            location: "Remote",
            salary: 100000,
            requirements: "x",
            status: "draft",
        };
        const res = await POST(makeRequest(body) as never);
        expect(res.status).toBe(200);
        expect(mocks.internalApiPost).toHaveBeenCalledWith(
            "/jobs",
            expect.anything(),
            expect.objectContaining({
                title: "Engineer",
                company: "Co",
                location: "Remote",
                salary: 100000,
                requirements: "x",
                current_status: "draft",
            }),
            { headers: { Authorization: "Bearer token-abc" } }
        );
    });

    it("returns 422 on invalid body", async () => {
        mocks.requireAuth.mockResolvedValue("t");

        const res = await POST(makeRequest({}) as never);
        expect(res.status).toBe(422);
    });

    it("returns 401 on auth failure", async () => {
        mocks.requireAuth.mockRejectedValue(new HttpError("Unauthorized", 401));

        const res = await POST(makeRequest({ title: "x" }) as never);
        expect(res.status).toBe(401);
    });

    it("returns 500 on unexpected error", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiPost.mockRejectedValue(new Error("boom"));

        const res = await POST(makeRequest({
            title: "Engineer",
            company: "Co",
            location: "Remote",
            salary: 100000,
            requirements: "x",
            status: "draft",
        }) as never);
        expect(res.status).toBe(500);
    });
});
