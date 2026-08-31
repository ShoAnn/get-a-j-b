"use client"

import { useState } from "react";
import Button from "./Button";
import { apiClient } from "@/lib/client/api";
import { RegisterSchema } from "@/types/auth";
import { useRouter } from "next/navigation";
import z from "zod";

const roles = ["admin", "user"];

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
        setIsSubmitting(true);
        if (!isFormValid) {
            setError("Please enter a valid username/password");
            setIsSubmitting(false);
            return;
        }

        const parsedInput = RegisterSchema.safeParse({ email, username, password, confirmPassword, role })
        if (!parsedInput.success) {
            setError(parsedInput.error?.issues[0].message);
            setIsSubmitting(false);
            return;
        }

        try {
            await apiClient.post("/auth/register", z.void(), parsedInput.data);
            router.push("/");
        } catch (err) {
            if (err instanceof Error) {
                setError("Login failed " + err);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-3xl flex flex-col border-10 border-midnight">
            {error && <h2 className="text-red-500">{error}</h2>}
            <input
                type="email"
                name="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="username"
                name="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                name="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <input
                type="password"
                name="confirmPassword"
                placeholder="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {showRoleSelect && (
                <select name="role" id="role" value={role} onChange={handleRoleChange} >
                    {roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
            )}
            <Button type="submit" disabled={isSubmitting} variant="primary" >
                {isSubmitting ? "..." : "Register"}
            </Button>
        </form>
    );
}
