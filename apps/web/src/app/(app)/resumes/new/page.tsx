"use client";

import { useRouter } from "next/navigation";
import ResumeEditor from "@/components/ResumeEditor";
import { useResumesRefresh } from "@/components/ResumesRefresh";
import { DEFAULT_RESUME_CONTENT, DEFAULT_RESUME_LABEL } from "@/lib/resumeTemplate";
import type { Resume } from "@/types/resume";

const TEMPLATE_RESUME: Resume = {
    id: "",
    userId: "",
    label: DEFAULT_RESUME_LABEL,
    content: DEFAULT_RESUME_CONTENT,
    updatedAt: null,
};

export default function NewResumePage() {
    const router = useRouter();
    const { bumpVersion } = useResumesRefresh();

    function handleSaved(created: Resume) {
        bumpVersion(created.id);
        router.push("/resumes");
    }

    return <ResumeEditor mode="create" initialResume={TEMPLATE_RESUME} onSaved={handleSaved} />;
}
