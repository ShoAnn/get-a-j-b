import z from "zod";
import type { Resume } from "@/types/resume";

export const ApiResumeSchema = z.object({
    id: z.union([z.number(), z.string()]),
    user_id: z.union([z.number(), z.string()]),
    label: z.string(),
    content: z.string(),
});

export type ApiResume = z.infer<typeof ApiResumeSchema>;

export const ApiResumeListSchema = z.array(ApiResumeSchema);

export function toResume(apiResume: ApiResume): Resume {
    return {
        id: String(apiResume.id),
        userId: String(apiResume.user_id),
        label: apiResume.label.trim(),
        content: apiResume.content,
    };
}

export function toResumes(apiResumes: ApiResume[]): Resume[] {
    return apiResumes.map(toResume);
}
