import { http, HttpResponse } from "msw";
import { CreateJobSchema, Job, UpdateJobSchema } from "@/types/job";
import { CreateResumeSchema, Resume, UpdateResumeSchema } from "@/types/resume";

let jobs: Job[] = [];
let resumes: Resume[] = [];

export function resetMockJobs() {
    jobs = [];
}

export function resetMockResumes() {
    resumes = [];
}

export const handlers = [
    http.get("/api/jobs", () => {
        return HttpResponse.json(jobs);
    }),

    http.post("/api/jobs", async ({ request }) => {
        const body = await request.json();
        const parsed = CreateJobSchema.safeParse(body);
        if (!parsed.success) {
            return HttpResponse.json(
                { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
                { status: 422 },
            );
        }
        const now = new Date().toISOString();
        const job: Job = {
            id: crypto.randomUUID(),
            userId: "mock-user",
            title: parsed.data.title,
            company: parsed.data.company,
            location: parsed.data.location,
            salary: parsed.data.salary,
            description: parsed.data.description ?? "",
            requirements: parsed.data.requirements,
            status: parsed.data.status ?? "draft",
            notes: parsed.data.notes ?? "",
            sourceURL: parsed.data.sourceURL ?? "",
            jobPortal: parsed.data.jobPortal ?? "",
            createdAt: now,
            statusChangedAt: now,
        };
        jobs.push(job);
        return HttpResponse.json(job, { status: 201 });
    }),

    http.get("/api/jobs/:id", ({ params }) => {
        const { id } = params;
        const job = jobs.find((j) => j.id === id);
        if (!job) {
            return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }
        return HttpResponse.json(job);
    }),

    http.put("/api/jobs/:id", async ({ params, request }) => {
        const { id } = params;
        const index = jobs.findIndex((j) => j.id === id);
        if (index === -1) {
            return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }
        const body = await request.json();
        const parsed = UpdateJobSchema.safeParse(body);
        if (!parsed.success) {
            return HttpResponse.json(
                { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
                { status: 422 },
            );
        }
        const statusChanged =
            parsed.data.status !== undefined && parsed.data.status !== jobs[index].status;
        const updated: Job = {
            ...jobs[index],
            ...parsed.data,
            statusChangedAt: statusChanged ? new Date().toISOString() : jobs[index].statusChangedAt,
        };
        jobs[index] = updated;
        return HttpResponse.json(updated);
    }),

    http.delete("/api/jobs/:id", ({ params }) => {
        const { id } = params;
        const index = jobs.findIndex((j) => j.id === id);
        if (index === -1) {
            return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }
        jobs.splice(index, 1);
        return new HttpResponse(null, { status: 204 });
    }),

    http.get("/api/resumes", () => {
        return HttpResponse.json(resumes);
    }),

    http.post("/api/resumes", async ({ request }) => {
        const body = await request.json();
        const parsed = CreateResumeSchema.safeParse(body);
        if (!parsed.success) {
            return HttpResponse.json(
                { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
                { status: 422 },
            );
        }
        const resume: Resume = {
            id: crypto.randomUUID(),
            userId: "mock-user",
            label: parsed.data.label,
            content: parsed.data.content,
        };
        resumes.push(resume);
        return HttpResponse.json(resume, { status: 201 });
    }),

    http.get("/api/resumes/:id", ({ params }) => {
        const { id } = params;
        const resume = resumes.find((r) => r.id === id);
        if (!resume) {
            return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }
        return HttpResponse.json(resume);
    }),

    http.put("/api/resumes/:id", async ({ params, request }) => {
        const { id } = params;
        const index = resumes.findIndex((r) => r.id === id);
        if (index === -1) {
            return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }
        const body = await request.json();
        const parsed = UpdateResumeSchema.safeParse(body);
        if (!parsed.success) {
            return HttpResponse.json(
                { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
                { status: 422 },
            );
        }
        const updated: Resume = {
            ...resumes[index],
            ...parsed.data,
        } as Resume;
        resumes[index] = updated;
        return HttpResponse.json(updated);
    }),

    http.delete("/api/resumes/:id", ({ params }) => {
        const { id } = params;
        const index = resumes.findIndex((r) => r.id === id);
        if (index === -1) {
            return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }
        resumes.splice(index, 1);
        return new HttpResponse(null, { status: 204 });
    }),
];
