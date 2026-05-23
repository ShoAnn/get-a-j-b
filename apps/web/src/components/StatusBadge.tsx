import type { JobStatus } from "@/types/job";

const statusStyles: Record<JobStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  submitted: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  under_review: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  interview_scheduled: "bg-[#F5F3FF] text-[#7F77DD] dark:bg-[#3A3A5C] dark:text-[#B8B4E8]",
  offer_extended: "bg-[#EAF3DE] text-[#27500A] dark:bg-[#1A3A1A] dark:text-[#7DDD7D]",
  accepted: "bg-[#EAF3DE] text-[#27500A] dark:bg-[#1A3A1A] dark:text-[#7DDD7D]",
  rejected: "bg-[#FCEBEB] text-[#791F1F] dark:bg-[#3A1A1A] dark:text-[#E24B4A]",
  withdrawn: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  archived: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

interface StatusBadgeProps {
  status: JobStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-[14px] py-[6px] text-xs font-medium capitalize ${statusStyles[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export const JOB_STATUSES: JobStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "interview_scheduled",
  "offer_extended",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
];
