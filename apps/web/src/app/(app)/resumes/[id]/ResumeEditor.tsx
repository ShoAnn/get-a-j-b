"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/client/api";
import { isResumeEditEnabled } from "@/lib/flags";
import { CreateResumeSchema, ResumeSchema, type Resume } from "@/types/resume";
import { HttpError } from "@/types/errors";
import z from "zod";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const LABEL_CLASS =
    "mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]";
const INPUT_CLASS =
    "w-full rounded-lg border-[0.5px] border-zinc-300 bg-white px-3 py-[9px] text-sm text-midnight transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#1A1A2E] dark:text-[#F5F5F0]";
const CARD_CLASS =
    "rounded-xl border-[0.5px] border-zinc-300 bg-surface p-6 dark:border-[#333355] dark:bg-[#252540]";

function ResumeContentEditor({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="mt-4">
            <label htmlFor="resume-content" className={LABEL_CLASS}>
                Content
            </label>
            <textarea
                id="resume-content"
                name="content"
                rows={8}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Resume content"
                className={INPUT_CLASS}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function ResumeEditCard({
    draftLabel,
    onLabelChange,
    labelError,
    charCount,
    content,
    onContentChange,
    contentError,
    saveError,
}: {
    draftLabel: string;
    onLabelChange: (value: string) => void;
    labelError?: string;
    charCount: number;
    content: string;
    onContentChange: (value: string) => void;
    contentError?: string;
    saveError: string | null;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            className={`${CARD_CLASS} transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                visible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet text-sm font-medium text-white">
                    {draftLabel.charAt(0).toUpperCase() || "R"}
                </div>
                <div className="min-w-0 flex-1">
                    <label htmlFor="resume-label" className={LABEL_CLASS}>
                        Label
                    </label>
                    <input
                        id="resume-label"
                        name="label"
                        type="text"
                        value={draftLabel}
                        onChange={(e) => onLabelChange(e.target.value)}
                        placeholder="Resume label"
                        className={INPUT_CLASS}
                    />
                    {labelError && <p className="mt-1 text-xs text-red-600">{labelError}</p>}
                    <p className="mt-1 text-xs text-text-secondary dark:text-[#9999AA]">{charCount} characters</p>
                </div>
            </div>
            <ResumeContentEditor value={content} onChange={onContentChange} error={contentError} />
            {saveError && (
                <p role="alert" className="mt-4 text-xs text-red-600">
                    {saveError}
                </p>
            )}
        </div>
    );
}

export default function ResumeEditor({
    resumeId,
    initialResume,
    onSaved,
}: {
    resumeId: string;
    initialResume: Resume;
    onSaved: (resume: Resume) => void;
}) {
    const [resume, setResumeLocal] = useState<Resume>(initialResume);
    const [isEditing, setIsEditing] = useState(false);
    const [draftLabel, setDraftLabel] = useState(initialResume.label);
    const [draftContent, setDraftContent] = useState(initialResume.content);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ label?: string; content?: string }>({});

    const contentRef = useRef<HTMLDivElement>(null);
    const firstRectRef = useRef<DOMRect | null>(null);
    const editEnabled = isResumeEditEnabled();

    const isDirty = useMemo(
        () => draftLabel !== resume.label || draftContent !== resume.content,
        [draftLabel, draftContent, resume],
    );

    // FLIP: animate the content section as it moves between cards.
    useIsomorphicLayoutEffect(() => {
        const first = firstRectRef.current;
        firstRectRef.current = null;
        const el = contentRef.current;
        if (!first || !el || typeof el.animate !== "function") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const last = el.getBoundingClientRect();
        if (first.width === 0 || first.height === 0 || last.width === 0 || last.height === 0) return;
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        const sx = first.width / last.width;
        const sy = first.height / last.height;
        if (dx === 0 && dy === 0 && sx === 1 && sy === 1) return;
        const animation = el.animate(
            [
                { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, transformOrigin: "top left" },
                { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "top left" },
            ],
            { duration: 300, easing: "ease-in-out" },
        );
        return () => animation.cancel();
    }, [isEditing]);

    function beginMove(next: boolean) {
        firstRectRef.current = contentRef.current?.getBoundingClientRect() ?? null;
        setIsEditing(next);
    }

    function startEditing() {
        setDraftLabel(resume.label);
        setDraftContent(resume.content);
        setFieldErrors({});
        setSaveError(null);
        beginMove(true);
    }

    function handleCancel() {
        setDraftLabel(resume.label);
        setDraftContent(resume.content);
        setFieldErrors({});
        setSaveError(null);
        beginMove(false);
    }

    async function handleSave() {
        if (saving || !isEditing) return;
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
            const updated = await apiClient.put(`/resumes/${resumeId}`, ResumeSchema, parsed.data);
            firstRectRef.current = contentRef.current?.getBoundingClientRect() ?? null;
            setResumeLocal(updated);
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

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
            <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/resumes" className="inline-flex items-center gap-1 text-sm text-violet hover:underline">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Resumes
                    </Link>
                    {!isEditing ? (
                        editEnabled && (
                            <button
                                type="button"
                                onClick={startEditing}
                                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-violet px-3 py-[9px] text-sm font-medium text-white transition-colors hover:bg-[#6B63C9] active:bg-[#5A52B8]"
                            >
                                Edit resume
                            </button>
                        )
                    ) : (
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || !isDirty}
                                className="rounded-lg bg-violet px-5 py-[9px] text-sm font-medium text-white transition-colors hover:bg-[#6B63C9] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={saving}
                                className="rounded-lg border border-violet px-5 py-[9px] text-sm font-medium text-violet transition-colors hover:bg-[#F5F3FF] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {!isEditing || !editEnabled ? (
                    <div className="mt-6">
                        <div className={CARD_CLASS}>
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet text-sm font-medium text-white">
                                    {resume.label.charAt(0).toUpperCase() || "R"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg font-semibold text-midnight dark:text-[#F5F5F0]">{resume.label}</h1>
                                    <p className="mt-1 text-xs text-text-secondary dark:text-[#9999AA]">
                                        {resume.content.length} characters
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-[#333355]">
                                <div ref={contentRef}>
                                    <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                        Content
                                    </h2>
                                    <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-midnight dark:bg-[#1A1A2E] dark:text-[#F5F5F0]">
                                        {resume.content}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <ResumeEditCard
                            draftLabel={draftLabel}
                            onLabelChange={setDraftLabel}
                            labelError={fieldErrors.label}
                            charCount={draftContent.length}
                            content={draftContent}
                            onContentChange={setDraftContent}
                            contentError={fieldErrors.content}
                            saveError={saveError}
                        />

                        <div className={CARD_CLASS}>
                            <div ref={contentRef}>
                                <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">
                                    Preview
                                </h2>
                                <textarea
                                    aria-label="Content preview"
                                    readOnly
                                    tabIndex={-1}
                                    rows={12}
                                    value={draftContent}
                                    className="mt-3 min-h-48 w-full cursor-default whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-midnight focus:outline-none dark:bg-[#1A1A2E] dark:text-[#F5F5F0]"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
