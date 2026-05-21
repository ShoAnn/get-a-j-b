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
}

export interface JobFormData {
  role: string;
  company: string;
  status: JobStatus;
  notes: string;
}
