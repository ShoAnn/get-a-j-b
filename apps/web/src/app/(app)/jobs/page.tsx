"use client";

import { useState, useEffect, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { JobsList } from "@/components/JobsList";
import { JOB_STATUSES } from "@/components/StatusBadge";
import { apiClient } from "@/lib/client/api";
import { HttpError } from "@/types/errors";
import type { Job, JobStatus } from "@/types/job";
import z from "zod";

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

function KanbanCard({ job, isSaving }: { job: Job; isSaving: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `card-${job.id}`,
        data: { jobId: job.id, sourceStatus: job.status },
    });

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            aria-busy={isSaving}
            data-testid={`card-${job.id}`}
            className={`rounded-xl border-[0.5px] border-zinc-300 bg-surface p-4 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md dark:border-zinc-600 dark:bg-midnight ${isDragging || isSaving ? "opacity-60" : ""}`}
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
                        {new Date(job.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                        {isSaving && <span className="ml-2 italic">saving…</span>}
                    </p>
                </div>
            </div>
        </div>
    );
}

function BoardColumn({ status, jobs, savingIds }: { status: JobStatus; jobs: Job[]; savingIds: Set<string> }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${status}`,
        data: { status },
    });

    return (
        <div
            ref={setNodeRef}
            data-testid={`column-${status}`}
            className={`flex h-full w-[260px] shrink-0 flex-col rounded-xl border-[0.5px] border-zinc-200 bg-zinc-200 transition-shadow dark:border-midnight-border dark:bg-midnight ${isOver ? "ring-2 ring-violet mt-1" : ""}`}
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
                    <KanbanCard key={job.id} job={job} isSaving={savingIds.has(job.id)} />
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

export default function JobsPage() {
    const [view, setView] = useState<"list" | "board">("list");
    const [jobs, setJobs] = useState<Job[]>([]);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [failedMoves, setFailedMoves] = useState<Map<string, { from: JobStatus; to: JobStatus; message: string }>>(new Map());

    useEffect(() => {
        let cancelled = false;
        async function fetchJobs() {
            setLoading(true);
            setLoadError(null);
            try {
                const data = await apiClient.get("/jobs", z.array(z.any()));
                if (cancelled) return;
                setJobs(data as Job[]);
            } catch (err) {
                if (cancelled) return;
                if (err instanceof HttpError && err.statusCode === 401) {
                    setLoadError("Your session has expired. Please sign in again.");
                } else {
                    setLoadError("We couldn't load your jobs. Please refresh and try again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchJobs();
        return () => { cancelled = true; };
    }, []);

    const grouped = useGroupedJobs(jobs);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const jobId = event.active.data.current?.jobId as string | undefined;
        if (!jobId) return;
        const job = jobs.find((j) => j.id === jobId);
        if (job) setActiveJob(job);
    }, [jobs]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveJob(null);
        const { active, over } = event;
        if (!over) return;

        const jobId = active.data.current?.jobId as string | undefined;
        const targetStatus = over.data.current?.status as JobStatus | undefined;
        if (!jobId || !targetStatus) return;

        const currentJob = jobs.find((j) => j.id === jobId);
        if (!currentJob || currentJob.status === targetStatus) return;

        const previousStatus = currentJob.status;

        setJobs((prev) => prev.map((job) => job.id === jobId ? { ...job, status: targetStatus } : job));
        setSavingIds((prev) => { const next = new Set(prev); next.add(jobId); return next; });

        (async () => {
            try {
                await apiClient.put(`/jobs/${jobId}`, z.any(), {
                    title: currentJob.title,
                    company: currentJob.company,
                    location: currentJob.location,
                    salary: currentJob.salary,
                    requirements: currentJob.requirements,
                    status: targetStatus,
                });
                setSavingIds((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
            } catch (err) {
                setJobs((prev) => prev.map((job) => job.id === jobId ? { ...job, status: previousStatus } : job));
                setSavingIds((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
                setFailedMoves((prev) => {
                    const next = new Map(prev);
                    next.set(jobId, {
                        from: previousStatus,
                        to: targetStatus,
                        message:
                            err instanceof HttpError && err.statusCode >= 500
                                ? "Couldn't save. Please try again."
                                : err instanceof Error
                                    ? err.message
                                    : "Couldn't save. Please try again.",
                    });
                    return next;
                });
            }
        })();
    }, [jobs]);

    return (
        <div className="flex flex-1 min-h-0 flex-col bg-zinc-50 dark:bg-midnight">
            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight text-midnight dark:text-[#F5F5F0]">
                        Jobs
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setView("board")}
                            className={`rounded-lg px-3 py-[6px] text-xs font-medium transition-colors ${
                                view === "board"
                                    ? "bg-violet text-white"
                                    : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            }`}
                        >
                            Board view
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("list")}
                            className={`rounded-lg px-3 py-[6px] text-xs font-medium transition-colors ${
                                view === "list"
                                    ? "bg-violet text-white"
                                    : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            }`}
                        >
                            List view
                        </button>
                    </div>
                </div>

                {view === "board" ? (
                    loading ? (
                        <p className="mt-6 text-sm text-text-secondary dark:text-zinc-400">Loading your jobs…</p>
                    ) : loadError ? (
                        <div role="alert" className="mt-6 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                            {loadError}
                        </div>
                    ) : (
                        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            {failedMoves.size > 0 && (
                                <div role="alert" aria-live="polite" className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                    {Array.from(failedMoves.values()).map((move, idx) => (
                                        <p key={idx}>
                                            Couldn't move a job from {move.from.replace(/_/g, " ")} to {move.to.replace(/_/g, " ")}: {move.message}
                                            <button
                                                type="button"
                                                className="ml-2 underline"
                                                onClick={() => {
                                                    setFailedMoves((prev) => {
                                                        const next = new Map(prev);
                                                        next.delete(String(idx));
                                                        return next;
                                                    });
                                                }}
                                            >
                                                dismiss
                                            </button>
                                        </p>
                                    ))}
                                </div>
                            )}
                            <div className="mt-6 h-[calc(100vh-56px-2.5rem-1.5rem)] pb-4">
                                <div className="flex h-full items-stretch gap-4 overflow-x-auto">
                                    {JOB_STATUSES.map((status) => (
                                        <BoardColumn key={status} status={status} jobs={grouped[status]} savingIds={savingIds} />
                                    ))}
                                </div>
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
                    )
                ) : (
                    <JobsList />
                )}
            </div>
        </div>
    );
}