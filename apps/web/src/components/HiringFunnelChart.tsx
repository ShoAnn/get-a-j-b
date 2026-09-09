"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { Job } from "@/types/job";

export interface FunnelStage {
    stage: string;
    count: number;
    color: string;
}

const INTERVIEW_STATUSES = ["interview_scheduled", "offer_extended", "accepted"];
const OFFER_STATUSES = ["offer_extended", "accepted"];

export function funnelData(jobs: Job[]): FunnelStage[] {
    const applied = jobs.filter((j) => j.status !== "draft").length;
    const interviewed = jobs.filter((j) => INTERVIEW_STATUSES.includes(j.status)).length;
    const offered = jobs.filter((j) => OFFER_STATUSES.includes(j.status)).length;
    const accepted = jobs.filter((j) => j.status === "accepted").length;
    return [
        { stage: "Applied", count: applied, color: "#3B82F6" },
        { stage: "Interview", count: interviewed, color: "#8B5CF6" },
        { stage: "Offer", count: offered, color: "#06B6D4" },
        { stage: "Accepted", count: accepted, color: "#22C55E" },
    ];
}

export default function HiringFunnelChart({ jobs }: { jobs: Job[] }) {
    const data = useMemo(() => funnelData(jobs), [jobs]);
    const hasData = data.some((s) => s.count > 0);

    return (
        <div className="flex h-full flex-col rounded-xl border-[0.5px] border-border-strong bg-surface p-5">
            <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">
                Hiring Funnel
            </h2>
            <p className="mt-1 text-xs text-secondary">
                How applications progress through stages
            </p>
            {hasData ? (
                <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                            <CartesianGrid stroke="#D4D4D8" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="stage"
                                tick={{ fontSize: 11, fill: "#71717A" }}
                                tickLine={false}
                                axisLine={{ stroke: "#D4D4D8" }}
                                interval={0}
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
                            <Bar dataKey="count" name="Jobs" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                                {data.map((entry) => (
                                    <Cell key={entry.stage} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="mt-5 py-4 text-center text-sm italic text-secondary">
                    No funnel data yet. Apply to jobs to see progress.
                </p>
            )}
        </div>
    );
}
