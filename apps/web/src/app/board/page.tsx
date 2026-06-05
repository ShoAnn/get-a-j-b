"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { JOB_STATUSES } from "@/components/StatusBadge";
import type { Job, JobStatus } from "@/types/job";

const MOCK_JOBS: Job[] = [
  { id: "1", title: "Frontend Engineer", company: "Stripe", status: "submitted", dateApplied: "2025-12-01", notes: "Referred by John. Need to prep for system design.", jobPortal: "LinkedIn" },
  { id: "2", title: "Senior Frontend Developer", company: "Vercel", status: "under_review", dateApplied: "2025-12-05", notes: "Great company culture. Submitted portfolio.", jobPortal: "Company Website" },
  { id: "3", title: "Full Stack Engineer", company: "Notion", status: "interview_scheduled", dateApplied: "2025-11-28", notes: "Interview on Dec 15. Review React patterns and SQL.", jobPortal: "LinkedIn" },
  { id: "4", title: "UI Engineer", company: "Linear", status: "rejected", dateApplied: "2025-11-15", jobPortal: "Indeed" },
  { id: "5", title: "Software Engineer", company: "Figma", status: "draft", dateApplied: "2025-12-10", notes: "Need to tailor resume for this role.", jobPortal: "Glassdoor" },
  { id: "6", title: "React Native Developer", company: "Expo", status: "offer_extended", dateApplied: "2025-11-20", notes: "Offer received: $180k + equity. Waiting on competing offers.", jobPortal: "LinkedIn" },
  { id: "7", title: "Backend Engineer", company: "Supabase", status: "accepted", dateApplied: "2025-10-01", jobPortal: "Company Website" },
];

function useGroupedJobs(jobs: Job[]) {
  const groups: Record<JobStatus, Job[]> = {} as Record<JobStatus, Job[]>;
  for (const status of JOB_STATUSES) {
    groups[status] = [];
  }
  for (const job of jobs) {
    if (groups[job.status]) {
      groups[job.status].push(job);
    }
  }
  return groups;
}

function KanbanCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${job.id}`,
    data: { jobId: job.id, sourceStatus: job.status },
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      suppressHydrationWarning
      className={`rounded-xl border-[0.5px] border-zinc-300 bg-surface p-4 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md dark:border-zinc-600 dark:bg-midnight ${isDragging ? "opacity-50 z-50" : ""
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet text-xs font-medium text-white">
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-midnight dark:text-zinc-100">
            {job.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-secondary dark:text-zinc-400">
            {job.company}
          </p>
          <p className="mt-2 text-xs text-text-secondary dark:text-zinc-400">
            {new Date(job.dateApplied).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function BoardColumn({
  status,
  jobs,
}: {
  status: JobStatus;
  jobs: Job[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[260px] shrink-0 flex-col rounded-xl border-[0.5px] border-zinc-200 bg-zinc-200 transition-shadow dark:border-midnight-border dark:bg-midnight-light ${isOver ? "ring-2 ring-violet" : ""
        }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-zinc-400">
          {status.replace(/_/g, " ")}
        </h3>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {jobs.length}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {jobs.map((job) => (
          <KanbanCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <p className="py-4 text-center text-xs italic text-text-secondary dark:text-zinc-400">
            No jobs
          </p>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const grouped = useGroupedJobs(jobs);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const jobId = event.active.data.current?.jobId as string | undefined;
      if (!jobId) return;
      const job = jobs.find((j) => j.id === jobId);
      if (job) setActiveJob(job);
    },
    [jobs],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const jobId = active.data.current?.jobId as string | undefined;
    const targetStatus = over.data.current?.status as JobStatus | undefined;

    if (!jobId || !targetStatus) return;

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: targetStatus } : job,
      ),
    );
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-midnight">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="board-columns-scroll mt-6 flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
            {JOB_STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                jobs={grouped[status]}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeJob ? (
              <div className="w-[260px] rotate-3 rounded-xl border-[0.5px] border-zinc-300 bg-surface p-4 shadow-xl dark:border-zinc-600 dark:bg-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet text-xs font-medium text-white">
                    {activeJob.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-midnight dark:text-zinc-100">
                      {activeJob.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-secondary dark:text-zinc-400">
                      {activeJob.company}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
