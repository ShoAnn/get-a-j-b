import { defineConfig, devices } from "@playwright/test";
import path from "path";

const API_URL = process.env.API_URL ?? "http://localhost:8080";
// Use 3001 for e2e so we don't collide with the docker web on 3000.
// That docker container has NEXT_PUBLIC_MSW=enabled and would mask the real
// Go API. The e2e dev server is started with NEXT_PUBLIC_MSW="" to hit the
// real backend.
const WEB_PORT = process.env.E2E_PORT ?? "3001";
const WEB_URL = process.env.WEB_URL ?? `http://localhost:${WEB_PORT}`;

export default defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    expect: { timeout: 8_000 },
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: WEB_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: `npm run dev -- --port ${WEB_PORT}`,
        url: WEB_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        cwd: path.resolve(__dirname),
        env: {
            ...process.env,
            PORT: WEB_PORT,
            API_URL: API_URL,
            NEXT_PUBLIC_API_URL: API_URL,
            NEXT_PUBLIC_MSW: "",
            NODE_ENV: "development",
        },
    },
});
