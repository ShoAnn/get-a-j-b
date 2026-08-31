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
    salary: z.number(),
    description: z.string(),
    requirements: z.string(),
    status: z.enum(statusArray),
    statusChangedAt: z.string(),
    notes: z.string(),
    sourceURL: z.string(),
    jobPortal: z.string(),
    createdAt: z.string(),
})

export type Job = z.infer<typeof JobSchema>

export const CreateJobSchema = z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    salary: z.number(),
    description: z.string().optional(),
    requirements: z.string(),
    status: z.enum(statusArray).optional(),
    notes: z.string().optional(),
    sourceURL: z.string().optional(),
    jobPortal: z.string().optional(),
})

export const UpdateJobSchema = z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    salary: z.number(),
    description: z.string().optional(),
    requirements: z.string(),
    sourceURL: z.string().optional(),
    status: z.enum(statusArray).optional(),
    notes: z.string().optional(),
    jobPortal: z.string().optional(),
})

export type UpdateJob = z.infer<typeof UpdateJobSchema>;

export const PatchJobSchema = z.object({
    status: z.enum(statusArray).optional(),
    notes: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    salary: z.number().optional(),
    requirements: z.string().optional(),
    description: z.string().optional(),
    sourceURL: z.string().optional(),
    jobPortal: z.string().optional(),
}).strict();

export type PatchJob = z.infer<typeof PatchJobSchema>;
