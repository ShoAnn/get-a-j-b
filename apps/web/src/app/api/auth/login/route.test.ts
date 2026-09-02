import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    requireAuth: vi.fn(),
    internalApiPost: vi.fn(),
    setAuthCookies: vi.fn(),
    cookieStore: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("@/lib/requireAuth", () => ({
    requireAuth: mocks.requireAuth,
}));
vi.mock("@/lib/server/api", () => ({
    internalApiClient: {
        post: mocks.internalApiPost,
    },
}));
vi.mock("@/lib/setAuthCookies", () => ({
    setAuthCookies: mocks.setAuthCookies,
}));
vi.mock("next/headers", () => ({
    cookies: vi.fn(() => Promise.resolve(mocks.cookieStore)),
}));

import { POST } from "./route";
import { HttpError } from "@/types/errors";

function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

describe("POST /api/auth/login", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 204 on success and sets cookies", async () => {
        mocks.internalApiPost.mockResolvedValue({
            access_token: "a",
            refresh_token: "r",
            expires_in: "900",
        });

        const res = await POST(makeRequest({ email: "user@test.com", password: "password123" }) as never);
        expect(res.status).toBe(204);
        expect(mocks.internalApiPost).toHaveBeenCalledWith(
            "/auth/login",
            expect.anything(),
            { email: "user@test.com", password: "password123" }
        );
        expect(mocks.setAuthCookies).toHaveBeenCalledWith("a", "r", "900");
    });

    it("returns 422 with friendly error on ZodError validation failure", async () => {
        const res = await POST(makeRequest({ email: "not-an-email", password: "x" }) as never);
        expect(res.status).toBe(422);
        const body = await res.json();
        expect(body.error).toMatch(/check your email and password/i);
        expect(body.fields).toBeDefined();
    });

    it("returns 401 with friendly error when internal API returns 401", async () => {
        mocks.internalApiPost.mockRejectedValue(new HttpError("Invalid credentials", 401));

        const res = await POST(makeRequest({ email: "user@test.com", password: "wrong" }) as never);
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toMatch(/incorrect email or password/i);
    });

    it("returns 502 with friendly error on upstream 5xx", async () => {
        mocks.internalApiPost.mockRejectedValue(new HttpError("Server error", 503));

        const res = await POST(makeRequest({ email: "user@test.com", password: "password123" }) as never);
        expect(res.status).toBe(502);
        const body = await res.json();
        expect(body.error).toMatch(/server is having trouble/i);
    });

    it("returns 500 with friendly error on unexpected error", async () => {
        mocks.internalApiPost.mockRejectedValue(new Error("boom"));

        const res = await POST(makeRequest({ email: "user@test.com", password: "password123" }) as never);
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/something went wrong/i);
    });
});