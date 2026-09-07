import z from "zod";

export const ResumeSchema = z.object({
    id: z.string(),
    userId: z.string(),
    label: z.string(),
    content: z.string(),
});

export type Resume = z.infer<typeof ResumeSchema>;

export const CreateResumeSchema = z.object({
    label: z.string().min(1, "Label is required"),
    content: z.string().min(1, "Content is required"),
});

export const UpdateResumeSchema = z.object({
    label: z.string().optional(),
    content: z.string().optional(),
});

export type CreateResume = z.infer<typeof CreateResumeSchema>;
export type UpdateResume = z.infer<typeof UpdateResumeSchema>;
