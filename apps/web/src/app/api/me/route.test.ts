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

const apiUser = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    role: "user",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
};

function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/me", {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

describe("GET /api/me", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("requires auth and returns mapped user", async () => {
        mocks.requireAuth.mockResolvedValue("token-abc");
        mocks.internalApiGet.mockResolvedValue(apiUser);

        const res = await GET();
        expect(res.status).toBe(200);
        expect(mocks.internalApiGet).toHaveBeenCalledWith(
            "/me",
            expect.anything(),
            { headers: { Authorization: "Bearer token-abc" } }
        );
        const body = await res.json();
        expect(body).toMatchObject({ id: "1", username: "testuser", email: "test@example.com" });
    });

    it("returns 401 when requireAuth throws 401", async () => {
        mocks.requireAuth.mockRejectedValue(new HttpError("Unauthorized", 401));
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("returns 404 when user not found", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiGet.mockRejectedValue(new HttpError("User not found", 404));
        const res = await GET();
        expect(res.status).toBe(404);
    });

    it("returns 500 on unexpected error", async () => {
        mocks.requireAuth.mockRejectedValue(new Error("boom"));
        const res = await GET();
        expect(res.status).toBe(500);
    });
});

describe("PUT /api/me", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("validates input and forwards to Go", async () => {
        mocks.requireAuth.mockResolvedValue("token-abc");
        mocks.internalApiPut.mockResolvedValue({ ...apiUser, username: "newusername" });

        const res = await PUT(makeRequest({ username: "newusername" }) as never);
        expect(res.status).toBe(200);
        expect(mocks.internalApiPut).toHaveBeenCalledWith(
            "/me",
            expect.anything(),
            { username: "newusername" },
            { headers: { Authorization: "Bearer token-abc" } }
        );
    });

    it("returns 422 on invalid body", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        const res = await PUT(makeRequest({ username: "ab" }) as never);
        expect(res.status).toBe(422);
    });

    it("returns 409 when email already exists", async () => {
        mocks.requireAuth.mockResolvedValue("t");
        mocks.internalApiPut.mockRejectedValue(new HttpError("Email already exists", 409));
        const res = await PUT(makeRequest({ email: "taken@example.com" }) as never);
        expect(res.status).toBe(409);
    });

    it("returns 401 on auth failure", async () => {
        mocks.requireAuth.mockRejectedValue(new HttpError("Unauthorized", 401));
        const res = await PUT(makeRequest({ username: "newusername" }) as never);
        expect(res.status).toBe(401);
    });
});

describe("DELETE /api/me", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 204 on success", async () => {
        mocks.requireAuth.mockResolvedValue("token-abc");
        mocks.internalApiDelete.mockResolvedValue(undefined);
        const res = await DELETE();
        expect(res.status).toBe(204);
        expect(mocks.internalApiDelete).toHaveBeenCalledWith(
            "/me",
            expect.anything(),
            { headers: { Authorization: "Bearer token-abc" } }
        );
    });

    it("returns 401 on auth failure", async () => {
        mocks.requireAuth.mockRejectedValue(new HttpError("Unauthorized", 401));
        const res = await DELETE();
        expect(res.status).toBe(401);
    });
});
