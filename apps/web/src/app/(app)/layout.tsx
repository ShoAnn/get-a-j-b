import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { JobsRefreshProvider } from "@/components/JobsRefresh";
import { requireAuth } from "@/lib/requireAuth";
import { redirect } from "next/navigation";

export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // const branch = process.env.BRANCH;
    // if (branch == "prod" && branch == "production") {
    //     await requireAuth();
    // }
    try {
      await requireAuth();
    } catch {
      redirect('/login');
    }
    return (
        <JobsRefreshProvider>
        <div className="h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
            </div>
        </div>
        </JobsRefreshProvider>
    );
}
