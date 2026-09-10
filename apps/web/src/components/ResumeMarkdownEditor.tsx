"use client";

import ResumePreview from "./ResumePreview";

interface ResumeMarkdownEditorProps {
    content: string;
    onContentChange: (value: string) => void;
    contentError?: string;
    disabled?: boolean;
    idPrefix?: string;
    rows?: number;
    placeholder?: string;
}

const LABEL_CLASS =
    "mb-1 block text-xs font-medium uppercase tracking-wider text-secondary";
const TEXTAREA_CLASS =
    "w-full rounded-lg border-[0.5px] border-border-strong bg-raised px-3 py-[9px] text-sm text-foreground transition-colors focus:border-violet focus:outline-none";

export default function ResumeMarkdownEditor({
    content,
    onContentChange,
    contentError,
    disabled = false,
    idPrefix = "resume",
    rows = 12,
    placeholder = "Resume content",
}: ResumeMarkdownEditorProps) {
    const contentId = `${idPrefix}-content`;

    return (
        <>
            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <div className="flex min-h-[40vh] flex-1 flex-col rounded-lg bg-background p-4 lg:min-h-[60vh]">
                    <label htmlFor={contentId} className={LABEL_CLASS}>
                        Editor
                    </label>
                    <textarea
                        id={contentId}
                        name="content"
                        rows={rows}
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`${TEXTAREA_CLASS} min-h-[40vh] flex-1 lg:min-h-[60vh]`}
                    />
                </div>
                <div className="flex min-h-[40vh] flex-1 flex-col rounded-lg bg-background p-4 lg:min-h-[60vh]">
                    <span className={LABEL_CLASS}>Preview</span>
                    <ResumePreview content={content} />
                </div>
            </div>
            {contentError && <p className="mt-1 text-xs text-red-600">{contentError}</p>}
        </>
    );
}
