import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    cookieStoreMock: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    },
    mockPost: vi.fn(),
    mockSetAuthCookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
    cookies: vi.fn(() => Promise.resolve(mocks.cookieStoreMock)),
}));

vi.mock("./server/api", () => ({
    internalApiClient: {
        post: mocks.mockPost,
    },
}));
vi.mock("./setAuthCookies", () => ({
    setAuthCookies: mocks.mockSetAuthCookies,
}));

import { refresh } from "./refresh";
import { HttpError } from "@/types/errors";

describe("refresh", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns false when no refresh_token cookie", async () => {
        mocks.cookieStoreMock.get.mockReturnValue(undefined);
        const result = await refresh();
        expect(result).toBe(false);
        expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it("returns true and sets new cookies on successful refresh", async () => {
        mocks.cookieStoreMock.get.mockReturnValue({ value: "old-refresh" });
        mocks.mockPost.mockResolvedValue({
            access_token: "new-access",
            refresh_token: "new-refresh",
            expires_in: "86400",
        });

        const ok = await refresh();
        expect(ok).toBe(true);
        expect(mocks.mockPost).toHaveBeenCalledWith(
            "/auth/refresh",
            expect.anything(),
            { token: "old-refresh" }
        );
        expect(mocks.mockSetAuthCookies).toHaveBeenCalledWith("new-access", "new-refresh", "86400");
    });

    it("returns false when API throws HttpError", async () => {
        mocks.cookieStoreMock.get.mockReturnValue({ value: "old-refresh" });
        mocks.mockPost.mockRejectedValue(new HttpError("Invalid refresh token", 401));

        const ok = await refresh();
        expect(ok).toBe(false);
        expect(mocks.mockSetAuthCookies).not.toHaveBeenCalled();
    });

    it("returns false on unexpected errors", async () => {
        mocks.cookieStoreMock.get.mockReturnValue({ value: "old-refresh" });
        mocks.mockPost.mockRejectedValue(new Error("network"));

        const ok = await refresh();
        expect(ok).toBe(false);
    });
});