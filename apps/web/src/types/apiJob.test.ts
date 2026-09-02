import { describe, it, expect } from "vitest";
import { ApiJobListSchema, toJobs } from "./apiJob";

const baseJob = {
    id: 1,
    user_id: 1,
    title: "Engineer",
    company: "Acme",
    location: "Remote",
    salary: 100000,
    description: "",
    requirements: "",
    status_changed_at: "2026-09-02 06:51:02",
    notes: "",
    source_url: "https://example.com",
    job_portal: "LinkedIn",
    created_at: "2026-09-02 06:51:02",
};

describe("ApiJobSchema", () => {
    it("parses a well-formed Go payload", () => {
        const parsed = ApiJobListSchema.parse([{ ...baseJob, current_status: "submitted" }]);
        expect(parsed[0].current_status).toBe("submitted");
    });

    it("trims padded current_status values from the Go CHAR column", () => {
        const parsed = ApiJobListSchema.parse([{ ...baseJob, current_status: "submitted                                         " }]);
        expect(parsed[0].current_status).toBe("submitted");
    });

    it("rejects an unknown status after trimming", () => {
        expect(() => ApiJobListSchema.parse([{ ...baseJob, current_status: "frozen" }])).toThrow();
    });

    it("accepts numeric id and user_id", () => {
        const parsed = ApiJobListSchema.parse([{ ...baseJob, id: 42, user_id: 7, current_status: "draft" }]);
        expect(parsed[0].id).toBe(42);
        expect(parsed[0].user_id).toBe(7);
    });

    it("accepts string id and user_id", () => {
        const parsed = ApiJobListSchema.parse([{ ...baseJob, id: "42", user_id: "7", current_status: "draft" }]);
        expect(parsed[0].id).toBe("42");
        expect(parsed[0].user_id).toBe("7");
    });
});

describe("toJobs", () => {
    it("normalizes to the UI Job shape with string ids and camelCase fields", () => {
        const [job] = toJobs([
            {
                id: 1,
                user_id: 1,
                title: "Engineer",
                company: "Acme",
                location: "Remote",
                salary: 100000,
                description: "x",
                requirements: "y",
                current_status: "submitted",
                status_changed_at: "2026-09-02 06:51:02",
                notes: "n",
                source_url: "https://example.com",
                job_portal: "LinkedIn",
                created_at: "2026-09-02 06:51:02",
            },
        ]);
        expect(job).toMatchObject({
            id: "1",
            userId: "1",
            status: "submitted",
            sourceURL: "https://example.com",
        });
    });
});
