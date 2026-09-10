"use client";

import { Job, JobSchema, UpdateJob, UpdateJobSchema } from "@/types/job";
import { JOB_STATUSES, StatusBadge } from "@/components/StatusBadge";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/client/api";
import { useJobsRefresh } from "@/components/JobsRefresh";
import ConfirmDeleteButton, { CONFIRM_DELETE_TIMEOUT_MS } from "@/components/ConfirmDeleteButton";
import { HttpError } from "@/types/errors";
import z from "zod";

type FieldType = "text" | "number" | "textarea" | "select";

interface FieldDef {
    name: Exclude<keyof UpdateJob, "status">;
    label: string;
    type: Exclude<FieldType, "select">;
    rows?: number;
    placeholder?: string;
}

const LEFT_FIELDS: FieldDef[] = [
    { name: "title", label: "Title", type: "text", placeholder: "Job title" },
    { name: "company", label: "Company", type: "text", placeholder: "Company name" },
    { name: "location", label: "Location", type: "text", placeholder: "Location" },
    { name: "salary", label: "Salary", type: "number", placeholder: "0" },
    { name: "jobPortal", label: "Job Portal", type: "text", placeholder: "e.g. LinkedIn" },
    { name: "sourceURL", label: "Source URL", type: "text", placeholder: "https://..." },
    { name: "description", label: "Description", type: "textarea", rows: 6, placeholder: "Job description" },
    { name: "requirements", label: "Requirements", type: "textarea", rows: 6, placeholder: "Job requirements" },
];

const NOTES_FIELD: FieldDef = {
    name: "notes",
    label: "Notes",
    type: "textarea",
    rows: 14,
    placeholder: "No notes added yet.",
};

const LABEL_CLASS =
    "mb-1 block text-xs font-medium uppercase tracking-wider text-secondary";
const BOX_CLASS =
    "w-full rounded-lg border-[0.5px] border-border-strong bg-overlay px-3 py-[9px] text-[13px] text-foreground transition-colors";
const VIEW_BOX_CLASS = `${BOX_CLASS} block cursor-text text-left focus:border-violet focus:outline-none`;
const INPUT_CLASS = `${BOX_CLASS} focus:border-violet focus:outline-none`;
const PLACEHOLDER_CLASS = "text-muted";

/** How long inputs stay highlighted after entering edit mode. */
const EDIT_HIGHLIGHT_MS = 1000;
/** Extra classes applied to every edit input while the highlight is active. */
const INPUT_HIGHLIGHT_CLASS = "bg-violet/5 ring-2 ring-violet/40 dark:bg-violet/10";

function formatSalary(salary: number): string {
    return new Intl.NumberFormat("en-US").format(salary);
}

