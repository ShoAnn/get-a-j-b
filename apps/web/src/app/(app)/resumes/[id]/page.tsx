"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/client/api";
import { ResumeSchema, type Resume } from "@/types/resume";
import { HttpError } from "@/types/errors";
import z from "zod";

export default function ResumeDetail() {
    const params = useParams();
    const resumeId = params.id as string;

    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchResume() {
            setLoading(true);
            setNotFound(false);
            setError(null);
            try {
                const data = await apiClient.get(`/resumes/${resumeId}`, ResumeSchema);
                if (!cancelled) setResume(data);
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
        fetchResume();
        return () => {
            cancelled = true;
        };
    }, [resumeId]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
                <p className="text-sm text-text-secondary dark:text-[#9999AA]">Loading resume...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
                <h3 className="text-lg font-medium text-midnight dark:text-[#F5F5F0]">Resume not found</h3>
                <Link href="/resumes" className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-[#F5F3FF]">
                    Back to Resumes
                </Link>
            </div>
        );
    }

    if (error || !resume) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
                <p className="text-sm text-red-600">{error ?? "Something went wrong"}</p>
                <Link href="/resumes" className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-[#F5F3FF]">
                    Back to Resumes
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
            <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <Link href="/resumes" className="inline-flex items-center gap-1 text-sm text-violet hover:underline">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Resumes
                </Link>
                <div className="mt-6 rounded-xl border-[0.5px] border-zinc-300 bg-surface p-6 dark:border-[#333355] dark:bg-[#252540]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet text-sm font-medium text-white">
                            {resume.label.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-midnight dark:text-[#F5F5F0]">{resume.label}</h1>
                            <p className="mt-1 text-xs text-text-secondary dark:text-[#9999AA]">{resume.content.length} characters</p>
                        </div>
                    </div>
                    <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-[#333355]">
                        <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">Content</h2>
                        <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-midnight dark:bg-[#1A1A2E] dark:text-[#F5F5F0]">
                            {resume.content}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
