"use client"

import { useState } from "react";
import Button from "./Button";
import z from "zod";
import { apiClient } from "@/lib/apiClient";
import { LoginFormSchema } from "@/types/auth";

const emailSchema = z.object({
    email: z.email("Invalid email format")
})

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const isFormValid = email.length > 0 && password.length > 0;

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = emailSchema.safeParse(email);
        if (!result.success) {
            setError(result.error?.issues[0].message)
            return;
        }

        try {
            const res = await apiClient.post("/api/auth/login", LoginFormSchema, { email, password });
        } catch (err) {
            if (err instanceof Error) {
                setError("Login failed")
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                name="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input type="password" name="password" placeholder="password" />
            <Button type="button" variant="primary" >Submit</Button>
        </form>
    );
}
