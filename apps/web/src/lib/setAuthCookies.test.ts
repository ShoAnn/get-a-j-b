import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSet = vi.fn();
const mockDelete = vi.fn();
const cookiesStoreMock = {
    set: mockSet,
    delete: mockDelete,
};

vi.mock("next/headers", () => ({
    cookies: vi.fn(() => Promise.resolve(cookiesStoreMock)),
}));

import { setAuthCookies } from "./setAuthCookies";

describe("setAuthCookies", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("sets access_token cookie with parsed maxAge", async () => {
        await setAuthCookies("access-abc", "refresh-xyz", "86400");
        expect(mockSet).toHaveBeenCalledWith(
            "access_token",
            "access-abc",
            expect.objectContaining({
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                maxAge: 86400,
            })
        );
    });

    it("sets refresh_token cookie without maxAge", async () => {
        await setAuthCookies("access-abc", "refresh-xyz", "86400");
        expect(mockSet).toHaveBeenCalledWith(
            "refresh_token",
            "refresh-xyz",
            expect.objectContaining({
                httpOnly: true,
                sameSite: "lax",
                path: "/",
            })
        );
    });

    it("enables secure flag in production", async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        await setAuthCookies("a", "r", "60");
        expect(mockSet).toHaveBeenCalledWith(
            "access_token",
            "a",
            expect.objectContaining({ secure: true })
        );
        process.env.NODE_ENV = originalEnv;
    });

    it("disables secure flag in non-production", async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";
        await setAuthCookies("a", "r", "60");
        expect(mockSet).toHaveBeenCalledWith(
            "access_token",
            "a",
            expect.objectContaining({ secure: false })
        );
        process.env.NODE_ENV = originalEnv;
    });
});