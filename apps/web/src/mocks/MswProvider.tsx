"use client";

import { useEffect } from "react";

let startPromise: Promise<unknown> | null = null;

function startWorkerOnce() {
    if (!startPromise) {
        startPromise = (async () => {
            const { worker } = await import("@/mocks/browser");
            await worker.start({
                onUnhandledRequest: "bypass",
                quiet: true,
            });
        })().catch((err) => {
            console.error("[msw] failed to start mock worker:", err);
        });
    }
    return startPromise;
}

export function MswProvider({ children }: { children: React.ReactNode }) {
    const enabled = process.env.NEXT_PUBLIC_MSW === "enabled";

    useEffect(() => {
        if (!enabled) return;
        void startWorkerOnce();
    }, [enabled]);

    return <>{children}</>;
}
