"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/client/api";
import { useResumesRefresh } from "./ResumesRefresh";
import ResumePreview from "@/components/ResumePreview";
import ResumeMarkdownEditor from "@/components/ResumeMarkdownEditor";
import ConfirmDeleteButton, { CONFIRM_DELETE_TIMEOUT_MS } from "@/components/ConfirmDeleteButton";
import { CreateResumeSchema, ResumeSchema, type Resume } from "@/types/resume";
import { HttpError } from "@/types/errors";
import z from "zod";

const LABEL_CLASS =
    "mb-1 block text-xs font-medium uppercase tracking-wider text-secondary";
const INPUT_CLASS =
    "w-full rounded-lg border-[0.5px] border-border-strong bg-raised px-3 py-[9px] text-sm text-foreground transition-colors focus:border-violet focus:outline-none";
const CARD_CLASS =
    "rounded-xl border-[0.5px] border-border-strong bg-surface p-6";

function formatResumeDate(value: string): string {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function ResumeEditor({
    resumeId = "",
    initialResume,
    onSaved,
    mode = "edit",
}: {
    resumeId?: string;
    initialResume: Resume;
    onSaved: (resume: Resume) => void;
    mode?: "edit" | "create";
}) {
    const isCreate = mode === "create";
    const router = useRouter();
    const { bumpVersion } = useResumesRefresh();
    const [resume, setResumeLocal] = useState<Resume>(initialResume);
    const [isEditing, setIsEditing] = useState(isCreate);
    const [draftLabel, setDraftLabel] = useState(initialResume.label);
    const [draftContent, setDraftContent] = useState(initialResume.content);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ label?: string; content?: string }>({});

    useEffect(() => {
        return () => {
            if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
        };
    }, []);

    const editing = isCreate || isEditing;

    const isDirty = useMemo(
        () => draftLabel !== resume.label || draftContent !== resume.content,
        [draftLabel, draftContent, resume],
    );
    const canSave = isCreate
        ? Boolean(draftLabel.trim() && draftContent.trim())
        : isDirty;

    function startEditing() {
        setDraftLabel(resume.label);
        setDraftContent(resume.content);
        setFieldErrors({});
        setSaveError(null);
        setIsEditing(true);
    }

    function handleCancel() {
        if (isCreate) {
            router.push("/resumes");
            return;
        }
        setDraftLabel(resume.label);
        setDraftContent(resume.content);
        setFieldErrors({});
        setSaveError(null);
        setIsEditing(false);
    }

    async function handleSave() {
        if (saving || !editing) return;
        setSaveError(null);

        const parsed = CreateResumeSchema.safeParse({
            label: draftLabel.trim(),
            content: draftContent.trim(),
        });
        if (!parsed.success) {
            const errors: { label?: string; content?: string } = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as "label" | "content";
                if (!errors[key]) errors[key] = issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        setSaving(true);
        try {
            if (isCreate) {
                const created = await apiClient.post("/resumes", ResumeSchema, parsed.data);
                onSaved(created);
            } else {
                const updated = await apiClient.put(`/resumes/${resumeId}`, ResumeSchema, parsed.data);
                setResumeLocal(updated);
                onSaved(updated);
                setIsEditing(false);
            }
        } catch (err) {
            if (err instanceof HttpError) {
                setSaveError(`Save failed (${err.statusCode}): ${err.message}`);
            } else if (err instanceof z.ZodError) {
                setSaveError("Unexpected response shape from server");
            } else {
                setSaveError("Something went wrong while saving");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (deleting || saving || isCreate) return;
        if (!confirmingDelete) {
            setConfirmingDelete(true);
            if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
            confirmTimeout.current = setTimeout(() => {
                setConfirmingDelete(false);
                confirmTimeout.current = null;
            }, CONFIRM_DELETE_TIMEOUT_MS);
            return;
        }
        if (confirmTimeout.current) {
            clearTimeout(confirmTimeout.current);
            confirmTimeout.current = null;
        }
        setConfirmingDelete(false);
        setDeleting(true);
        setSaveError(null);
        try {
            await apiClient.delete(`/resumes/${resumeId}`, z.void());
            bumpVersion();
            router.push("/resumes");
            router.refresh();
        } catch (err) {
            if (err instanceof HttpError) {
                setSaveError(`Delete failed (${err.statusCode}): ${err.message}`);
            } else {
                setSaveError("Something went wrong while deleting");
            }
            setDeleting(false);
        }
    }

    return (
        <div className="flex flex-1 flex-col bg-background min-h-full">
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
                <Link href="/resumes" className="inline-flex items-center gap-1 self-start text-sm text-violet hover:underline">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Resumes
                </Link>

                <div className="mt-2 flex flex-1 flex-col">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        {editing ? (
                            <div className="w-full max-w-xl">
                                <label htmlFor="resume-label" className={LABEL_CLASS}>
                                    Label
                                </label>
                                <input
                                    id="resume-label"
                                    name="label"
                                    type="text"
                                    value={draftLabel}
                                    onChange={(e) => setDraftLabel(e.target.value)}
                                    placeholder="Resume label"
                                    className={INPUT_CLASS}
                                />
                                {fieldErrors.label && <p className="mt-1 text-xs text-red-600">{fieldErrors.label}</p>}
                            </div>
                        ) : (
                            <h1 className="text-3xl font-semibold text-foreground">{resume.label}</h1>
                        )}
                        <div className="flex shrink-0 items-center gap-3">
                            {!isCreate && (
                                <span className="text-xs text-secondary">
                                    {resume.updatedAt ? `Last edited ${formatResumeDate(resume.updatedAt)}` : "Not edited yet"}
                                </span>
                            )}
                            {editing ? (
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving || !canSave}
                                        className="cursor-pointer rounded-lg bg-violet px-5 py-[9px] text-sm font-medium text-white transition-colors hover:bg-violet-hover disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="cursor-pointer rounded-lg border border-violet px-5 py-[9px] text-sm font-medium text-violet transition-colors hover:bg-violet-subtle disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={startEditing}
                                        className="cursor-pointer flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-violet px-3 py-[9px] text-sm font-medium text-white transition-colors hover:bg-violet-hover active:bg-violet-active"
                                    >
                                        Edit resume
                                    </button>
                                    <ConfirmDeleteButton
                                        idleLabel="Delete resume"
                                        confirming={confirmingDelete}
                                        deleting={deleting}
                                        disabled={deleting || saving}
                                        onClick={handleDelete}
                                        className="px-5 py-[9px]"
                                    />
                                </div>
                            )}
                    </div>
                </div>

                <div className={`${CARD_CLASS} flex min-h-[60vh] flex-1 flex-col`}>
                        {editing ? (
                            <ResumeMarkdownEditor
                                content={draftContent}
                                onContentChange={setDraftContent}
                                contentError={fieldErrors.content}
                                disabled={saving}
                                idPrefix="resume"
                                rows={12}
                                placeholder="Resume content"
                            />
                        ) : (
                            <div className="flex flex-1 justify-center rounded-lg bg-background p-4">
                                <ResumePreview content={resume.content} />
                            </div>
                        )}
                    </div>
                    {saveError && (
                        <p
                            role="alert"
                            aria-live="polite"
                            className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                        >
                            {saveError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
