import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    requireAuth: vi.fn(),
    internalApiGet: vi.fn(),
    internalApiPut: vi.fn(),
    internalApiDelete: vi.fn(),
}));

vi.mock("@/lib/requireAuth", () => ({
    requireAuth: mocks.requireAuth,
}));
vi.mock("@/lib/server/api", () => ({
    internalApiClient: {
        get: mocks.internalApiGet,
        put: mocks.internalApiPut,
        delete: mocks.internalApiDelete,
    },
}));

import { GET, PUT, DELETE } from "./route";
import { HttpError } from "@/types/errors";

function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/jobs/1", {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

const context = { params: Promise.resolve({ id: "1" }) };

describe("GET /api/jobs/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 200 and forwards to Go with id", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiGet.mockResolvedValue({ id: "1", title: "Engineer" });

        const res = await GET({} as never, context);
        expect(res.status).toBe(200);
        expect(mocks.internalApiGet).toHaveBeenCalledWith(
            "/jobs/1",
            expect.anything(),
            { headers: { Authorization: "Bearer t" } }
        );
    });

    it("returns 404 on HttpError 404", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiGet.mockRejectedValue(new HttpError("Not found", 404));

        const res = await GET({} as never, context);
        expect(res.status).toBe(404);
    });

    it("returns 401 on auth failure", async () => {
        mocks.requireAuth.mockRejectedValue(new HttpError("Unauthorized", 401));

        const res = await GET({} as never, context);
        expect(res.status).toBe(401);
    });

    it("returns 500 on unexpected error", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiGet.mockRejectedValue(new Error("boom"));

        const res = await GET({} as never, context);
        expect(res.status).toBe(500);
    });
});

describe("PUT /api/jobs/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("forwards full update with bearer token", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiPut.mockResolvedValue({ id: "1", title: "new" });

        const body = {
            title: "new",
            company: "Co",
            location: "Remote",
            salary: 100000,
            requirements: "x",
        };
        const res = await PUT(makeRequest(body) as never, context);
        expect(res.status).toBe(200);
        expect(mocks.internalApiPut).toHaveBeenCalledWith(
            "/jobs/1",
            expect.anything(),
            expect.objectContaining(body),
            { headers: { Authorization: "Bearer t" } }
        );
    });

    it("returns 422 on invalid body", async () => {
        mocks.requireAuth.mockResolvedValue("t");

        const res = await PUT(makeRequest({ salary: "not-a-number" }) as never, context);
        expect(res.status).toBe(422);
    });

    it("returns 400 on bad request from Go", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiPut.mockRejectedValue(new HttpError("bad", 400));

        const res = await PUT(makeRequest({
            title: "new",
            company: "Co",
            location: "Remote",
            salary: 100000,
            requirements: "x",
        }) as never, context);
        expect(res.status).toBe(400);
    });
});

describe("DELETE /api/jobs/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("forwards delete with bearer token", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiDelete.mockResolvedValue(undefined);

        const res = await DELETE({} as never, context);
        expect(res.status).toBe(204);
        expect(mocks.internalApiDelete).toHaveBeenCalledWith(
            "/jobs/1",
            expect.anything(),
            { headers: { Authorization: "Bearer t" } }
        );
    });

    it("returns 404 on HttpError 404", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiDelete.mockRejectedValue(new HttpError("Not found", 404));

        const res = await DELETE({} as never, context);
        expect(res.status).toBe(404);
    });
});