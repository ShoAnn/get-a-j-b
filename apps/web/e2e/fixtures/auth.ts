import type { Page } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export interface TestCredentials {
    username: string;
    email: string;
    password: string;
    access_token: string;
    refresh_token: string;
}

/**
 * Registers a fresh user via the real Go API and sets auth cookies on the
 * Playwright browser context so that Next.js `requireAuth()` succeeds without
 * driving the /login UI.
 *
 * Each call creates a unique user, so jobs are isolated per test.
 */
export async function signInAs(page: Page): Promise<TestCredentials> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `e2e-${id}@example.com`;
    const username = `e2e_${id.replace(/-/g, "_")}`.slice(0, 20);
    const password = "Password123!";

    const apiBase = API_URL.replace(/\/$/, "");

    const res = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
        // Provide actionable error when Go API is not running (real-backend mode).
        const body = await res.text().catch(() => "");
        throw new Error(
            `Failed to register e2e user (POST ${apiBase}/api/auth/register -> ${res.status}): ${body}\n` +
                `Is the Go API running? Try: docker compose up -d db api\n` +
                `Expected API_URL=${apiBase} (from env API_URL)`,
        );
    }

    const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: string;
    };

    const expiresInSec = parseInt(data.expires_in, 10) || 900;

    // Next.js reads cookies via `cookies()` (httpOnly). Playwright must set them
    // on the same origin as baseURL (localhost). `domain: localhost` works for
    // http://localhost:3000.
    await page.context().addCookies([
        {
            name: "access_token",
            value: data.access_token,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            expires: Math.floor(Date.now() / 1000) + expiresInSec,
        },
        {
            name: "refresh_token",
            value: data.refresh_token,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            // refresh token lives 7 days
            expires: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        },
    ]);

    return {
        username,
        email,
        password,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
    };
}
