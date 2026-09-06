import type { JobStatus } from "@/types/job";

export const statusStyles: Record<JobStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  submitted: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  under_review: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  interview_scheduled: "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  offer_extended: "bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  withdrawn: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800",
  archived: "bg-zinc-200 text-zinc-700 border border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600",
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
