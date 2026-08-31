import { Job } from "@/types/job";

export function createMockJobs(): Job[] {
    return [
        {
            id: "job-1",
            userId: "mock-user",
            title: "Senior Frontend Engineer",
            company: "Acme Inc.",
            location: "Remote",
            salary: 145000,
            description:
                "Own the customer-facing web experience. Build accessible, performant interfaces in React and TypeScript, partner with design on the component library, and mentor mid-level engineers.",
            requirements:
                "5+ years of frontend experience. Deep React and TypeScript knowledge. Experience with design systems and testing (Vitest/RTL). Strong CSS fundamentals.",
            status: "interview_scheduled",
            statusChangedAt: "2026-08-12T09:30:00.000Z",
            notes: "Recruiter screen went well. Prep system design + past project deep-dive for the panel on Aug 20.",
            sourceURL: "https://acme.example.com/careers/senior-frontend-engineer",
            jobPortal: "LinkedIn",
            createdAt: "2026-07-02T14:00:00.000Z",
        },
        {
            id: "job-2",
            userId: "mock-user",
            title: "Backend Engineer",
            company: "Globex Corp.",
            location: "Austin, TX",
            salary: 132000,
            description:
                "Design and scale distributed services handling millions of requests per day. Work across Go, Postgres, and Kafka with a small on-call-free team.",
            requirements:
                "3+ years building backend services. Go or strong willingness to migrate from another compiled language. SQL and data-modeling skills.",
            status: "submitted",
            statusChangedAt: "2026-08-05T10:00:00.000Z",
            notes: "Applied via referral from Dana. Follow up if no response after two weeks.",
            sourceURL: "https://globex.example.com/jobs/backend-engineer",
            jobPortal: "Referral",
            createdAt: "2026-08-05T09:15:00.000Z",
        },
        {
            id: "job-3",
            userId: "mock-user",
            title: "Full Stack Developer",
            company: "Initech",
            location: "Chicago, IL (Hybrid)",
            salary: 118000,
            description:
                "Ship features end-to-end across a Next.js frontend and a Node.js API. Small team, high autonomy, weekly deploys.",
            requirements:
                "Proficiency in TypeScript on both client and server. Familiarity with Next.js and Prisma. Comfort working directly with stakeholders.",
            status: "under_review",
            statusChangedAt: "2026-08-10T16:45:00.000Z",
            notes: "",
            sourceURL: "https://initech.example.com/careers/full-stack-developer",
            jobPortal: "Indeed",
            createdAt: "2026-07-21T11:30:00.000Z",
        },
        {
            id: "job-4",
            userId: "mock-user",
            title: "Platform Engineer",
            company: "Umbrella Health",
            location: "Boston, MA",
            salary: 158000,
            description:
                "Build internal tooling and CI/CD pipelines for 40+ engineers. Kubernetes, Terraform, and GitHub Actions in a regulated but pragmatic environment.",
            requirements:
                "Experience running production Kubernetes. Infrastructure-as-code with Terraform. Bonus: HIPAA/SOC2 compliance exposure.",
            status: "offer_extended",
            statusChangedAt: "2026-08-18T13:00:00.000Z",
            notes: "Offer: 158k base + 8% bonus. Deadline to respond is Sep 1. Need to negotiate relocation stipend.",
            sourceURL: "https://umbrella.example.com/platform-engineer",
            jobPortal: "Company Website",
            createdAt: "2026-06-15T08:00:00.000Z",
        },
        {
            id: "job-5",
            userId: "mock-user",
            title: "Junior Web Developer",
            company: "Hooli",
            location: "Palo Alto, CA",
            salary: 95000,
            description:
                "Join the growth team to build landing pages and internal dashboards. Great learning environment with weekly code reviews.",
            requirements:
                "1+ year of JavaScript experience. Basic React understanding. Portfolio of personal or school projects.",
            status: "rejected",
            statusChangedAt: "2026-07-30T17:20:00.000Z",
            notes: "Rejected after take-home. Feedback: needed stronger CSS layout skills. Worth retrying in 6 months.",
            sourceURL: "https://hooli.example.com/jobs/junior-web-developer",
            jobPortal: "Glassdoor",
            createdAt: "2026-07-01T19:00:00.000Z",
        },
        {
            id: "job-6",
            userId: "mock-user",
            title: "Staff Software Engineer",
            company: "Vehement Solutions",
            location: "Remote (US)",
            salary: 195000,
            description:
                "Technical lead for the payments platform. Set architecture direction, drive cross-team initiatives, and keep reliability SLOs green.",
            requirements:
                "8+ years overall, 3+ in payments or fintech. Proven track record leading multi-team projects. Strong communication skills.",
            status: "draft",
            statusChangedAt: "2026-08-22T12:00:00.000Z",
            notes: "Tailor resume to highlight the ledger migration project before applying.",
            sourceURL: "https://vehement.example.com/staff-software-engineer",
            jobPortal: "BuiltIn",
            createdAt: "2026-08-22T11:50:00.000Z",
        },
    ];
}
