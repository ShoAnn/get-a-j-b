"use client"

import { useState } from "react";
import Button from "./Button";
import { apiClient } from "@/lib/client/api";
import { RegisterSchema } from "@/types/auth";
import { useRouter } from "next/navigation";
import { HttpError } from "@/types/errors";
import z from "zod";

const roles = ["admin", "user"];

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
    const [role, setRole] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const isFormValid = email.length > 0 && password.length > 0 && username.length > 0;

    const router = useRouter();

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRole(e.target.value)
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError("");
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
            router.push("/");
        } catch (err) {
            setError(messageForRegisterError(err));
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
            <label htmlFor="register-email" className="sr-only">Email</label>
            <input
                id="register-email"
                type="email"
                name="email"
                placeholder="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="register-username" className="sr-only">Username</label>
            <input
                id="register-username"
                type="username"
                name="username"
                placeholder="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="register-password" className="sr-only">Password</label>
            <input
                id="register-password"
                type="password"
                name="password"
                placeholder="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="register-confirm" className="sr-only">Confirm password</label>
            <input
                id="register-confirm"
                type="password"
                name="confirmPassword"
                placeholder="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {showRoleSelect && (
                <label htmlFor="register-role" className="sr-only">Role</label>
            )}
            {showRoleSelect && (
                <select id="register-role" name="role" value={role} onChange={handleRoleChange} >
                    {roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
            )}
            <Button type="submit" disabled={isSubmitting} variant="primary" >
                {isSubmitting ? "Creating account..." : "Register"}
            </Button>
        </form>
    );
}
