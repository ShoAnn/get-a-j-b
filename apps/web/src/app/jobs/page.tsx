"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, JOB_STATUSES } from "@/components/StatusBadge";
import type { Job, JobStatus } from "@/types/job";

const MOCK_JOBS: Job[] = [
  { id: "1", title: "Frontend Engineer", company: "Stripe", status: "submitted", dateApplied: "2025-12-01", notes: "Referred by John. Need to prep for system design." },
  { id: "2", title: "Senior Frontend Developer", company: "Vercel", status: "under_review", dateApplied: "2025-12-05", notes: "Great company culture. Submitted portfolio." },
  { id: "3", title: "Full Stack Engineer", company: "Notion", status: "interview_scheduled", dateApplied: "2025-11-28", notes: "Interview on Dec 15. Review React patterns and SQL." },
  { id: "4", title: "UI Engineer", company: "Linear", status: "rejected", dateApplied: "2025-11-15" },
  { id: "5", title: "Software Engineer", company: "Figma", status: "draft", dateApplied: "2025-12-10", notes: "Need to tailor resume for this role." },
  { id: "6", title: "React Native Developer", company: "Expo", status: "offer_extended", dateApplied: "2025-11-20", notes: "Offer received: $180k + equity. Waiting on competing offers." },
  { id: "7", title: "Backend Engineer", company: "Supabase", status: "accepted", dateApplied: "2025-10-01" },
];

const STATUS_ORDER: Record<JobStatus, number> = {
  draft: 0, submitted: 1, under_review: 2, interview_scheduled: 3,
  offer_extended: 4, accepted: 5, rejected: 6, withdrawn: 7, archived: 8,
};

type SortKey = "date" | "company" | "status";
type SortDir = "asc" | "desc";

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = MOCK_JOBS.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortKey === "date") cmp = a.dateApplied.localeCompare(b.dateApplied);
    else if (sortKey === "company") cmp = a.company.localeCompare(b.company);
    else if (sortKey === "status") cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 min-h-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-midnight">
          Jobs
        </h1>

        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
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
              className="w-full rounded-lg border-[0.5px] border-zinc-300 py-[9px] pl-10 pr-3 text-zinc-500 text-[13px] transition-colors focus:border-violet focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | "all")}
            className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-zinc-400 text-[13px] transition-colors focus:border-violet focus:outline-none"
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
            className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-zinc-400 text-[13px] transition-colors focus:border-violet focus:outline-none"
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
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((job) => (
                  <tr
                    key={job.id}
                    className="transition-colors hover:bg-zinc-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-midnight">
                      {job.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {job.company}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(job.dateApplied).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-violet px-4 py-[6px] text-xs font-medium text-violet transition-colors hover:bg-[#F5F3FF] active:bg-[#EBE9FA]"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : MOCK_JOBS.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect x="16" y="20" width="48" height="44" rx="6" stroke="#D4D4D8" strokeWidth="2" />
              <path d="M28 34h24M28 42h16M28 50h8" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
              <path d="M36 20V12a4 4 0 014-4h0a4 4 0 014 4v8" stroke="#D4D4D8" strokeWidth="2" />
              <path d="M56 38l8 8M64 38l-8 8" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3 className="text-lg font-medium text-midnight">No jobs yet</h3>
            <p className="text-sm text-text-secondary">
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
            <h3 className="text-lg font-medium text-midnight">No matching jobs</h3>
            <p className="text-sm text-text-secondary">
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
