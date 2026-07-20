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

export interface Job {
  id: string;
  title: string;
  company: string;
  status: JobStatus;
  dateApplied: string;
  notes?: string;
  jobPortal?: string;
}

const statusArray = JOB_STATUSES.map(status => status)
export const JobSchema = z.object({
  title: z.string(),
  company: z.string(),
  status: z.enum(statusArray),
  notes: z.string(),
  jobPortal: z.string(),
})
