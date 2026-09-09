"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ResumeEditor from "@/components/ResumeEditor";
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
            <div className="flex flex-1 items-center justify-center bg-background min-h-full">
                <p className="text-sm text-secondary">Loading resume...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background min-h-full">
                <h3 className="text-lg font-medium text-foreground">Resume not found</h3>
                <Link href="/resumes" className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-violet-subtle">
                    Back to Resumes
                </Link>
            </div>
        );
    }

    if (error || !resume) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background min-h-full">
                <p className="text-sm text-red-600">{error ?? "Something went wrong"}</p>
                <Link href="/resumes" className="rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-violet-subtle">
                    Back to Resumes
                </Link>
            </div>
        );
    }

    return <ResumeEditor key={resumeId} resumeId={resumeId} initialResume={resume} onSaved={setResume} />;
}
