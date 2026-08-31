import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fetchMock = vi.fn();

function mockResponse(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn().mockResolvedValue(body),
        headers: {
            get: (name: string) => headers[name.toLowerCase()] ?? null,
        },
    } as unknown as Response;
}

import { apiClient } from "./api";
import { HttpError } from "@/types/errors";
import { z } from "zod";

describe("apiClient", () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
        fetchMock.mockReset();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe("URL construction", () => {
        it("prepends /api to the path", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, { ok: true }));
            await apiClient.get("/jobs", z.any());
            expect(fetchMock).toHaveBeenCalledWith(
                "/api/jobs",
                expect.any(Object)
            );
        });
    });

    describe("request options", () => {
        it("uses GET method for get", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, {}));
            await apiClient.get("/jobs", z.any());
            const init = fetchMock.mock.calls[0][1];
            expect(init.method).toBe("GET");
        });

        it("uses POST method and serializes body", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, {}));
            await apiClient.post("/jobs", z.any(), { title: "x" });
            const init = fetchMock.mock.calls[0][1];
            expect(init.method).toBe("POST");
            expect(init.body).toBe(JSON.stringify({ title: "x" }));
        });

        it("uses PUT method", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, {}));
            await apiClient.put("/jobs/1", z.any(), { title: "y" });
            const init = fetchMock.mock.calls[0][1];
            expect(init.method).toBe("PUT");
        });

        it("uses DELETE method", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, {}));
            await apiClient.delete("/jobs/1", z.any());
            const init = fetchMock.mock.calls[0][1];
            expect(init.method).toBe("DELETE");
        });

        it("adds Content-Type when body is present", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, {}));
            await apiClient.post("/jobs", z.any(), { x: 1 });
            const init = fetchMock.mock.calls[0][1];
            expect(init.headers["Content-Type"]).toBe("application/json");
        });

        it("omits Content-Type when no body", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, {}));
            await apiClient.get("/jobs", z.any());
            const init = fetchMock.mock.calls[0][1];
            expect(init.headers["Content-Type"]).toBeUndefined();
        });

        it("always sends credentials: include", async () => {
            fetchMock.mockResolvedValue(mockResponse(200, {}));
            await apiClient.get("/jobs", z.any());
            const init = fetchMock.mock.calls[0][1];
            expect(init.credentials).toBe("include");
        });
    });

    describe("response handling", () => {
        it("throws HttpError with statusCode on non-ok response", async () => {
            fetchMock.mockResolvedValue(mockResponse(401, { message: "Unauthorized" }));
            await expect(apiClient.get("/jobs", z.any())).rejects.toBeInstanceOf(HttpError);
        });

        it("uses server message field when present", async () => {
            fetchMock.mockResolvedValue(mockResponse(500, { message: "boom" }));
            await expect(apiClient.get("/jobs", z.any())).rejects.toThrow(/^boom$/);
        });

        it("falls back to error field when message is absent", async () => {
            fetchMock.mockResolvedValue(mockResponse(400, { error: "bad input" }));
            await expect(apiClient.get("/jobs", z.any())).rejects.toThrow(/^bad input$/);
        });

        it("falls back to status text when no message body", async () => {
            fetchMock.mockResolvedValue(mockResponse(502, {}));
            await expect(apiClient.get("/jobs", z.any())).rejects.toThrow(/status 502/);
        });

        it("returns parsed data on success", async () => {
            const schema = z.object({ id: z.string(), title: z.string() });
            fetchMock.mockResolvedValue(mockResponse(200, { id: "1", title: "Engineer" }));
            const data = await apiClient.get("/jobs/1", schema);
            expect(data).toEqual({ id: "1", title: "Engineer" });
        });

        it("parses void response when content-length is 0", async () => {
            fetchMock.mockResolvedValue(mockResponse(204, {}, { "content-length": "0" }));
            await expect(apiClient.delete("/jobs/1", z.void())).resolves.toBeUndefined();
        });
    });
});