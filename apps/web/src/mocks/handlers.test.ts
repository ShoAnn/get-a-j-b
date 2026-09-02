import { describe, it, expect, beforeEach } from "vitest";
import { apiClient } from "@/lib/client/api";
import { JobSchema, UpdateJobSchema } from "@/types/job";
import z from "zod";
import { resetMockJobs } from "./handlers";

const SEED = {
    title: "Senior Frontend Engineer",
    company: "Acme Inc.",
    location: "Remote",
    salary: 145000,
    description: "Own the customer-facing web experience.",
    requirements: "5+ years of frontend experience.",
    status: "interview_scheduled" as const,
    statusChangedAt: "2026-08-12T09:30:00.000Z",
    notes: "Recruiter screen went well.",
    sourceURL: "https://acme.example.com/careers/senior-frontend-engineer",
    jobPortal: "LinkedIn",
    createdAt: "2026-07-02T14:00:00.000Z",
};

async function seed(id: string, overrides: Partial<typeof SEED> = {}) {
    return apiClient.post("/jobs", JobSchema, { ...SEED, ...overrides, status: overrides.status ?? SEED.status });
}

describe("mock jobs API (MSW)", () => {
    beforeEach(() => {
        resetMockJobs();
    });

    it("GET /api/jobs starts empty", async () => {
        const jobs = await apiClient.get("/jobs", z.array(JobSchema));
        expect(jobs).toEqual([]);
    });

    it("POST /api/jobs creates a job with draft defaults", async () => {
        const created = await apiClient.post("/jobs", JobSchema, {
            title: "DevOps Engineer",
            company: "NewCo",
            location: "Remote",
            salary: 140000,
            requirements: "Docker, K8s",
        });

        expect(created.id).toBeTruthy();
        expect(created.status).toBe("draft");

        const list = await apiClient.get("/jobs", z.array(JobSchema));
        expect(list.some((j) => j.id === created.id)).toBe(true);
    });

    it("GET /api/jobs/:id returns a single job and 404s on unknown id", async () => {
        const created = await seed("ignored");
        const fetched = await apiClient.get(`/jobs/${created.id}`, JobSchema);
        expect(fetched.title).toBe(SEED.title);

        await expect(apiClient.get("/jobs/nope", JobSchema)).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it("PUT /api/jobs/:id updates a job and bumps statusChangedAt on status change", async () => {
        const created = await seed("ignored");

        const update = UpdateJobSchema.parse({
            title: "Full Stack Developer",
            company: "Initech",
            location: "Chicago, IL (Hybrid)",
            salary: 125000,
            description: "Updated description",
            requirements: "TypeScript everywhere",
            status: "offer_extended",
        });
        const updated = await apiClient.put(`/jobs/${created.id}`, JobSchema, update);

        expect(updated.salary).toBe(125000);
        expect(updated.statusChangedAt).not.toBe(created.statusChangedAt);
    });

    it("DELETE /api/jobs/:id removes the job", async () => {
        const created = await seed("ignored");
        await apiClient.delete(`/jobs/${created.id}`, z.void());
        await expect(apiClient.get(`/jobs/${created.id}`, JobSchema)).rejects.toMatchObject({
            statusCode: 404,
        });
    });
});
