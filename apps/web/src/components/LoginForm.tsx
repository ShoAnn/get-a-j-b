"use client"

import { useState } from "react";
import Button from "./Button";
import z from "zod";
import { apiClient } from "@/lib/client/api";
import { useRouter } from "next/navigation";
import { HttpError } from "@/types/errors";

const emailSchema = z.object({
    email: z.email("Please enter a valid email address.")
})

function messageForLoginError(err: unknown): string {
    if (err instanceof HttpError) {
        if (err.statusCode === 401) return "Incorrect email or password.";
        if (err.statusCode === 422) return "Please enter a valid email and password.";
        if (err.statusCode === 429) return "Too many attempts. Please wait and try again.";
        if (err.statusCode >= 500) return "The server is having trouble. Please try again in a moment.";
        return err.message || "Login failed. Please try again.";
    }
    return "Unable to reach the server. Please check your connection.";
}

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(() => {
        try {
            if (typeof window !== "undefined" && sessionStorage.getItem("auth_bounce_reason") === "expired") {
                sessionStorage.removeItem("auth_bounce_reason");
                return "Your session has expired. Please sign in again.";
            }
        } catch {}
        return "";
    });
    const [success, setSuccess] = useState("");
    const isFormValid = email.length > 0 && password.length > 0;

    const router = useRouter();

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsSubmitting(true);
        if (!isFormValid) {
            setError("Please enter both your email and password.");
            setIsSubmitting(false);
            return;
        }

        const result = emailSchema.safeParse({ email });
        if (!result.success) {
            setError(result.error.issues[0]?.message ?? "Please enter a valid email.");
            setIsSubmitting(false);
            return;
        }

        try {
            await apiClient.post("/auth/login", z.void(), { email, password });
            setSuccess("Signed in. Redirecting...");
            router.push("/");
        } catch (err) {
            setError(messageForLoginError(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error && (
                <div role="alert" aria-live="polite" className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-3 text-sm leading-snug text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="8" cy="11" r="0.9" fill="currentColor" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div role="status" aria-live="polite" className="flex items-start gap-2.5 rounded-xl border border-green-300 bg-green-50 px-3.5 py-3 text-sm leading-snug text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M5.5 8l2 2 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{success}</span>
                </div>
            )}
            <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-secondary">
                    Email
                </label>
                <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={error && !email ? "true" : "false"}
                    className="w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-foreground placeholder:text-muted shadow-sm outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/25"
                />
            </div>
            <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-secondary">
                    Password
                </label>
                <div className="relative">
                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={error && !password ? "true" : "false"}
                        className="w-full rounded-lg border border-border bg-raised px-3 py-2.5 pr-16 text-sm text-foreground placeholder:text-muted shadow-sm outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/25"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 cursor-pointer px-3 text-xs font-medium text-secondary transition-colors hover:text-violet"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
            </div>
            <Button type="submit" disabled={isSubmitting} variant="primary" className="mt-1 w-full py-2.5">
                {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
        </form>
    );
}
