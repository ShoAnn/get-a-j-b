import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { requireAuth } from "@/lib/requireAuth";

export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireAuth();
    return (
        <>
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
            </div>
        </>
    );
}
