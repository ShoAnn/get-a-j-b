import { test, expect } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

test.describe("Create job", () => {
    test("creates a new job via the Add application modal and shows it in the list", async ({
        page,
    }) => {
        await signInAs(page);

        await page.goto("/jobs");

        // Jobs heading is inside JobsPage; ensure we are not redirected to /login
        await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible({
            timeout: 10_000,
        });

        // Open the Add Job modal
        await page.getByRole("button", { name: "Add application" }).click();
        const dialog = page.getByRole("dialog", { name: "Add Job" });
        await expect(dialog).toBeVisible();

        // Unique values so the test is idempotent across fresh users
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const role = `E2E Engineer ${suffix}`;
        const company = `Acme E2E ${suffix}`;

        // Intercept the BFF POST to /api/jobs so we can assert the payload
        const createRequestPromise = page.waitForRequest((req) =>
            req.url().endsWith("/api/jobs") && req.method() === "POST",
        );

        await page.getByLabel("Role").fill(role);
        await page.getByLabel("Company").fill(company);
        await page.getByLabel("Status").selectOption("submitted");
        await page.getByLabel("Job Portal").fill("LinkedIn");
        await page.getByLabel("Notes").fill("Reached out via referral - e2e");

        await page.getByRole("button", { name: /^Save$/ }).click();

        const req = await createRequestPromise;
        const payload = (() => {
            try {
                return JSON.parse(req.postData() ?? "{}");
            } catch {
                return {};
            }
        })() as Record<string, unknown>;

        expect(payload).toMatchObject({
            title: role,
            company: company,
            status: "submitted",
            jobPortal: "LinkedIn",
        });

        // Modal should close after successful submit
        await expect(dialog).toBeHidden({ timeout: 10_000 });

        // The new job should appear in the table (rendered by JobsList)
        // Use exact match for the title/company cells: the actions cell also
        // contains the role in its aria-label ("View details for <role> …").
        await expect(page.getByRole("cell", { name: role, exact: true })).toBeVisible({
            timeout: 10_000,
        });
        await expect(page.getByRole("cell", { name: company, exact: true })).toBeVisible();
        // Status badge text is the status with underscores replaced by spaces
        await expect(page.getByRole("cell", { name: "submitted", exact: true }).first()).toBeVisible();
    });

    test("shows validation error when role is empty and keeps modal open", async ({
        page,
    }) => {
        await signInAs(page);
        await page.goto("/jobs");
        await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible({
            timeout: 10_000,
        });

        await page.getByRole("button", { name: "Add application" }).click();
        const dialog = page.getByRole("dialog", { name: "Add Job" });
        await expect(dialog).toBeVisible();

        // Fill company but leave role empty
        await page.getByLabel("Role").fill("");
        await page.getByLabel("Company").fill("Some Co");

        await page.getByRole("button", { name: /^Save$/ }).click();

        await expect(page.getByText("Role is required")).toBeVisible();
        await expect(dialog).toBeVisible();

        // No network request should have been issued
        // (AddJobModal validates synchronously before calling onSubmit)
    });
});
