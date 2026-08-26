"use client";

import { Job, JobSchema, JobStatus } from "@/types/job";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { JOB_STATUSES, StatusBadge } from "./StatusBadge";
import { apiClient } from "@/lib/client/api";
import z from "zod";
import { HttpError } from "@/types/errors";

const STATUS_ORDER: Record<JobStatus, number> = {
    draft: 0, submitted: 1, under_review: 2, interview_scheduled: 3,
    offer_extended: 4, accepted: 5, rejected: 6, withdrawn: 7, archived: 8,
};

type SortKey = "date" | "company" | "status";
type SortDir = "asc" | "desc";

export function JobsList() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
    }, []);


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

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
            <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold tracking-tight text-midnight dark:text-[#F5F5F0]">
                    Jobs
                </h1>

                <div className="mt-6 flex items-center gap-3">
                    <div className="relative flex-1">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#9999AA]"
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title or company..."
                            className="w-full rounded-lg border-[0.5px] border-zinc-300 py-[9px] pl-10 pr-3 text-zinc-500 text-[13px] transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#252540] dark:text-[#9999AA] dark:placeholder:text-[#666688]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as JobStatus | "all")}
                        className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-zinc-400 text-[13px] transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#252540] dark:text-[#9999AA]"
                    >
                        <option value="all">All statuses</option>
                        {JOB_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s.replace(/_/g, " ")}
                            </option>
                        ))}
                    </select>
                    <select
                        value={`${sortKey}-${sortDir}`}
                        onChange={(e) => {
                            const [key, dir] = e.target.value.split("-") as [SortKey, SortDir];
                            setSortKey(key);
                            setSortDir(dir);
                        }}
                        className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-zinc-400 text-[13px] transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#252540] dark:text-[#9999AA]"
                    >
                        <option value="date-desc">Date (newest)</option>
                        <option value="date-asc">Date (oldest)</option>
                        <option value="company-asc">Company (A-Z)</option>
                        <option value="company-desc">Company (Z-A)</option>
                        <option value="status-asc">Status (draft → archived)</option>
                        <option value="status-desc">Status (archived → draft)</option>
                    </select>
                </div>

                {filtered.length > 0 ? (
                    <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-[#333355] dark:bg-[#1A1A2E]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-[#333355] dark:bg-[#252540]">
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Title
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Company
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Portal
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-[#333355]">
                                {loading && <h1>LOADING...</h1>}
                                {error && <h1 className="text-red">something went wrong</h1>}
                                {filtered.map((job: Job) => (
                                    <tr
                                        key={job.id}
                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-[#252540]"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-midnight dark:text-[#F5F5F0]">
                                            {job.title}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-[#9999AA]">
                                            {job.company}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-[#9999AA]">
                                            {job.jobPortal || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-[#9999AA]">
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
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-violet text-violet transition-colors hover:bg-[#F5F3FF] active:bg-[#EBE9FA] dark:hover:bg-[#3A3A5C]"
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="mt-16 flex flex-col items-center gap-4">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <rect x="16" y="20" width="48" height="44" rx="6" stroke="#D4D4D8" strokeWidth="2" />
                            <path d="M28 34h24M28 42h16M28 50h8" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                            <path d="M36 20V12a4 4 0 014-4h0a4 4 0 014 4v8" stroke="#D4D4D8" strokeWidth="2" />
                            <path d="M56 38l8 8M64 38l-8 8" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <h3 className="text-lg font-medium text-midnight dark:text-[#F5F5F0]">No jobs yet</h3>
                        <p className="text-sm text-text-secondary dark:text-[#9999AA]">
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
                        <h3 className="text-lg font-medium text-midnight dark:text-[#F5F5F0]">No matching jobs</h3>
                        <p className="text-sm text-text-secondary dark:text-[#9999AA]">
                            Try adjusting your search or filter.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                            }}
                            className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-[#F5F3FF]"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
