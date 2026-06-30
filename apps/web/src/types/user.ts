import { z } from "zod";

export const UserSchema = z.object({
    id: z.string(),
    email: z.email(),
    username: z.string().min(3),
    role: z.enum(['admin', 'user']),
    registeredAt: z.date()
})

export type User = z.infer<typeof UserSchema>;
