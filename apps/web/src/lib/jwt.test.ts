import { describe, it, expect } from "vitest";
import { isJwtExpired, getJwtExpiry } from "./jwt";

function makeJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = "signature";
    return `${header}.${body}.${signature}`;
}

describe("getJwtExpiry", () => {
    it("returns exp in seconds from a valid token", () => {
        const exp = 1_700_000_000;
        const token = makeJwt({ exp });
        expect(getJwtExpiry(token)).toBe(exp);
    });

    it("returns null for malformed token", () => {
        expect(getJwtExpiry("not-a-token")).toBeNull();
    });

    it("returns null when payload has no exp", () => {
        const token = makeJwt({ sub: "1" });
        expect(getJwtExpiry(token)).toBeNull();
    });
});

describe("isJwtExpired", () => {
    it("returns true for past exp", () => {
        const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
        expect(isJwtExpired(token)).toBe(true);
    });

    it("returns false for future exp", () => {
        const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
        expect(isJwtExpired(token)).toBe(false);
    });

    it("returns true for malformed token", () => {
        expect(isJwtExpired("garbage")).toBe(true);
    });

    it("treats token with no exp as expired", () => {
        const token = makeJwt({ sub: "1" });
        expect(isJwtExpired(token)).toBe(true);
    });
});