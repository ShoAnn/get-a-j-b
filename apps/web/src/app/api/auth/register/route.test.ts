import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    internalApiPost: vi.fn(),
    setAuthCookies: vi.fn(),
    cookieStore: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    },
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
    return new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

describe("POST /api/auth/register", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 204 on success, sets cookies, and forwards only email/password/username", async () => {
        mocks.internalApiPost.mockResolvedValue({
            access_token: "a",
            refresh_token: "r",
            expires_in: "900",
        });

        const res = await POST(makeRequest({
            email: "u@test.com",
            username: "username",
            password: "password123",
            confirmPassword: "password123",
            role: "admin",
        }) as never);
        expect(res.status).toBe(204);
        expect(mocks.internalApiPost).toHaveBeenCalledWith(
            "/auth/register",
            expect.anything(),
            { email: "u@test.com", password: "password123", username: "username" }
        );
        expect(mocks.setAuthCookies).toHaveBeenCalledWith("a", "r", "900");
    });

    it("returns 422 with Zod fields when validation fails", async () => {
        const res = await POST(makeRequest({ email: "bad", password: "x", username: "" }) as never);
        expect(res.status).toBe(422);
        const body = await res.json();
        expect(body.error).toBe("Validation failed");
        expect(body.fields).toBeDefined();
    });

    const validBody = {
        email: "u@test.com",
        username: "user1",
        password: "password123",
        confirmPassword: "password123",
    };

    it("returns 400 on bad request from Go", async () => {
        mocks.internalApiPost.mockRejectedValue(new HttpError("bad", 400));

        const res = await POST(makeRequest(validBody) as never);
        expect(res.status).toBe(400);
    });

    it("returns 409 on conflict", async () => {
        mocks.internalApiPost.mockRejectedValue(new HttpError("conflict", 409));

        const res = await POST(makeRequest(validBody) as never);
        expect(res.status).toBe(409);
    });

    it("returns 500 on unexpected error", async () => {
        mocks.internalApiPost.mockRejectedValue(new Error("boom"));

        const res = await POST(makeRequest(validBody) as never);
        expect(res.status).toBe(500);
    });
});