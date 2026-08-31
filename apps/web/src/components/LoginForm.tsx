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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
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
        <form onSubmit={handleSubmit} className="w-3xl flex flex-col border-10 border-midnight" noValidate>
            {error && (
                <div role="alert" aria-live="polite" className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    {error}
                </div>
            )}
            {success && (
                <div role="status" aria-live="polite" className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    {success}
                </div>
            )}
            <label htmlFor="login-email" className="sr-only">Email</label>
            <input
                id="login-email"
                type="email"
                name="email"
                placeholder="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error && !email ? "true" : "false"}
            />
            <label htmlFor="login-password" className="sr-only">Password</label>
            <input
                id="login-password"
                type="password"
                name="password"
                placeholder="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error && !password ? "true" : "false"}
            />
            <Button type="submit" disabled={isSubmitting} variant="primary" >
                {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
        </form>
    );
}
