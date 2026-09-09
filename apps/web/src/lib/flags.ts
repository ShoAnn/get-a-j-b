/**
 * Feature flags for the web app, backed by `NEXT_PUBLIC_*` environment variables.
 */

/**
 * Gates the resume edit mode (edit/save, live preview) on the resume detail page.
 * Enabled by default; set `NEXT_PUBLIC_RESUME_EDIT=disabled` to hide it.
 */
export function isResumeEditEnabled(): boolean {
    return process.env.NEXT_PUBLIC_RESUME_EDIT !== "disabled";
}
