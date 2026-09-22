"use client"

import { useState } from "react";
import Button from "./Button";
import { apiClient } from "@/lib/client/api";
import { RegisterSchema } from "@/types/auth";
import { useRouter } from "next/navigation";
import { HttpError } from "@/types/errors";
import z from "zod";

const roles = ["admin", "user"];

const inputClassName =
    "w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-foreground placeholder:text-muted shadow-sm outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/25";

const labelClassName = "mb-1.5 block text-xs font-medium text-secondary";

function messageForRegisterError(err: unknown): string {
    if (err instanceof HttpError) {
        if (err.statusCode === 409) return "An account with this email already exists.";
        if (err.statusCode === 422) return "Please check the form for errors.";
        if (err.statusCode === 400) return "Some details don't look right. Please review and try again.";
        if (err.statusCode >= 500) return "The server is having trouble. Please try again in a moment.";
        return err.message || "Registration failed. Please try again.";
    }
    return "Unable to reach the server. Please check your connection.";
}

export default function RegisterForm({ showRoleSelect }: { showRoleSelect: boolean }) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const isFormValid = email.length > 0 && password.length > 0 && username.length > 0;

    const router = useRouter();

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRole(e.target.value)
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsSubmitting(true);
        if (!isFormValid) {
            setError("Please fill in your email, username, and password.");
            setIsSubmitting(false);
            return;
        }

        const parsedInput = RegisterSchema.safeParse({
            email,
            username,
            password,
            confirmPassword,
            role: role === "" ? undefined : role,
        })
        if (!parsedInput.success) {
            const first = parsedInput.error.issues[0];
            setError(first?.message ?? "Please check the form for errors.");
            setIsSubmitting(false);
            return;
        }

        try {
            await apiClient.post("/auth/register", z.void(), parsedInput.data);
            setSuccess("Account created. Redirecting...");
            router.push("/");
        } catch (err) {
            setError(messageForRegisterError(err));
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
                <label htmlFor="register-email" className={labelClassName}>Email</label>
                <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                />
            </div>
            <div>
                <label htmlFor="register-username" className={labelClassName}>Username</label>
                <input
                    id="register-username"
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClassName}
                />
            </div>
            <div>
                <label htmlFor="register-password" className={labelClassName}>Password</label>
                <div className="relative">
                    <input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClassName} pr-16`}
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
            <div>
                <label htmlFor="register-confirm" className={labelClassName}>Confirm password</label>
                <div className="relative">
                    <input
                        id="register-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${inputClassName} pr-16`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 cursor-pointer px-3 text-xs font-medium text-secondary transition-colors hover:text-violet"
                    >
                        {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                </div>
            </div>
            {showRoleSelect && (
                <div>
                    <label htmlFor="register-role" className={labelClassName}>Role</label>
                    <select
                        id="register-role"
                        name="role"
                        value={role}
                        onChange={handleRoleChange}
                        className={`${inputClassName} cursor-pointer appearance-none`}
                    >
                        <option value="" disabled>Select a role</option>
                        {roles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
            )}
            <Button type="submit" disabled={isSubmitting} variant="primary" className="mt-1 w-full py-2.5" >
                {isSubmitting ? "Creating account..." : "Register"}
            </Button>
        </form>
    );
}
