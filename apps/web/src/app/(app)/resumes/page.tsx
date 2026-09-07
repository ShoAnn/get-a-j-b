"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/client/api";
import { ResumeSchema, type Resume } from "@/types/resume";
import { HttpError } from "@/types/errors";
import { ResumeCard } from "@/components/ResumeCard";
import AddResumeModal from "@/components/AddResumeModal";
import { useAddResume } from "@/components/useAddResume";
import { useResumesRefresh } from "@/components/ResumesRefresh";
import z from "zod";

export default function ResumesPage() {
    const { version, highlightedId } = useResumesRefresh();
    const { open, setOpen, isSubmitting, submit, error: submitError } = useAddResume();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchResumes() {
            setLoading(true);
            setLoadError(null);
            try {
                const data = await apiClient.get("/resumes", z.array(ResumeSchema));
                if (!cancelled) setResumes(data);
            } catch (err) {
                if (cancelled) return;
                if (err instanceof HttpError && err.statusCode === 401) {
                    setLoadError("Your session has expired. Please sign in again.");
                } else if (err instanceof z.ZodError) {
                    setLoadError("Unexpected response shape from server");
                } else {
                    setLoadError("We couldn't load your resumes. Please refresh and try again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchResumes();
        return () => {
            cancelled = true;
        };
    }, [version]);

    useEffect(() => {
        if (!highlightedId) return;
        const el = document.querySelector('[data-highlighted="true"]');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [highlightedId, resumes]);

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="shrink-0 text-2xl font-semibold tracking-tight text-midnight dark:text-[#F5F5F0]">Resumes</h1>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-violet px-3 py-[9px] text-sm font-medium text-white transition-colors hover:bg-[#6B63C9] active:bg-[#5A52B8]"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Add resume
                    </button>
                </div>

                {loading ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-36 animate-pulse rounded-xl border-[0.5px] border-zinc-300 bg-surface p-4 dark:border-zinc-600 dark:bg-midnight"
                            />
                        ))}
                    </div>
                ) : loadError ? (
                    <div role="alert" className="mt-6 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        {loadError}
                    </div>
                ) : resumes.length > 0 ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {resumes.map((resume) => (
                            <ResumeCard key={resume.id} resume={resume} highlighted={highlightedId === resume.id} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-16 flex flex-col items-center gap-4">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <rect x="16" y="20" width="48" height="44" rx="6" stroke="#D4D4D8" strokeWidth="2" />
                            <path d="M28 34h24M28 42h16M28 50h8" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                            <path d="M36 20V12a4 4 0 014-4h0a4 4 0 014 4v8" stroke="#D4D4D8" strokeWidth="2" />
                        </svg>
                        <h3 className="text-lg font-medium text-midnight dark:text-[#F5F5F0]">No resumes yet</h3>
                        <p className="text-sm text-text-secondary dark:text-[#9999AA]">Create your first resume to get started.</p>
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-[#F5F3FF]"
                        >
                            Add resume
                        </button>
                    </div>
                )}
            </div>
            <AddResumeModal open={open} onClose={() => setOpen(false)} onSubmit={submit} isSubmitting={isSubmitting} error={submitError} />
        </div>
    );
}
