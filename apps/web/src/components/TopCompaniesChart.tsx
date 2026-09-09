"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { Job } from "@/types/job";

export interface CompanyCount {
    company: string;
    count: number;
}

export const TOP_COMPANIES_LIMIT = 5;

export function topCompanies(jobs: Job[], limit = TOP_COMPANIES_LIMIT): CompanyCount[] {
    const counts = new Map<string, number>();
    for (const job of jobs) {
        const name = job.company.trim() || "Unknown";
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([company, count]) => ({ company, count }))
        .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company))
        .slice(0, limit);
}

export default function TopCompaniesChart({ jobs }: { jobs: Job[] }) {
    const data = useMemo(() => topCompanies(jobs), [jobs]);

    return (
        <div className="flex h-full flex-col rounded-xl border-[0.5px] border-border-strong bg-surface p-5">
            <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">
                Top Companies
            </h2>
            <p className="mt-1 text-xs text-secondary">
                Where you apply the most
            </p>
            {data.length > 0 ? (
                <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: 12, bottom: 0, left: 8 }}
                        >
                            <CartesianGrid stroke="#D4D4D8" strokeDasharray="3 3" horizontal={false} />
                            <XAxis
                                type="number"
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: "#71717A" }}
                                tickLine={false}
                                axisLine={{ stroke: "#D4D4D8" }}
                            />
                            <YAxis
                                type="category"
                                dataKey="company"
                                width={90}
                                tick={{ fontSize: 11, fill: "#71717A" }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "0.5px solid var(--color-chart-tooltip-border)",
                                    fontSize: 13,
                                    background: "var(--color-chart-tooltip-bg)",
                                    color: "var(--color-foreground)",
                                }}
                            />
                            <Bar
                                dataKey="count"
                                name="Applications"
                                fill="#7F77DD"
                                radius={[0, 6, 6, 0]}
                                barSize={20}
                                isAnimationActive={false}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="mt-5 py-4 text-center text-sm italic text-secondary">
                    No companies yet.
                </p>
            )}
        </div>
    );
}
