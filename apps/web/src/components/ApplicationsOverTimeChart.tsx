"use client";

import { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { Job } from "@/types/job";

export const ACTIVITY_WEEKS = 12;
const DAY_MS = 1000 * 60 * 60 * 24;

export interface WeekBucket {
    label: string;
    count: number;
}

export function bucketJobsByWeek(jobs: Job[], now = Date.now(), weeks = ACTIVITY_WEEKS): WeekBucket[] {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => {
        const start = new Date(today.getTime() - (weeks - 1 - i) * 7 * DAY_MS);
        return {
            label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            count: 0,
        };
    });
    for (const job of jobs) {
        const t = new Date(job.createdAt).getTime();
        if (Number.isNaN(t) || t > now) continue;
        const idx = weeks - 1 - Math.floor((today.getTime() - t) / (7 * DAY_MS));
        if (idx >= 0 && idx < weeks) buckets[idx].count += 1;
    }
    return buckets;
}

export default function ApplicationsOverTimeChart({ jobs }: { jobs: Job[] }) {
    const data = useMemo(() => bucketJobsByWeek(jobs), [jobs]);
    const hasData = data.some((b) => b.count > 0);

    return (
        <div className="flex h-full flex-col rounded-xl border-[0.5px] border-border-strong bg-surface p-5">
            <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">
                Applications Over Time
            </h2>
            <p className="mt-1 text-xs text-secondary">
                New applications per week, last {ACTIVITY_WEEKS} weeks
            </p>
            {hasData ? (
                <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                            <CartesianGrid stroke="#D4D4D8" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: "#71717A" }}
                                tickLine={false}
                                axisLine={{ stroke: "#D4D4D8" }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                allowDecimals={false}
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
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="Applications"
                                stroke="#7F77DD"
                                strokeWidth={2}
                                fill="#7F77DD"
                                fillOpacity={0.2}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="mt-5 py-4 text-center text-sm italic text-secondary">
                    No applications in the last {ACTIVITY_WEEKS} weeks.
                </p>
            )}
        </div>
    );
}
