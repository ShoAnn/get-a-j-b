import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fetchMock = vi.fn();

function mockResponse(status: number, body: unknown = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn().mockResolvedValue(body),
        headers: { get: () => null },
    } as unknown as Response;
}

describe("internalApiClient", () => {
    let originalFetch: typeof globalThis.fetch;
    let originalApiUrl: string | undefined;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        originalApiUrl = process.env.API_URL;
        globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
        fetchMock.mockReset();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        if (originalApiUrl === undefined) delete process.env.API_URL;
        else process.env.API_URL = originalApiUrl;
    });

    async function loadClient() {
        vi.resetModules();
        const mod = await import("./api");
        return mod.internalApiClient;
    }

    it("builds URL from API_URL + /api + path", async () => {
        process.env.API_URL = "http://api:8080";
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        fetchMock.mockResolvedValue(mockResponse(200, { ok: true }));
        await internalApiClient.get("/jobs", z.any());
        expect(fetchMock).toHaveBeenCalledWith(
            "http://api:8080/api/jobs",
            expect.any(Object)
        );
    });

    it("documents current behavior when API_URL is undefined", async () => {
        delete process.env.API_URL;
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        fetchMock.mockResolvedValue(mockResponse(200, {}));
        await internalApiClient.get("/jobs", z.any());
        const calledWith = fetchMock.mock.calls[0][0];
        expect(calledWith.endsWith("/api/jobs")).toBe(true);
    });

    it("sends Content-Type when body present", async () => {
        process.env.API_URL = "http://x:1";
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        fetchMock.mockResolvedValue(mockResponse(200, {}));
        await internalApiClient.post("/jobs", z.any(), { a: 1 });
        const init = fetchMock.mock.calls[0][1];
        expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("throws HttpError on non-ok response", async () => {
        process.env.API_URL = "http://x:1";
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        const { HttpError } = await import("@/types/errors");
        fetchMock.mockResolvedValue(mockResponse(401, { message: "no" }));
        await expect(internalApiClient.get("/jobs", z.any())).rejects.toBeInstanceOf(HttpError);
    });

    it("uses GET method", async () => {
        process.env.API_URL = "http://x:1";
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        fetchMock.mockResolvedValue(mockResponse(200, {}));
        await internalApiClient.get("/jobs", z.any());
        expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    });

    it("uses PUT method with body", async () => {
        process.env.API_URL = "http://x:1";
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        fetchMock.mockResolvedValue(mockResponse(200, {}));
        await internalApiClient.put("/jobs/1", z.any(), { title: "x" });
        const init = fetchMock.mock.calls[0][1];
        expect(init.method).toBe("PUT");
        expect(init.body).toBe(JSON.stringify({ title: "x" }));
    });

    it("uses DELETE method", async () => {
        process.env.API_URL = "http://x:1";
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        fetchMock.mockResolvedValue(mockResponse(200, {}));
        await internalApiClient.delete("/jobs/1", z.any());
        expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    });

    it("omits Content-Type when no body", async () => {
        process.env.API_URL = "http://x:1";
        const internalApiClient = await loadClient();
        const { z } = await import("zod");
        fetchMock.mockResolvedValue(mockResponse(200, {}));
        await internalApiClient.get("/jobs", z.any());
        expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
    });
});