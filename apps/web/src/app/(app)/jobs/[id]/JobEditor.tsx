"use client";

import { Job, UpdateJob } from "@/types/job";
import { useState } from "react";

const UpdateJobInitState: UpdateJob = {
    title: "",
    company: "",
    location: "",
    salary: 0,
    description: "",
    requirements: "",
    sourceURL: "",
    status: "draft",
    notes: "",
    jobPortal: "",
}

export default async function JobEditor({ job }: { job: Job }) {
    const [formData, setFormData] = useState<UpdateJob>(UpdateJobInitState);
    const [isEditing, setIsEditing] = useState<Boolean>(false);
    const [errors, setErrors] = useState<Partial<Record<keyof UpdateJob, string>>>({});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsEditing(true);
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof UpdateJob]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };
    const handleSave = async (e: React.SubmitEvent) => {
        e.preventDefault();
    }

    // id: z.string(),
    // userId: z.string(),
    // title: z.string(),
    // company: z.string(),
    // location: z.string(),
    // salary: z.number(),
    // description: z.string(),
    // requirements: z.string(),
    // status: z.enum(statusArray),
    // statusChangedAt: z.string(),
    // notes: z.string(),
    // sourceURL: z.string(),
    // jobPortal: z.string(),
    // createdAt: z.string(),
    return (
        <form onSubmit={handleSave}>
            <label htmlFor="title">title</label>
            <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
            />
        </form>
    )
}
