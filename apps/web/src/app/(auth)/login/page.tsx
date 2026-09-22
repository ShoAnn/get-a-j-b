import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
    return (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome back
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                Sign in to pick up where you left off.
            </p>
            <div className="mt-6">
                <LoginForm />
            </div>
            <p className="mt-6 border-t border-border pt-5 text-center text-sm text-secondary">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="font-medium text-violet underline-offset-4 hover:underline"
                >
                    Create one
                </Link>
            </p>
        </div>
    );
}
