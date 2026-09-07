import Link from "next/link";
import type { Resume } from "@/types/resume";

function stripMarkdownSyntax(md: string): string {
    return md
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/^>\s?/gm, "")
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function getResumeSnapshot(content: string, maxChars = 140): string {
    const stripped = stripMarkdownSyntax(content);
    if (stripped.length <= maxChars) return stripped;
    const truncated = stripped.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxChars * 0.6) {
        return truncated.slice(0, lastSpace) + "…";
    }
    return truncated + "…";
}

interface ResumeCardProps {
    resume: Resume;
    highlighted?: boolean;
}

export function ResumeCard({ resume, highlighted }: ResumeCardProps) {
    const snapshot = getResumeSnapshot(resume.content);
    const charCount = resume.content.length;

    return (
        <Link
            href={`/resumes/${resume.id}`}
            data-highlighted={highlighted ? "true" : undefined}
            data-testid={`resume-card-${resume.id}`}
            className={`flex flex-col rounded-xl border-[0.5px] p-4 transition-shadow hover:shadow-md ${
                highlighted
                    ? "border-violet bg-violet/10 dark:border-violet dark:bg-violet/20 animate-pulse ring-1 ring-violet/40"
                    : "border-zinc-300 bg-surface dark:border-zinc-600 dark:bg-midnight"
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet text-xs font-medium text-white">
                    {resume.label.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-midnight dark:text-zinc-100">{resume.label}</p>
                    <p className="mt-0.5 text-xs text-text-secondary dark:text-zinc-400">{charCount} chars</p>
                </div>
            </div>
            <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {snapshot || <span className="italic text-zinc-400">No content</span>}
            </p>
        </Link>
    );
}
