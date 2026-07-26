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

export const CreateJobsSchema = z.object({
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

export const UpdateJobsSchema = z.object({
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
