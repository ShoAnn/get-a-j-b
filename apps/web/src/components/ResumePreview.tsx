"use client";

import MarkdownViewer from "./MarkdownViewer";

export default function ResumePreview({ content }: { content: string }) {
    return (
        <div
            data-testid="resume-preview"
            className="mx-auto aspect-[210/297] w-full max-w-[794px] overflow-y-auto bg-white p-[6%] text-zinc-900 shadow-[0_2px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.5)]"
        >
            <MarkdownViewer content={content} variant="paper" />
        </div>
    );
}
