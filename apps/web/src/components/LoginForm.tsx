"use client"

import { useState } from "react";
import Button from "./Button";
import z from "zod";
import { apiClient } from "@/lib/client/api";
import { AuthResponseSchema } from "@/types/auth";
import { useRouter } from "next/navigation";

const emailSchema = z.object({
    email: z.email("Invalid email format")
})

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
        setIsSubmitting(true);
        if (!isFormValid) {
            setError("Please enter a valid username/password");
            setIsSubmitting(false);
            return;
        }

        const result = emailSchema.safeParse({ email });
        if (!result.success) {
            setError(result.error?.issues[0].message);
            setIsSubmitting(false);
            return;
        }

        try {
            await apiClient.post("/api/auth/login", AuthResponseSchema, { email, password });
            setSuccess("login success");
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
            {success && <h2 className="text-red-500">{success}</h2>}
            <input
                type="email"
                name="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                name="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={isSubmitting} variant="primary" >
                {isSubmitting ? "..." : "Submit"}
            </Button>
        </form>
    );
}
