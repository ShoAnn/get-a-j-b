import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    cookieStoreMock: {
        get: vi.fn(),
    },
    mockRefresh: vi.fn(),
}));

vi.mock("next/headers", () => ({
    cookies: vi.fn(() => Promise.resolve(mocks.cookieStoreMock)),
}));

vi.mock("./refresh", () => ({
    refresh: mocks.mockRefresh,
}));

import { requireAuth } from "./requireAuth";
import { HttpError } from "@/types/errors";

function makeJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.sig`;
}

describe("requireAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns access_token when valid", async () => {
        const valid = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
        mocks.cookieStoreMock.get.mockReturnValue({ value: valid });
        const token = await requireAuth();
        expect(token).toBe(valid);
        expect(mocks.mockRefresh).not.toHaveBeenCalled();
    });

    it("refreshes when token is expired", async () => {
        const expired = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
        mocks.cookieStoreMock.get.mockReturnValueOnce({ value: expired });
        mocks.cookieStoreMock.get.mockReturnValueOnce({ value: "new-token" });
        mocks.mockRefresh.mockResolvedValue(true);

        const token = await requireAuth();
        expect(mocks.mockRefresh).toHaveBeenCalled();
        expect(token).toBe("new-token");
    });

    it("refreshes when token missing", async () => {
        mocks.cookieStoreMock.get.mockReturnValueOnce(undefined);
        mocks.cookieStoreMock.get.mockReturnValueOnce({ value: "new-token" });
        mocks.mockRefresh.mockResolvedValue(true);

        const token = await requireAuth();
        expect(mocks.mockRefresh).toHaveBeenCalled();
        expect(token).toBe("new-token");
    });

    it("throws HttpError(401) when refresh fails", async () => {
        mocks.cookieStoreMock.get.mockReturnValue(undefined);
        mocks.mockRefresh.mockResolvedValue(false);

        await expect(requireAuth()).rejects.toBeInstanceOf(HttpError);
    });
});