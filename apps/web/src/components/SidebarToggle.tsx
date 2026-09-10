"use client";

import { useSidebar } from "./SidebarProvider";

export default function SidebarToggle() {
    const { collapsed, toggleCollapsed } = useSidebar();

    return (
        <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-secondary transition-colors hover:bg-hover lg:flex"
        >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1.5" y="3" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6.5 3v12" stroke="currentColor" strokeWidth="1.3" />
                <path
                    d="M9.75 6.5L8.25 9l1.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
                />
            </svg>
        </button>
    );
}
