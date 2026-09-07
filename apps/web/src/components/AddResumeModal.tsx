"use client";

import { useState, type FormEvent } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface AddResumeModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { label: string; content: string }) => void;
    isSubmitting?: boolean;
    error?: string | null;
}

export default function AddResumeModal({ open, onClose, onSubmit, isSubmitting = false, error }: AddResumeModalProps) {
    const [label, setLabel] = useState("");
    const [content, setContent] = useState("");
    const [errors, setErrors] = useState<{ label?: string; content?: string }>({});

    function validate() {
        const next: { label?: string; content?: string } = {};
        if (!label.trim()) next.label = "Label is required";
        if (!content.trim()) next.content = "Content is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ label: label.trim(), content: content.trim() });
    }

    function handleClose() {
        if (isSubmitting) return;
        setLabel("");
        setContent("");
        setErrors({});
        onClose();
    }

    return (
        <Modal open={open} onClose={handleClose} title="Add Resume">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="resume-label" className="text-xs font-medium text-text-secondary dark:text-[#9999AA]">
                        Label
                    </label>
                    <input
                        id="resume-label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Software Engineer Resume"
                        className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-sm transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#1A1A2E] dark:text-[#F5F5F0] dark:placeholder:text-[#666688]"
                    />
                    {errors.label && <span className="text-xs text-error">{errors.label}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="resume-content" className="text-xs font-medium text-text-secondary dark:text-[#9999AA]">
                        Content (Markdown)
                    </label>
                    <textarea
                        id="resume-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        placeholder="# John Doe&#10;Experienced engineer..."
                        className="resize-y rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-sm leading-relaxed transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#1A1A2E] dark:text-[#F5F5F0] dark:placeholder:text-[#666688]"
                    />
                    {errors.content && <span className="text-xs text-error">{errors.content}</span>}
                </div>

                {error && <p className="text-xs text-error">{error}</p>}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
