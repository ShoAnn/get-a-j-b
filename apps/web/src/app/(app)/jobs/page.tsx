
import { JobsList } from "@/components/JobsList";
import { Suspense } from "react";

export default function JobsPage() {
    return (
        <Suspense fallback={<div />}>
            <JobsList />
        </Suspense>
    );
}
