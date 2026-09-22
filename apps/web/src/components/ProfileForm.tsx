"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/client/api";
import { MeSchema, type Me } from "@/types/apiUser";
import { HttpError } from "@/types/errors";
import { useToast } from "./Toast";

export default function ProfileForm({ initial }: { initial: Me }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [username, setUsername] = useState(initial.username);
    const [email, setEmail] = useState(initial.email);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [formError, setFormError] = useState<string | null>(null);

    const dirty = username !== initial.username || email !== initial.email;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});
        setFormError(null);
        try {
            const payload: Record<string, string> = {};
            if (username !== initial.username) payload.username = username;
            if (email !== initial.email) payload.email = email;
            const updated = await apiClient.put("/me", MeSchema, payload);
            showToast("Profile updated", "success");
            router.refresh();
            // Update local baseline without full reload flicker
            setUsername(updated.username);
            setEmail(updated.email);
        } catch (err) {
            if (err instanceof HttpError) {
                if (err.statusCode === 409) {
                    setFormError("That email is already in use.");
                } else if (err.statusCode === 401) {
                    setFormError("Your session has expired. Please sign in again.");
                } else {
                    setFormError(err.message || "Couldn't save. Please try again.");
                }
            } else if (err && typeof err === "object" && "flatten" in (err as object)) {
                // ZodError from client validation of response — treat as generic
                setFormError("Unexpected response from server.");
            } else {
                setFormError("Couldn't save. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {formError && (
                <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    {formError}
                </div>
            )}
            <div>
                <label htmlFor="profile-username" className="mb-1 block text-xs font-medium text-secondary">
                    Username
                </label>
                <input
                    id="profile-username"
                    type="text"
                    value={username}
                    minLength={5}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-violet"
                />
                {fieldErrors.username && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.username.join(", ")}</p>
                )}
            </div>
            <div>
                <label htmlFor="profile-email" className="mb-1 block text-xs font-medium text-secondary">
                    Email
                </label>
                <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-violet"
                />
                {fieldErrors.email && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.email.join(", ")}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={saving || !dirty}
                    className="cursor-pointer rounded-lg bg-violet px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? "Saving…" : "Save changes"}
                </button>
                {!dirty && (
                    <span className="text-xs text-secondary">No unsaved changes</span>
                )}
            </div>
        </form>
    );
}
