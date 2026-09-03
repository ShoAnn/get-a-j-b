"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { useJobsRefresh } from "@/components/JobsRefresh";
import { HttpError } from "@/types/errors";
import type { Job, JobStatus } from "@/types/job";
import { JobSchema } from "@/types/job";
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

function KanbanCard({ job, isSaving, isStaged, isHighlighted, disabled }: { job: Job; isSaving: boolean; isStaged: boolean; isHighlighted: boolean; disabled: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `card-${job.id}`,
        data: { jobId: job.id, sourceStatus: job.status },
        disabled,
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
            data-highlighted={isHighlighted ? "true" : undefined}
            className={`rounded-xl border-[0.5px] p-4 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${isHighlighted ? "border-violet bg-violet/10 dark:border-violet dark:bg-violet/20 animate-pulse ring-1 ring-violet/40" : isStaged ? "border-violet bg-violet/5 dark:border-violet dark:bg-violet/10" : "border-zinc-300 bg-surface dark:border-zinc-600 dark:bg-midnight"} ${isDragging || isSaving ? "opacity-60" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
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
                        {isStaged && !isSaving && <span className="ml-2 text-violet">• staged</span>}
                    </p>
                </div>
            </div>
        </div>
    );
}

const statusColumnColors: Record<JobStatus, string> = {
    draft: "#D4D4D8",
    submitted: "#3B82F6",
    under_review: "#F59E0B",
    interview_scheduled: "#8B5CF6",
    offer_extended: "#06B6D4",
    accepted: "#22C55E",
    rejected: "#EF4444",
    withdrawn: "#EC4899",
    archived: "#52525B",
};

function BoardColumn({ status, jobs, savingIds, stagedIds, anySaving, highlightedId }: { status: JobStatus; jobs: Job[]; savingIds: Set<string>; stagedIds: Set<string>; anySaving: boolean; highlightedId: string | null }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${status}`,
        data: { status },
    });

    return (
        <div
            ref={setNodeRef}
            data-testid={`column-${status}`}
            style={{ borderTop: `3px solid ${statusColumnColors[status]}` }}
            className={`flex h-full w-[260px] shrink-0 flex-col rounded-xl border-[0.5px] border-zinc-200 bg-zinc-200 transition-shadow dark:border-midnight-border dark:bg-midnight ${isOver && !anySaving ? "ring-2 ring-violet mt-1" : ""}`}
        >
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-zinc-400">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: statusColumnColors[status] }} aria-hidden="true" />
                    {status.replace(/_/g, " ")}
                </h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {jobs.length}
                </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
                {jobs.map((job) => (
                    <KanbanCard key={job.id} job={job} isSaving={savingIds.has(job.id)} isStaged={stagedIds.has(job.id)} isHighlighted={highlightedId === job.id} disabled={anySaving} />
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
    const { version, highlightedId, bumpVersion } = useJobsRefresh();
    const [view, setView] = useState<"list" | "board">("list");
    const [jobs, setJobs] = useState<Job[]>([]);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [pendingMoves, setPendingMoves] = useState<Map<string, { from: JobStatus; to: JobStatus }>>(new Map());
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const baselineRef = useRef<Job[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchJobs() {
            setLoading(true);
            setLoadError(null);
            try {
                const data = await apiClient.get("/jobs", z.array(JobSchema));
                if (cancelled) return;
                setJobs(data);
                // clear staging when fresh data arrives (e.g. after external refresh)
                setPendingMoves(new Map());
                setSaveError(null);
                baselineRef.current = null;
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
    }, [version]);

    const grouped = useGroupedJobs(jobs);
    const stagedIds = new Set(pendingMoves.keys());
    const pendingCount = pendingMoves.size;

    useEffect(() => {
        if (!highlightedId) return;
        const el = document.querySelector(`[data-highlighted="true"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, [highlightedId, jobs]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (saving) return;
        const jobId = event.active.data.current?.jobId as string | undefined;
        if (!jobId) return;
        const job = jobs.find((j) => j.id === jobId);
        if (job) setActiveJob(job);
    }, [jobs, saving]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveJob(null);
        if (saving) return;
        const { active, over } = event;
        if (!over) return;

        const jobId = active.data.current?.jobId as string | undefined;
        const targetStatus = over.data.current?.status as JobStatus | undefined;
        if (!jobId || !targetStatus) return;

        const currentJob = jobs.find((j) => j.id === jobId);
        if (!currentJob || currentJob.status === targetStatus) return;

        // Determine original status before any staging for this job
        const existing = pendingMoves.get(jobId);
        const originalStatus = existing?.from ?? currentJob.status;

        // If dropping back to original, cancel the pending move
        if (targetStatus === originalStatus) {
            setPendingMoves((prev) => {
                const next = new Map(prev);
                next.delete(jobId);
                if (next.size === 0) baselineRef.current = null;
                return next;
            });
            setJobs((prev) => prev.map((job) => job.id === jobId ? { ...job, status: targetStatus } : job));
            setSaveError(null);
            return;
        }

        if (baselineRef.current === null) {
            baselineRef.current = jobs.map((j) => ({ ...j }));
        }

        setPendingMoves((prev) => {
            const next = new Map(prev);
            next.set(jobId, { from: originalStatus, to: targetStatus });
            return next;
        });
        setJobs((prev) => prev.map((job) => job.id === jobId ? { ...job, status: targetStatus } : job));
        setSaveError(null);
    }, [jobs, pendingMoves, saving]);

    const handleSave = useCallback(async () => {
        if (pendingMoves.size === 0 || saving) return;
        setSaving(true);
        setSaveError(null);
        const entries = Array.from(pendingMoves.entries());
        const failed: string[] = [];
        for (const [jobId, move] of entries) {
            setSavingIds((prev) => { const next = new Set(prev); next.add(jobId); return next; });
            try {
                await apiClient.patch(`/jobs/${jobId}`, JobSchema, { status: move.to });
                setPendingMoves((prev) => {
                    const next = new Map(prev);
                    next.delete(jobId);
                    return next;
                });
            } catch (err) {
                failed.push(jobId);
                setSaveError(
                    err instanceof HttpError && err.statusCode >= 500
                        ? "Couldn't save. Please try again."
                        : err instanceof Error
                            ? err.message
                            : "Couldn't save. Please try again.",
                );
                // keep this move staged; update savingIds and continue to next? keep first error style: stop batch on first failure
                setSavingIds((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
                break;
            }
            setSavingIds((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
        }
        setSaving(false);
        if (failed.length === 0) {
            baselineRef.current = null;
            bumpVersion();
        }
    }, [pendingMoves, saving, bumpVersion]);

    const handleDiscard = useCallback(() => {
        if (baselineRef.current) {
            setJobs(baselineRef.current);
        } else if (pendingMoves.size > 0) {
            // fallback: revert pending moves individually
            setJobs((prev) => prev.map((job) => {
                const m = pendingMoves.get(job.id);
                return m ? { ...job, status: m.from } : job;
            }));
        }
        setPendingMoves(new Map());
        setSaveError(null);
        setSavingIds(new Set());
        baselineRef.current = null;
    }, [pendingMoves]);

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="shrink-0 text-2xl font-semibold tracking-tight text-midnight dark:text-[#F5F5F0]">
                        Jobs
                    </h1>
                    <div className="flex flex-1 justify-center">
                        {view === "board" && pendingCount > 0 && (
                            <div className="flex items-center gap-2" data-testid="board-save-bar">
                                <span className="hidden text-xs text-midnight dark:text-[#F5F5F0] sm:inline">
                                    {pendingCount === 1 ? "1 unsaved change" : `${pendingCount} unsaved changes`}
                                </span>
                                <span className="text-xs text-midnight dark:text-[#F5F5F0] sm:hidden">
                                    {pendingCount}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleDiscard}
                                    disabled={saving}
                                    className="cursor-pointer rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Discard
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="cursor-pointer rounded-full bg-violet px-4 py-1 text-xs font-medium text-white transition-colors hover:bg-[#6B63C9] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setView("board")}
                            className={`cursor-pointer rounded-lg px-3 py-[6px] text-xs font-medium transition-colors ${
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
                            className={`cursor-pointer rounded-lg px-3 py-[6px] text-xs font-medium transition-colors ${
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
                            {saveError && (
                                <div role="alert" aria-live="polite" className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                                    {saveError}
                                </div>
                            )}
                            <div className="mt-6 h-[calc(100vh-56px-2.5rem-3rem)] pb-4">
                                <div className="flex h-full items-stretch gap-4 overflow-x-auto">
                                    {JOB_STATUSES.map((status) => (
                                        <BoardColumn key={status} status={status} jobs={grouped[status]} savingIds={savingIds} stagedIds={stagedIds} anySaving={saving} highlightedId={highlightedId} />
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
