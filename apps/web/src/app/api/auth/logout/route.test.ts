import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    internalApiPost: vi.fn(),
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
vi.mock("next/headers", () => ({
    cookies: vi.fn(() => Promise.resolve(mocks.cookieStore)),
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("forwards to /auth/logout with refresh_token bearer and clears cookies", async () => {
        mocks.cookieStore.get.mockReturnValue({ value: "refresh-xyz" });
        mocks.internalApiPost.mockResolvedValue(undefined);

        const res = await POST();
        expect(res.status).toBe(204);
        expect(mocks.internalApiPost).toHaveBeenCalledWith(
            "/auth/logout",
            expect.anything(),
            expect.objectContaining({
                headers: { Authorization: "Bearer refresh-xyz" },
            })
        );
        expect(mocks.cookieStore.delete).toHaveBeenCalledWith("access_token");
        expect(mocks.cookieStore.delete).toHaveBeenCalledWith("refresh_token");
    });

    it("returns 204 without calling upstream when no refresh_token cookie", async () => {
        mocks.cookieStore.get.mockReturnValue(undefined);

        const res = await POST();
        expect(res.status).toBe(204);
        expect(mocks.internalApiPost).not.toHaveBeenCalled();
        expect(mocks.cookieStore.delete).toHaveBeenCalledWith("access_token");
        expect(mocks.cookieStore.delete).toHaveBeenCalledWith("refresh_token");
    });

    it("still returns 204 (and clears cookies) when upstream returns 401", async () => {
        mocks.cookieStore.get.mockReturnValue({ value: "r" });
        const { HttpError } = await import("@/types/errors");
        mocks.internalApiPost.mockRejectedValue(new HttpError("expired", 401));

        const res = await POST();
        expect(res.status).toBe(204);
        expect(mocks.cookieStore.delete).toHaveBeenCalledWith("access_token");
    });

    it("still returns 204 when upstream throws an unexpected error", async () => {
        mocks.cookieStore.get.mockReturnValue({ value: "r" });
        mocks.internalApiPost.mockRejectedValue(new Error("boom"));

        const res = await POST();
        expect(res.status).toBe(204);
        expect(mocks.cookieStore.delete).toHaveBeenCalledWith("refresh_token");
    });
});