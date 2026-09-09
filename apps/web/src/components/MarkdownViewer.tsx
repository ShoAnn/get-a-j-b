"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export default function MarkdownViewer({ content }: { content: string }) {
    const [html, setHtml] = useState("");

    useEffect(() => {
        // DOMPurify requires a browser DOM, so sanitize client-side after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHtml(
            !content.trim()
                ? ""
                : DOMPurify.sanitize(marked.parse(content, { async: false, gfm: true, breaks: true }) as string),
        );
    }, [content]);

    if (!content.trim()) {
        return <span className="italic text-zinc-400">No content</span>;
    }

    if (!html) {
        return null;
    }

    return (
        <div
            className="prose max-w-none break-words text-midnight dark:prose-invert dark:text-[#F5F5F0]"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
