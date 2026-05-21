"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { StatusBadge, JOB_STATUSES } from "@/components/StatusBadge";
import type { Job } from "@/types/job";

const MOCK_JOBS: Job[] = [
  { id: "1", title: "Frontend Engineer", company: "Stripe", status: "submitted", dateApplied: "2025-12-01", notes: "Referred by John. Need to prep for system design." },
  { id: "2", title: "Senior Frontend Developer", company: "Vercel", status: "under_review", dateApplied: "2025-12-05", notes: "Great company culture. Submitted portfolio." },
  { id: "3", title: "Full Stack Engineer", company: "Notion", status: "interview_scheduled", dateApplied: "2025-11-28", notes: "Interview on Dec 15. Review React patterns and SQL." },
  { id: "4", title: "UI Engineer", company: "Linear", status: "rejected", dateApplied: "2025-11-15" },
  { id: "5", title: "Software Engineer", company: "Figma", status: "draft", dateApplied: "2025-12-10", notes: "Need to tailor resume for this role." },
  { id: "6", title: "React Native Developer", company: "Expo", status: "offer_extended", dateApplied: "2025-11-20", notes: "Offer received: $180k + equity. Waiting on competing offers." },
  { id: "7", title: "Backend Engineer", company: "Supabase", status: "accepted", dateApplied: "2025-10-01" },
];

export default function Dashboard() {
  const totalSaved = MOCK_JOBS.length;
  const totalApplied = MOCK_JOBS.filter((j) => j.status !== "draft").length;

  const dates = MOCK_JOBS.map((j) => new Date(j.dateApplied).getTime());
  const firstDate = new Date(Math.min(...dates));
  const daysSince = Math.floor(
    (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const statusCounts = JOB_STATUSES.reduce(
    (acc, s) => {
      acc[s] = MOCK_JOBS.filter((j) => j.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const stats = [
    { label: "Total Saved", value: totalSaved, color: "bg-violet" },
    { label: "Total Applied", value: totalApplied, color: "bg-teal" },
    { label: "Days Since First App", value: daysSince, color: "bg-midnight" },
  ];

  const statusColors: Record<string, string> = {
    draft: "#D4D4D8",
    submitted: "#60A5FA",
    under_review: "#FBBF24",
    interview_scheduled: "#7F77DD",
    offer_extended: "#1D9E75",
    accepted: "#1D9E75",
    rejected: "#E24B4A",
    withdrawn: "#A1A1AA",
    archived: "#D4D4D8",
  };

  const chartData = JOB_STATUSES.filter((s) => statusCounts[s] > 0).map(
    (status) => ({
      name: status.replace(/_/g, " "),
      value: statusCounts[status],
      color: statusColors[status],
    }),
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 min-h-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-midnight">
          Dashboard
        </h1>

        {/* Stats cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border-[0.5px] border-zinc-300 bg-surface p-5"
            >
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} text-sm font-medium text-white`}
              >
                {stat.label === "Total Saved" && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                {stat.label === "Total Applied" && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {stat.label === "Days Since First App" && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-semibold text-midnight">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        <div className="mt-8 rounded-xl border-[0.5px] border-zinc-300 bg-surface p-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
            Status Breakdown
          </h2>
          {chartData.length > 0 ? (
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="h-56 w-56 shrink-0 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "0.5px solid #D4D4D8",
                        fontSize: 13,
                        background: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <div
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm capitalize text-midnight">
                      {item.name}
                    </span>
                    <span className="ml-auto text-sm font-medium text-midnight">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-5 py-4 text-center text-sm italic text-text-secondary">
              No jobs yet.{" "}
              <Link href="/jobs" className="text-violet underline">
                Add your first job
              </Link>
            </p>
          )}
        </div>

        {/* Recent activity */}
        <div className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
            Recent Jobs
          </h2>
          <div className="mt-4 space-y-3">
            {[...MOCK_JOBS]
              .sort(
                (a, b) =>
                  new Date(b.dateApplied).getTime() -
                  new Date(a.dateApplied).getTime(),
              )
              .slice(0, 4)
              .map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-4 rounded-xl border-[0.5px] border-zinc-300 bg-surface p-4 transition-colors hover:bg-white"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet text-xs font-medium text-white">
                    {job.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-midnight">{job.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{job.company}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