function parseSalary(value: string): number {
    if (value === "") return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

export default function JobEditor({
    jobId,
    initialJob,
    onSaved,
}: {
    jobId: string;
    initialJob: Job;
    onSaved: (job: Job) => void;
}) {
    const router = useRouter();
    const { bumpVersion } = useJobsRefresh();
    const [job, setJobLocal] = useState<Job>(initialJob);
    const [formData, setFormData] = useState<UpdateJob>({
        title: initialJob.title,
        company: initialJob.company,
        location: initialJob.location,
        salary: initialJob.salary,
        description: initialJob.description,
        requirements: initialJob.requirements,
        sourceURL: initialJob.sourceURL,
        status: initialJob.status,
        notes: initialJob.notes,
        jobPortal: initialJob.jobPortal,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UpdateJob, string>>>({});
    const [deleting, setDeleting] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [highlightInputs, setHighlightInputs] = useState(false);
    const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
            if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
        };
    }, []);

    const isDirty = useMemo(
        () => Object.entries(formData).some(([key, value]) => value !== job[key as keyof Job]),
        [formData, job]
    );

    function startEditing() {
        if (isEditing) return;
        setIsEditing(true);
        setHighlightInputs(true);
        if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
        highlightTimeout.current = setTimeout(() => {
            setHighlightInputs(false);
            highlightTimeout.current = null;
        }, EDIT_HIGHLIGHT_MS);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "salary" ? parseSalary(value) : value,
        }));
        if (fieldErrors[name as keyof UpdateJob]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    function handleDiscard() {
        setFormData({
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary,
            description: job.description,
            requirements: job.requirements,
            sourceURL: job.sourceURL,
            status: job.status,
            notes: job.notes,
            jobPortal: job.jobPortal,
        });
        setFieldErrors({});
        setSaveError(null);
        setIsEditing(false);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (saving || !isEditing) return;
        setSaveError(null);

        const parsed = UpdateJobSchema.safeParse(formData);
        if (!parsed.success) {
            const errors: Partial<Record<keyof UpdateJob, string>> = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof UpdateJob;
                if (!errors[key]) errors[key] = issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        setSaving(true);
        try {
            const updated = await apiClient.put(`/jobs/${jobId}`, JobSchema, parsed.data);
            setJobLocal(updated);
            onSaved(updated);
            setIsEditing(false);
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
        if (deleting || saving) return;
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
            await apiClient.delete(`/jobs/${jobId}`, z.void());
            bumpVersion();
            router.push("/jobs");
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

    function renderField(field: FieldDef) {
        const error = fieldErrors[field.name];
        const value = formData[field.name] as string | number;
        const inputClass = highlightInputs ? `${INPUT_CLASS} ${INPUT_HIGHLIGHT_CLASS}` : INPUT_CLASS;

        if (!isEditing) {
            let display: string;
            if (field.type === "number") display = formatSalary(Number(value));
            else display = String(value ?? "");
            return (
                <div key={field.name}>
                    <span className={LABEL_CLASS}>{field.label}</span>
                    {field.type === "textarea" ? (
                        <button
                            type="button"
                            onClick={startEditing}
                            className={`${VIEW_BOX_CLASS} whitespace-pre-wrap ${display ? "" : PLACEHOLDER_CLASS}`}
                            aria-label={field.label}
                        >
                            {display || field.placeholder}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={startEditing}
                            className={VIEW_BOX_CLASS}
                            aria-label={field.label}
                        >
                            {display || <span className={PLACEHOLDER_CLASS}>{field.placeholder}</span>}
                        </button>
                    )}
                </div>
            );
        }

        if (field.type === "textarea") {
            return (
                <div key={field.name}>
                    <label htmlFor={`job-${field.name}`} className={LABEL_CLASS}>
                        {field.label}
                    </label>
                    <textarea
                        id={`job-${field.name}`}
                        name={field.name}
                        rows={field.rows}
                        value={String(value)}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className={inputClass}
                    />
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
            );
        }

        return (
            <div key={field.name}>
                <label htmlFor={`job-${field.name}`} className={LABEL_CLASS}>
                    {field.label}
                </label>
                <input
                    id={`job-${field.name}`}
                    name={field.name}
                    type={field.type}
                    value={String(value)}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className={inputClass}
                />
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="flex flex-1 flex-col bg-background min-h-full">
            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr]">
                    {/* Left column — job details */}
                    <div className="flex flex-col gap-4">
                        {LEFT_FIELDS.map(renderField)}
                    </div>

                    {/* Right column — notes + status */}
                    <div className="flex flex-col gap-4">
                        <div>
                            {isEditing ? (
                                <>
                                    <label htmlFor="job-status" className={LABEL_CLASS}>
                                        Status
                                    </label>
                                    <select
                                        id="job-status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className={highlightInputs ? `${INPUT_CLASS} ${INPUT_HIGHLIGHT_CLASS}` : INPUT_CLASS}
                                    >
                                        {JOB_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {s.replace(/_/g, " ")}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.status && (
                                        <p className="mt-1 text-xs text-red-600">{fieldErrors.status}</p>
                                    )}
                                </>
                            ) : (
                                <button type="button" onClick={startEditing} className="cursor-text">
                                    <StatusBadge status={job.status} />
                                </button>
                            )}
                        </div>

                        {renderField(NOTES_FIELD)}

                        <dl className="rounded-xl border border-border bg-overlay p-4 text-[13px]">
                            <div className="flex justify-between py-1">
                                <dt className="text-secondary">Created</dt>
                                <dd className="text-foreground">
                                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </dd>
                            </div>
                            <div className="flex justify-between py-1">
                                <dt className="text-secondary">Last status change</dt>
                                <dd className="text-foreground">
                                    {new Date(job.statusChangedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </dd>
                            </div>
                        </dl>

                        {isEditing && (
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={saving || !isDirty}
                                    className="cursor-pointer rounded-lg bg-violet px-5 py-[10px] text-sm font-medium text-white transition-colors hover:bg-violet-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDiscard}
                                    disabled={saving}
                                    className="cursor-pointer rounded-lg border border-violet px-5 py-[10px] text-sm font-medium text-violet transition-colors hover:bg-violet-subtle disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Discard
                                </button>
                            </div>
                        )}

                        {!isEditing && (
                            <div className="flex items-center gap-3">
                                <ConfirmDeleteButton
                                    idleLabel="Delete job"
                                    confirming={confirmingDelete}
                                    deleting={deleting}
                                    disabled={deleting || saving}
                                    onClick={handleDelete}
                                    className="px-5 py-[10px]"
                                />
                            </div>
                        )}

                        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                    </div>
                </div>
            </div>
        </form>
    );
}
