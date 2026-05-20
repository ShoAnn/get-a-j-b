import type { JobStatus } from "@/types/job";

const statusStyles: Record<JobStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  submitted: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  interview_scheduled: "bg-[#F5F3FF] text-[#7F77DD]",
  offer_extended: "bg-[#EAF3DE] text-[#27500A]",
  accepted: "bg-[#EAF3DE] text-[#27500A]",
  rejected: "bg-[#FCEBEB] text-[#791F1F]",
  withdrawn: "bg-zinc-100 text-zinc-600",
  archived: "bg-zinc-100 text-zinc-600",
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
