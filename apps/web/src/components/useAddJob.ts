"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { HttpError } from "@/types/errors";
import { useToast } from "./Toast";
import { useJobsRefresh } from "./JobsRefresh";
import type { JobFormData } from "./AddJobModal";

export function useAddJob() {
    const router = useRouter();
    const { showToast } = useToast();
    const { bumpVersion } = useJobsRefresh();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = useCallback(
        async (data: JobFormData) => {
            setIsSubmitting(true);
            try {
                const res = await fetch("/api/jobs", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: data.role,
                        company: data.company,
                        location: "Remote",
                        salary: 60000,
                        requirements: "Not specified",
                        status: data.status,
                        notes: data.notes,
                        jobPortal: data.jobPortal,
                    }),
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({} as Record<string, unknown>));
                    const message =
                        (typeof body.message === "string" && body.message) ||
                        (typeof body.error === "string" && body.error) ||
                        "We couldn't save your job. Please try again.";
                    showToast(message, "error");
                    return;
                }
                const created = await res.json().catch(() => null as unknown);
                const newId = created && typeof (created as Record<string, unknown>).id !== "undefined"
                    ? String((created as Record<string, unknown>).id)
                    : null;
                setOpen(false);
                bumpVersion(newId);
                router.refresh();
            } catch (err) {
                const message =
                    err instanceof HttpError
                        ? err.message
                        : "Unable to reach the server. Please check your connection.";
                showToast(message, "error");
            } finally {
                setIsSubmitting(false);
            }
        },
        [bumpVersion, router, showToast],
    );

    return { open, setOpen, isSubmitting, submit };
}
