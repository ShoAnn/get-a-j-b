import { StatusBadge } from "./StatusBadge";
import type { Job } from "@/types/job";

interface ApplicationCardProps {
  job: Job;
}

export function ApplicationCard({ job }: ApplicationCardProps) {
  return (
    <div className="rounded-xl border-[0.5px] border-zinc-300 bg-surface p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet text-sm font-medium text-white">
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium text-midnight">
            {job.title}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {job.company}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={job.status} />
            <span className="text-xs text-text-secondary">
              {new Date(job.dateApplied).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
