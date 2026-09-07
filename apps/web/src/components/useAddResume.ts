"use client";

import { useCallback, useState } from "react";
import { useResumesRefresh } from "./ResumesRefresh";
import { apiClient } from "@/lib/client/api";
import { ResumeSchema } from "@/types/resume";
import { HttpError } from "@/types/errors";

export function useAddResume() {
    const { bumpVersion } = useResumesRefresh();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = useCallback(
        async (data: { label: string; content: string }) => {
            setIsSubmitting(true);
            setError(null);
            try {
                const created = await apiClient.post("/resumes", ResumeSchema, data);
                setOpen(false);
                bumpVersion(created.id);
            } catch (err) {
                if (err instanceof HttpError) {
                    setError(err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Something went wrong");
                }
                throw err;
            } finally {
                setIsSubmitting(false);
            }
        },
        [bumpVersion],
    );

    return { open, setOpen, isSubmitting, error, submit, setError };
}
