import z from "zod"
import { UserSchema } from "./user"

export const RegisterSchema = z.object({
    id: z.string(),
    email: z.email(),
    username: z.string().min(3),
    password: z.string().min(6),
    confirmPassword: z.string(),
    role: z.enum(['admin', 'user'])
}).refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"]
})
export const RegisterResponseSchema = z.object({
    user: UserSchema,
})
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>

export const LoginFormSchema = z.object({
    email: z.email(),
    password: z.string()
})

export const LoginResponseSchema = z.object({
    user: UserSchema,
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

