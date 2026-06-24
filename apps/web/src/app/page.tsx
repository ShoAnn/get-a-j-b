"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { JOB_STATUSES } from "@/components/StatusBadge";
import type { Job } from "@/types/job";
import { apiClient } from "@/lib/apiClient";

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

export default function Dashboard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get<Job[]>("/jobs").then(setJobs).finally(() => setLoading(false));
    }, []);

    const totalSaved = jobs.length;
    const totalApplied = jobs.filter((j) => j.status !== "draft").length;
    const offerReceived = jobs.filter(
        (j) => j.status === "offer_extended" || j.status === "accepted",
    ).length;

    const dates = jobs.map((j) => new Date(j.dateApplied).getTime());
    const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const daysSince = Math.floor(
        (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const statusCounts = JOB_STATUSES.reduce(
        (acc, s) => {
            acc[s] = jobs.filter((j) => j.status === s).length;
            return acc;
        },
        {} as Record<string, number>,
    );

    const stats = [
        { label: "Total Saved", value: totalSaved, color: "bg-violet" },
        { label: "Total Applied", value: totalApplied, color: "bg-teal" },
        { label: "Days Since First App", value: daysSince, color: "bg-midnight" },
        { label: "Offer Received", value: offerReceived, color: "bg-emerald" },
    ];

    const chartData = JOB_STATUSES.filter((s) => statusCounts[s] > 0).map(
        (status) => ({
            name: status.replace(/_/g, " "),
            value: statusCounts[status],
            color: statusColors[status],
        }),
    );

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
            <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold tracking-tight text-midnight dark:text-[#F5F5F0]">
                    Dashboard
                </h1>

                {loading ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-28 animate-pulse rounded-xl border-[0.5px] border-zinc-300 bg-surface p-5 dark:border-[#333355] dark:bg-[#252540]"
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Stats cards */}
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-xl border-[0.5px] border-zinc-300 bg-surface p-5 dark:border-[#333355] dark:bg-[#252540]"
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
                                        {stat.label === "Offer Received" && (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M2 12L6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M2 4h12v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        {stat.label}
                                    </p>
                                    <p className="mt-1 text-3xl font-semibold text-midnight dark:text-[#F5F5F0]">
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Status chart + Recent jobs */}
                        <div className="mt-8 flex flex-col gap-4 lg:h-[300px] lg:flex-row">
                            <div className="flex flex-col lg:w-3/5">
                                <div className="flex flex-1 flex-col items-center rounded-xl border-[0.5px] border-zinc-300 bg-surface p-5 dark:border-[#333355] dark:bg-[#252540]">
                                    <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Jobs by Application Status
                                    </h2>
                                    {chartData.length > 0 ? (
                                        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row sm:items-start">
                                            <div className="h-54 w-54 shrink-0">
                                                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
                                                    <PieChart>
                                                        <Pie
                                                            data={chartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            dataKey="value"
                                                            strokeWidth={0}
                                                            isAnimationActive={false}
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
                                                        <span className="text-sm capitalize text-midnight dark:text-[#F5F5F0]">
                                                            {item.name}
                                                        </span>
                                                        <span className="ml-auto text-sm font-medium text-midnight dark:text-[#F5F5F0]">
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-5 py-4 text-center text-sm italic text-text-secondary dark:text-[#9999AA]">
                                            No jobs yet.{" "}
                                            <Link href="/jobs" className="text-violet underline">
                                                Add your first job
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col lg:w-2/5">
                                <div className="h-full flex flex-1 flex-col rounded-xl border-[0.5px] border-zinc-300 bg-surface p-6 dark:border-[#333355] dark:bg-[#252540]">
                                    <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Recent Jobs
                                    </h2>
                                    <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto">
                                        {[...jobs]
                                            .sort(
                                                (a, b) =>
                                                    new Date(b.dateApplied).getTime() -
                                                    new Date(a.dateApplied).getTime(),
                                            )
                                            .map((job) => (
                                                <Link
                                                    key={job.id}
                                                    href={`/jobs/${job.id}`}
                                                    className="group flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors hover:bg-zinc-100 dark:hover:bg-[#2E2E4A]"
                                                    style={{ borderLeftColor: statusColors[job.status] }}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-midnight dark:text-[#F5F5F0]">
                                                            {job.title}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-text-secondary dark:text-[#9999AA]">
                                                            {job.company}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className="shrink-0 rounded-full text-[11px] font-medium uppercase tracking-wider"
                                                        style={{ color: statusColors[job.status] }}
                                                    >
                                                        {job.status.replace(/_/g, " ")}
                                                    </span>
                                                </Link>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
