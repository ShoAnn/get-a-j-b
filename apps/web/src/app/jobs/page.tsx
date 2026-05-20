"use client";

import { useState } from "react";
import { StatusBadge, JOB_STATUSES } from "@/components/StatusBadge";
import type { Job, JobStatus } from "@/types/job";

const MOCK_JOBS: Job[] = [
  { id: "1", title: "Frontend Engineer", company: "Stripe", status: "submitted", dateApplied: "2025-12-01" },
  { id: "2", title: "Senior Frontend Developer", company: "Vercel", status: "under_review", dateApplied: "2025-12-05" },
  { id: "3", title: "Full Stack Engineer", company: "Notion", status: "interview_scheduled", dateApplied: "2025-11-28" },
  { id: "4", title: "UI Engineer", company: "Linear", status: "rejected", dateApplied: "2025-11-15" },
  { id: "5", title: "Software Engineer", company: "Figma", status: "draft", dateApplied: "2025-12-10" },
  { id: "6", title: "React Native Developer", company: "Expo", status: "offer_extended", dateApplied: "2025-11-20" },
  { id: "7", title: "Backend Engineer", company: "Supabase", status: "accepted", dateApplied: "2025-10-01" },
];

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");

  const filtered = MOCK_JOBS.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        </div>

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
