"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

interface ResumesRefreshContextValue {
    version: number;
    highlightedId: string | null;
    bumpVersion: (highlightedId?: string | null) => void;
}

const ResumesRefreshContext = createContext<ResumesRefreshContextValue | null>(null);

export function useResumesRefresh(): ResumesRefreshContextValue {
    const ctx = useContext(ResumesRefreshContext);
    if (!ctx) {
        throw new Error("useResumesRefresh must be used within a ResumesRefreshProvider");
    }
    return ctx;
}

export function ResumesRefreshProvider({ children }: { children: ReactNode }) {
    const [version, setVersion] = useState(0);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const bumpVersion = useCallback((id?: string | null) => {
        setVersion((v) => v + 1);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (id) {
            setHighlightedId(id);
            timeoutRef.current = setTimeout(() => {
                setHighlightedId(null);
                timeoutRef.current = null;
            }, 3000);
        } else {
            setHighlightedId(null);
        }
    }, []);

    const value = useMemo(() => ({ version, highlightedId, bumpVersion }), [version, highlightedId, bumpVersion]);
    return (
        <ResumesRefreshContext.Provider value={value}>
            {children}
            {highlightedId && (
                <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2">
                    <div
                        role="status"
                        aria-live="polite"
                        className="pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-lg dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
                            <path d="M3 8l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Resume created successfully
                    </div>
                </div>
            )}
        </ResumesRefreshContext.Provider>
    );
}
