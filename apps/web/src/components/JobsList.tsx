"use client";

import { Job, JobSchema, JobStatus } from "@/types/job";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { JOB_STATUSES, StatusBadge, statusStyles } from "./StatusBadge";
import AddJobModal from "./AddJobModal";
import { useAddJob } from "./useAddJob";
import { apiClient } from "@/lib/client/api";
import { useJobsRefresh } from "./JobsRefresh";
import z from "zod";
import { HttpError } from "@/types/errors";

const STATUS_ORDER: Record<JobStatus, number> = {
    draft: 0, submitted: 1, under_review: 2, interview_scheduled: 3,
    offer_extended: 4, accepted: 5, rejected: 6, withdrawn: 7, archived: 8,
};

type SortKey = "date" | "company" | "status";
type SortDir = "asc" | "desc";

const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;
const PAGE_SIZE_STORAGE_KEY = "jobs-page-size";

function readStoredPageSize(): number {
    try {
        if (typeof window === "undefined") return DEFAULT_PAGE_SIZE;
        const raw = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
        const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return DEFAULT_PAGE_SIZE;
        return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, parsed));
    } catch {
        return DEFAULT_PAGE_SIZE;
    }
}

function pageNumbers(current: number, total: number): (number | "…")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
        result.push(sorted[i]);
    }
    return result;
}

