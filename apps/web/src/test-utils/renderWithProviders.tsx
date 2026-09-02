import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { JobsRefreshProvider } from "@/components/JobsRefresh";
import { ToastProvider } from "@/components/Toast";
import type { ReactElement } from "react";

export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
    return render(ui, {
        wrapper: ({ children }) => (
            <ToastProvider>
                <JobsRefreshProvider>{children}</JobsRefreshProvider>
            </ToastProvider>
        ),
        ...options,
    });
}
