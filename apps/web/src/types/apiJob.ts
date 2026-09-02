import { JOB_STATUSES } from "@/components/StatusBadge";
import z from "zod";
import type { Job, JobStatus } from "@/types/job";

export type JobStatusFromSchema = JobStatus;

const statusArray = JOB_STATUSES.map((status) => status) as [JobStatus, ...JobStatus[]];

// Schema matching the Go API JSON payload.
export const ApiJobSchema = z.object({
    id: z.union([z.number(), z.string()]),
    user_id: z.union([z.number(), z.string()]),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    salary: z.number(),
    description: z.string().optional().default(""),
    requirements: z.string().optional().default(""),
    current_status: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.enum(statusArray)),
    status_changed_at: z.string().optional().default(""),
    notes: z.string().optional().default(""),
    source_url: z.string().optional().default(""),
    job_portal: z.string().optional().default(""),
    created_at: z.string(),
    contact_info: z.string().optional(),
    updated_at: z.string().optional(),
});

export type ApiJob = z.infer<typeof ApiJobSchema>;

export const ApiJobListSchema = z.array(ApiJobSchema);

export function toJob(apiJob: ApiJob): Job {
    const trim = (v: string | undefined) => (v ?? "").trim();
    return {
        id: String(apiJob.id),
        userId: String(apiJob.user_id),
        title: trim(apiJob.title),
        company: trim(apiJob.company),
        location: trim(apiJob.location),
        salary: apiJob.salary,
        description: trim(apiJob.description),
        requirements: trim(apiJob.requirements),
        status: apiJob.current_status,
        statusChangedAt: trim(apiJob.status_changed_at),
        notes: trim(apiJob.notes),
        sourceURL: trim(apiJob.source_url),
        jobPortal: trim(apiJob.job_portal),
        createdAt: trim(apiJob.created_at),
    };
}

export function toJobs(apiJobs: ApiJob[]): Job[] {
    return apiJobs.map(toJob);
}
