import { describe, it, expect } from "vitest";
import { apiClient } from "@/lib/client/api";
import { JobSchema, UpdateJobSchema } from "@/types/job";
import z from "zod";
import { resetMockJobs } from "./handlers";

describe("mock jobs API (MSW)", () => {
  it("GET /api/jobs returns seeded mock jobs", async () => {
    const jobs = await apiClient.get("/jobs", z.array(JobSchema));
    expect(jobs.length).toBeGreaterThanOrEqual(6);
    expect(jobs[0]).toMatchObject({ id: "job-1", title: "Senior Frontend Engineer" });
  });

  it("GET /api/jobs/:id returns a single job and 404s on unknown id", async () => {
    const job = await apiClient.get("/jobs/job-2", JobSchema);
    expect(job.company).toBe("Globex Corp.");

    await expect(apiClient.get("/jobs/nope", JobSchema)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("PUT /api/jobs/:id updates a job and bumps statusChangedAt on status change", async () => {
    const before = await apiClient.get("/jobs/job-3", JobSchema);

    const update = UpdateJobSchema.parse({
      title: "Full Stack Developer",
      company: "Initech",
      location: "Chicago, IL (Hybrid)",
      salary: 125000,
      description: "Updated description",
      requirements: "TypeScript everywhere",
      status: "interview_scheduled",
    });
    const updated = await apiClient.put("/jobs/job-3", JobSchema, update);

    expect(updated.salary).toBe(125000);
    expect(updated.statusChangedAt).not.toBe(before.statusChangedAt);
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

  it("DELETE /api/jobs/:id removes the job", async () => {
    await apiClient.delete("/jobs/job-5", z.void());
    await expect(apiClient.get("/jobs/job-5", JobSchema)).rejects.toMatchObject({
      statusCode: 404,
    });
    resetMockJobs();
  });
});
