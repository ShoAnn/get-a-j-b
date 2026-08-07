"use client"

import { useParams } from "next/navigation";
import JobEditor from "./JobEditor"
import { apiClient } from "@/lib/client/api";
import { JobSchema } from "@/types/job";

export default async function JobDetail() {
    const params = useParams();
    const jobID = params.id as string;

    const JOB = await apiClient.get("/jobs/" + jobID, JobSchema)
    return (
        <JobEditor job={JOB} />
    )
}
