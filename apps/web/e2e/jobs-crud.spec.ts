import { test, expect } from "@playwright/test";
import { signInAs } from "./fixtures/auth";
import { createJobViaApi } from "./fixtures/jobs";

test.describe("Jobs CRUD — read / edit / delete", () => {
    test("reads a job: list shows it and detail page renders its fields", async ({ page }) => {
        const creds = await signInAs(page);
        const job = await createJobViaApi(creds.access_token, {
            title: `Read E2E ${Date.now()}`,
            company: `ReadCo ${Math.random().toString(36).slice(2, 6)}`,
            location: "Berlin, DE",
            salary: 88000,
            description: "Detailed description for read test",
            requirements: "Read requirements",
            status: "submitted",
            notes: "Read notes",
            jobPortal: "LinkedIn",
        });

        await page.goto("/jobs");
        await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible({ timeout: 10_000 });

        // List view: title, company, portal, status badge, date and View details link
        await expect(page.getByRole("cell", { name: job.title, exact: true })).toBeVisible();
        await expect(page.getByRole("cell", { name: job.company, exact: true })).toBeVisible();
        await expect(page.getByRole("cell", { name: "LinkedIn", exact: true })).toBeVisible();
        await expect(page.getByRole("cell", { name: "submitted", exact: true }).first()).toBeVisible();

        // Navigate to detail via the row's View details link
        await page.getByRole("link", { name: `View details for ${job.title} at ${job.company}` }).click();

        // Detail page is /jobs/:id, rendered by JobEditor
        await expect(page).toHaveURL(new RegExp(`/jobs/${job.id}`));
        // Detail shows fields in view mode (buttons with aria-label). Salary is formatted with comma.
        await expect(page.getByRole("button", { name: "Title" })).toContainText(job.title);
        await expect(page.getByRole("button", { name: "Company" })).toContainText(job.company);
        await expect(page.getByRole("button", { name: "Location" })).toContainText("Berlin, DE");
        await expect(page.getByRole("button", { name: "Salary" })).toContainText("88,000");
        await expect(page.getByRole("button", { name: "Job Portal" })).toContainText("LinkedIn");
        // Status badge is inside a button when not editing
        await expect(page.getByRole("button").filter({ hasText: "submitted" })).toBeVisible();
        // Notes and description are rendered as view buttons as well
        await expect(page.getByRole("button", { name: "Notes" })).toContainText("Read notes");
        await expect(page.getByRole("button", { name: "Description" })).toContainText(
            "Detailed description for read test",
        );
    });

    test("edits a job: updates title, company and status via the detail editor", async ({ page }) => {
        const creds = await signInAs(page);
        const job = await createJobViaApi(creds.access_token, {
            title: `Edit Orig ${Date.now()}`,
            company: `EditCo ${Math.random().toString(36).slice(2, 6)}`,
            status: "draft",
        });

        await page.goto(`/jobs/${job.id}`);
        await expect(page.getByRole("button", { name: "Title" })).toBeVisible({ timeout: 10_000 });

        // Enter edit mode by clicking any view field
        await page.getByRole("button", { name: "Title" }).click();
        await expect(page.locator("#job-title")).toBeVisible();

        const updatedTitle = `Edited Title ${Date.now()}`;
        const updatedCompany = `Edited Co ${Math.random().toString(36).slice(2, 6)}`;

        // Update fields
        await page.locator("#job-title").fill(updatedTitle);
        await page.locator("#job-company").fill(updatedCompany);
        // Change status from draft -> interview_scheduled
        await page.locator("#job-status").selectOption("interview_scheduled");

        // Save — intercept PUT to /api/jobs/:id
        const putPromise = page.waitForRequest(
            (req) => req.url().includes(`/api/jobs/${job.id}`) && req.method() === "PUT",
        );
        await page.getByRole("button", { name: /^Save$/ }).click();
        const putReq = await putPromise;
        const putPayload = JSON.parse(putReq.postData() ?? "{}") as Record<string, unknown>;
        expect(putPayload).toMatchObject({
            title: updatedTitle,
            company: updatedCompany,
            status: "interview_scheduled",
        });

        // After save, view mode returns and Save button disappears, status badge updates
        await expect(page.getByRole("button", { name: /^Save$/ })).toBeHidden({ timeout: 10_000 });
        await expect(page.getByRole("button", { name: "Title" })).toContainText(updatedTitle);
        await expect(page.getByRole("button", { name: "Company" })).toContainText(updatedCompany);
        await expect(page.getByText("interview scheduled")).toBeVisible();

        // Reload detail page — changes persist
        await page.reload();
        await expect(page.getByRole("button", { name: "Title" })).toContainText(updatedTitle);
        await expect(page.getByText("interview scheduled")).toBeVisible();

        // List view also reflects the edit
        await page.goto("/jobs");
        await expect(page.getByRole("cell", { name: updatedTitle, exact: true })).toBeVisible();
        await expect(page.getByRole("cell", { name: updatedCompany, exact: true })).toBeVisible();
        // Old values should no longer be present for this user
        await expect(page.getByRole("cell", { name: job.title, exact: true })).toHaveCount(0);
    });

    test("discards edits without saving", async ({ page }) => {
        const creds = await signInAs(page);
        const job = await createJobViaApi(creds.access_token, {
            title: `Discard Orig ${Date.now()}`,
            company: `DiscardCo ${Math.random().toString(36).slice(2, 6)}`,
        });

        await page.goto(`/jobs/${job.id}`);
        await expect(page.getByRole("button", { name: "Title" })).toBeVisible({ timeout: 10_000 });

        await page.getByRole("button", { name: "Title" }).click();
        await page.locator("#job-title").fill("Temporary Unsaved Title");
        await page.getByRole("button", { name: "Discard" }).click();

        // Should revert to original title and exit edit mode
        await expect(page.locator("#job-title")).toBeHidden();
        await expect(page.getByRole("button", { name: "Title" })).toContainText(job.title);
        await expect(page.getByRole("button", { name: "Discard" })).toBeHidden();
    });

    test("deletes a job via the detail Delete button and shows Job not found afterwards", async ({
        page,
    }) => {
        const creds = await signInAs(page);
        const job = await createJobViaApi(creds.access_token, {
            title: `Delete UI ${Date.now()}`,
            company: `DeleteCo ${Math.random().toString(36).slice(2, 6)}`,
        });

        await page.goto(`/jobs/${job.id}`);
        await expect(page.getByRole("button", { name: "Title" })).toContainText(job.title);

        // Handle the window.confirm shown by handleDelete
        page.once("dialog", (dialog) => dialog.accept());

        const deleteRequestPromise = page.waitForResponse(
            (res) => res.url().includes(`/api/jobs/${job.id}`) && res.request().method() === "DELETE",
        );

        await page.getByRole("button", { name: "Delete job" }).click();
        const delRes = await deleteRequestPromise;
        // BFF should return 204 on successful delete
        expect(delRes.status()).toBe(204);

        // Should navigate back to /jobs (router.push)
        await expect(page).toHaveURL(/\/jobs(\?.*)?$/, { timeout: 10_000 });

        // List should no longer contain the deleted job
        await expect(page.getByRole("cell", { name: job.title, exact: true })).toHaveCount(0);

        // Direct navigation to the deleted job's detail page → 404 state
        await page.goto(`/jobs/${job.id}`);
        await expect(page.getByRole("heading", { name: "Job not found" })).toBeVisible({
            timeout: 10_000,
        });
    });

    test("deletes a job via the BFF API and verifies it disappears from list and detail", async ({
        page,
    }) => {
        const creds = await signInAs(page);
        const job = await createJobViaApi(creds.access_token, {
            title: `Delete API ${Date.now()}`,
            company: `DelApiCo ${Math.random().toString(36).slice(2, 6)}`,
        });

        // Verify it appears in list before delete
        await page.goto("/jobs");
        await expect(page.getByRole("cell", { name: job.title, exact: true })).toBeVisible({
            timeout: 10_000,
        });

        // Delete via BFF API using browser fetch (cookies are sent via credentials: include).
        // Use page.evaluate to ensure the browser's httpOnly cookies are sent.
        const result = await page.evaluate(async (id) => {
            const res = await fetch(`/api/jobs/${id}`, { method: "DELETE", credentials: "include" });
            const body = await res.text().catch(() => "");
            return { status: res.status, body };
        }, job.id);
        // eslint-disable-next-line no-console
        if (result.status !== 204) console.log("BFF DELETE failed", result);
        expect(result.status).toBe(204);

        // Refresh list — job should be gone
        await page.reload();
        await expect(page.getByRole("cell", { name: job.title, exact: true })).toHaveCount(0);

        // Detail should now render Job not found
        await page.goto(`/jobs/${job.id}`);
        await expect(page.getByRole("heading", { name: "Job not found" })).toBeVisible();
    });
});
