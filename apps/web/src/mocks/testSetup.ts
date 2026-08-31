import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";
import { resetMockJobs } from "./handlers";

beforeAll(() => {
    server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
    server.resetHandlers();
    resetMockJobs();
});

afterAll(() => {
    server.close();
});
