import { JOB_STATUSES } from "@/components/StatusBadge";
import z from "zod";

export type JobStatus =
    | "draft"
    | "submitted"
    | "under_review"
    | "interview_scheduled"
    | "offer_extended"
    | "accepted"
    | "rejected"
    | "withdrawn"
    | "archived";

const statusArray = JOB_STATUSES.map(status => status)
export const JobSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    salary: z.number(), // TODO: fix salary in the backend
    status: z.enum(statusArray),
    statusChangedAt: z.string(),
    description: z.string(),
    requirements: z.string(),
    notes: z.string(),
    jobPortal: z.string(),
    sourceURL: z.string(),
})

export type Job = z.infer<typeof JobSchema>
