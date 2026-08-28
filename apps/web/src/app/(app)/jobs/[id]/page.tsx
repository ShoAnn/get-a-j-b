"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import JobEditor from "./JobEditor";
import { apiClient } from "@/lib/client/api";
import { JobSchema, Job } from "@/types/job";
import { HttpError } from "@/types/errors";
import z from "zod";

export default function JobDetail() {
    const params = useParams();
    const jobID = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchJob() {
            setLoading(true);
            setNotFound(false);
            setError(null);
            try {
                const data = await apiClient.get(`/jobs/${jobID}`, JobSchema);
                if (!cancelled) setJob(data);
            } catch (err) {
                if (cancelled) return;
                if (err instanceof HttpError && err.statusCode === 404) {
                    setNotFound(true);
                } else if (err instanceof HttpError) {
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

        fetchJob();

        return () => {
            cancelled = true;
        };
    }, [jobID]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
                <p className="text-sm text-text-secondary dark:text-[#9999AA]">Loading job...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
                <h3 className="text-lg font-medium text-midnight dark:text-[#F5F5F0]">Job not found</h3>
                <Link
                    href="/jobs"
                    className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-[#F5F3FF]"
                >
                    Back to Jobs
                </Link>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
                <p className="text-sm text-red-600">{error ?? "Something went wrong"}</p>
                <Link
                    href="/jobs"
                    className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-[#F5F3FF]"
                >
                    Back to Jobs
                </Link>
            </div>
        );
    }

    return <JobEditor key={jobID} jobId={jobID} initialJob={job} onSaved={setJob} />;
}