export function JobsList() {
    const { version, highlightedId } = useJobsRefresh();
    const { open, setOpen, isSubmitting, submit } = useAddJob();
    const [jobs, setJobs] = useState<Job[]>([]);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [page, setPage] = useState(1);
    // Start with defaults so server HTML and the first client render match.
    // The persisted page size is applied after mount to avoid hydration mismatch.
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE));
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const statusMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!statusMenuOpen) return;
        function onClickOutside(e: MouseEvent) {
            if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
                setStatusMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [statusMenuOpen]);

    useEffect(() => {
        if (!highlightedId) return;
        const el = document.querySelector('[data-highlighted="true"]');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [highlightedId, jobs]);

    useEffect(() => {
        const stored = readStoredPageSize();
        if (stored === DEFAULT_PAGE_SIZE) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration sync of persisted UI state
        setPageSize(stored);
        setPageSizeInput(String(stored));
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function fetchJobs() {
            setLoading(true);
            setError(null);
            try {
                const data = await apiClient.get(`/jobs`, z.array(JobSchema));
                if (!cancelled) setJobs(data);
            } catch (err) {
                if (cancelled) return;
                if (err instanceof HttpError) {
                    setError(`Request failed (${err.statusCode}): ${err.message}`);
                } else if (err instanceof z.ZodError) {
                    setError("Unexpected response shape from server");
                } else {
                    setError("Something went wrong");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchJobs();

        return () => {
            cancelled = true;
        };
    }, [version]);


    const filtered = jobs.filter((job: Job) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            job.title.toLowerCase().includes(q) ||
            job.company.toLowerCase().includes(q) ||
            (job.notes && job.notes.toLowerCase().includes(q)) ||
            (job.jobPortal && job.jobPortal.toLowerCase().includes(q));
        const matchesStatus = statusFilter === "all" || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a: Job, b: Job) => {
        let cmp = 0;
        if (sortKey === "date") cmp = a.createdAt.localeCompare(b.createdAt);
        else if (sortKey === "company") cmp = a.company.localeCompare(b.company);
        else if (sortKey === "status") cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        return sortDir === "asc" ? cmp : -cmp;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
    const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, filtered.length);

    function applyPageSize(raw: string) {
        setPageSizeInput(raw);
        const parsed = Number.parseInt(raw, 10);
        if (!Number.isNaN(parsed) && parsed >= MIN_PAGE_SIZE && parsed <= MAX_PAGE_SIZE) {
            setPageSize(parsed);
            setPage(1);
            try {
                localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(parsed));
            } catch {
                // Ignore persistence failures.
            }
        }
    }

    return (
        <div className="mt-6">
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-mist"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by title or company..."
                            className="w-full rounded-lg border-[0.5px] border-border-strong py-[9px] pl-10 pr-3 text-zinc-500 text-[13px] transition-colors focus:border-violet focus:outline-none dark:bg-midnight-light dark:text-mist placeholder:text-muted"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-violet px-3 py-[9px] text-sm font-medium text-white transition-colors hover:bg-violet-hover active:bg-violet-active"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Add application
                    </button>
                    <div ref={statusMenuRef} className="relative">
                        <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={statusMenuOpen}
                            onClick={() => setStatusMenuOpen((v) => !v)}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border-[0.5px] border-border-strong px-3 py-[9px] text-[13px] transition-colors focus:border-violet focus:outline-none dark:bg-midnight-light"
                        >
                            {statusFilter === "all" ? (
                                <span className="text-zinc-400 dark:text-mist">All statuses</span>
                            ) : (
                                <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[statusFilter as JobStatus]}`}>
                                    {(statusFilter as string).replace(/_/g, " ")}
                                </span>
                            )}
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                aria-hidden="true"
                                className={`shrink-0 text-zinc-400 transition-transform dark:text-fog ${statusMenuOpen ? "rotate-180" : ""}`}
                            >
                                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {statusMenuOpen && (
                            <div
                                role="listbox"
                                className="absolute right-0 top-full z-20 mt-1 max-h-64 w-48 overflow-auto rounded-lg border border-border bg-overlay py-1 shadow-lg"
                            >
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={statusFilter === "all"}
                                    onClick={() => {
                                        setStatusFilter("all");
                                        setStatusMenuOpen(false);
                                        setPage(1);
                                    }}
                                    className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-hover ${statusFilter === "all" ? "bg-hover" : ""}`}
                                >
                                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">All statuses</span>
                                </button>
                                {JOB_STATUSES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        role="option"
                                        aria-selected={statusFilter === s}
                                        onClick={() => {
                                            setStatusFilter(s);
                                            setStatusMenuOpen(false);
                                            setPage(1);
                                        }}
                                        className={`flex w-full cursor-pointer items-center px-3 py-1.5 text-left transition-colors hover:bg-hover ${statusFilter === s ? "bg-hover" : ""}`}
                                    >
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[s]}`}>
                                            {s.replace(/_/g, " ")}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <select
                        value={`${sortKey}-${sortDir}`}
                        onChange={(e) => {
                            const [key, dir] = e.target.value.split("-") as [SortKey, SortDir];
                            setSortKey(key);
                            setSortDir(dir);
                            setPage(1);
                        }}
                        className="rounded-lg border-[0.5px] border-border-strong px-3 py-[9px] text-zinc-400 text-[13px] transition-colors focus:border-violet focus:outline-none dark:bg-midnight-light dark:text-mist"
                    >
                        <option value="date-desc">Date (newest)</option>
                        <option value="date-asc">Date (oldest)</option>
                        <option value="company-asc">Company (A-Z)</option>
                        <option value="company-desc">Company (Z-A)</option>
                        <option value="status-asc">Status (draft → archived)</option>
                        <option value="status-desc">Status (archived → draft)</option>
                    </select>
                </div>

                {loading ? (
                    <p className="mt-6 text-sm text-secondary">Loading…</p>
                ) : error ? (
                    <p className="mt-6 text-sm text-red-600">{error}</p>
                ) : filtered.length > 0 ? (
                    <>
                    <div className="mt-6 overflow-hidden rounded-xl border border-border bg-raised">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-zinc-50 dark:bg-midnight-light">
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                                        Title
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                                        Company
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                                        Portal
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-midnight-border">
                                {paginated.map((job: Job) => {
                                    const isHighlighted = highlightedId === job.id;
                                    return (
                                    <tr
                                        key={job.id}
                                        data-highlighted={isHighlighted ? "true" : undefined}
                                        className={`transition-colors ${isHighlighted ? "bg-violet/10 dark:bg-violet/20 animate-pulse ring-1 ring-inset ring-violet/40 border border-violet/30" : "hover:bg-hover"}`}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                                            {job.title}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary">
                                            {job.company}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary">
                                            {job.jobPortal || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary">
                                            {new Date(job.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                aria-label={`View details for ${job.title} at ${job.company}`}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-violet text-violet transition-colors hover:bg-violet-subtle active:bg-violet-subtle-active dark:hover:bg-midnight-active"
                                            >
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        d="M4 2l4 4-4 4"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                    );
                                    })}
                            </tbody>
                        </table>
                    </div>
                    <nav
                        aria-label="Jobs pagination"
                        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <p className="text-xs text-secondary" aria-live="polite">
                            Showing {rangeStart}–{rangeEnd} of {filtered.length} application{filtered.length === 1 ? "" : "s"}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <label
                                htmlFor="jobs-per-page"
                                className="flex items-center gap-2 text-xs text-secondary"
                            >
                                Per page
                                <input
                                    id="jobs-per-page"
                                    type="number"
                                    min={MIN_PAGE_SIZE}
                                    max={MAX_PAGE_SIZE}
                                    value={pageSizeInput}
                                    onChange={(e) => applyPageSize(e.target.value)}
                                    onBlur={() => setPageSizeInput(String(pageSize))}
                                    className="w-16 rounded-lg border-[0.5px] border-border-strong px-2 py-[6px] text-center text-[13px] text-foreground transition-colors focus:border-violet focus:outline-none dark:bg-midnight-light"
                                />
                            </label>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPage(safePage - 1)}
                                    disabled={safePage <= 1}
                                    aria-label="Previous page"
                                    className="cursor-pointer rounded-lg border border-border-strong px-3 py-[6px] text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Prev
                                </button>
                                {pageNumbers(safePage, totalPages).map((p, i) =>
                                    p === "…" ? (
                                        <span
                                            key={`ellipsis-${i}`}
                                            aria-hidden="true"
                                            className="px-1 text-xs text-muted"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPage(p)}
                                            aria-label={`Go to page ${p}`}
                                            aria-current={p === safePage ? "page" : undefined}
                                            className={`cursor-pointer rounded-lg px-3 py-[6px] text-xs font-medium transition-colors ${
                                                p === safePage
                                                    ? "bg-violet text-white"
                                                    : "border border-border-strong text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ),
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPage(safePage + 1)}
                                    disabled={safePage >= totalPages}
                                    aria-label="Next page"
                                    className="cursor-pointer rounded-lg border border-border-strong px-3 py-[6px] text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </nav>
                    </>
                ) : jobs.length === 0 ? (
                    <div className="mt-16 flex flex-col items-center gap-4">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <rect x="16" y="20" width="48" height="44" rx="6" stroke="#D4D4D8" strokeWidth="2" />
                            <path d="M28 34h24M28 42h16M28 50h8" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                            <path d="M36 20V12a4 4 0 014-4h0a4 4 0 014 4v8" stroke="#D4D4D8" strokeWidth="2" />
                            <path d="M56 38l8 8M64 38l-8 8" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <h3 className="text-lg font-medium text-foreground">No jobs yet</h3>
                        <p className="text-sm text-secondary">
                            Start tracking your job applications.
                        </p>
                    </div>
                ) : (
                    <div className="mt-16 flex flex-col items-center gap-4">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <circle cx="34" cy="34" r="18" stroke="#D4D4D8" strokeWidth="2" />
                            <path d="M46 46l14 14" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                            <path d="M28 34h12M34 28v12" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <h3 className="text-lg font-medium text-foreground">No matching jobs</h3>
                        <p className="text-sm text-secondary">
                            Try adjusting your search or filter.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setPage(1);
                            }}
                            className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-violet-subtle"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
            <AddJobModal
                open={open}
                onClose={() => setOpen(false)}
                onSubmit={submit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
