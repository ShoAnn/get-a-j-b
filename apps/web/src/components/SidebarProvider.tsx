"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface SidebarContextValue {
    collapsed: boolean;
    toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "sidebar-collapsed";

export function useSidebar(): SidebarContextValue {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return ctx;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
    // Start expanded so server HTML and the first client render match.
    // The persisted value is applied after mount to avoid hydration mismatch.
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        try {
            if (localStorage.getItem(STORAGE_KEY) === "1") {
                // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration sync of persisted UI state
                setCollapsed(true);
            }
        } catch {
            // localStorage unavailable — stay expanded.
        }
    }, []);

    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
            } catch {
                // Ignore persistence failures.
            }
            return next;
        });
    }, []);

    const value = useMemo(() => ({ collapsed, toggleCollapsed }), [collapsed, toggleCollapsed]);
    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
