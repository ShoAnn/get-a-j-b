import z from "zod";

// Shape returned by Go API: GET /api/me, PUT /api/me
export const ApiUserSchema = z.object({
    id: z.union([z.number(), z.string()]),
    username: z.string(),
    email: z.email(),
    role: z.string().optional().default("user"),
    created_at: z.string().optional().default(""),
    updated_at: z.string().optional().default(""),
});

export type ApiUser = z.infer<typeof ApiUserSchema>;

// Frontend-friendly shape
export const MeSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.email(),
    role: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Me = z.infer<typeof MeSchema>;

export function toMe(apiUser: ApiUser): Me {
    return {
        id: String(apiUser.id),
        username: apiUser.username,
        email: apiUser.email,
        role: apiUser.role ?? "user",
        createdAt: apiUser.created_at ?? "",
        updatedAt: apiUser.updated_at ?? "",
    };
}

export const UpdateMeSchema = z.object({
    username: z.string().min(5, "Username must be at least 5 characters").optional(),
    email: z.email("Must be a valid email address").optional(),
});

export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;
