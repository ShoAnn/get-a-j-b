import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { ApiUserSchema, toMe } from "@/types/apiUser";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
    let me;
    try {
        const token = await requireAuth();
        const apiUser = await internalApiClient.get("/me", ApiUserSchema, {
            headers: { Authorization: `Bearer ${token}` },
        });
        me = toMe(apiUser);
    } catch {
        redirect("/login");
    }

    const initial = me.username.charAt(0).toUpperCase() || "U";

    return (
        <div className="flex min-h-full flex-1 flex-col bg-background">
            <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Profile
                </h1>
                <p className="mt-1 text-sm text-secondary">
                    View and update your account details.
                </p>

                <div className="mt-6 rounded-xl border-[0.5px] border-border-strong bg-surface p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet text-base font-medium text-white">
                            {initial}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-medium text-foreground">
                                {me.username}
                            </p>
                            <p className="truncate text-sm text-secondary">{me.email}</p>
                        </div>
                        <span className="ml-auto shrink-0 rounded-lg bg-violet/10 px-2.5 py-1 text-xs font-medium text-violet">
                            {me.role}
                        </span>
                    </div>

                    <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-lg border border-border px-3 py-2">
                            <dt className="text-xs text-secondary">User ID</dt>
                            <dd className="mt-0.5 font-medium text-foreground">{me.id}</dd>
                        </div>
                        <div className="rounded-lg border border-border px-3 py-2">
                            <dt className="text-xs text-secondary">Member since</dt>
                            <dd className="mt-0.5 font-medium text-foreground">
                                {me.createdAt ? new Date(me.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </dd>
                        </div>
                    </dl>

                    <hr className="my-6 border-border" />

                    <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">
                        Edit profile
                    </h2>
                    <ProfileForm initial={me} />
                </div>
            </div>
        </div>
    );
}
