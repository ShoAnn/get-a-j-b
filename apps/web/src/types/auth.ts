import z from "zod"

export const RegisterSchema = z.object({
    email: z.email(),
    username: z.string().min(3),
    password: z.string().min(6),
    confirmPassword: z.string(),
    role: z.enum(['admin', 'user']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"]
})

export const LoginFormSchema = z.object({
    email: z.email(),
    password: z.string()
})

export const AuthResponseSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.string()
})

export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const LogoutResponseSchema = z.void();
