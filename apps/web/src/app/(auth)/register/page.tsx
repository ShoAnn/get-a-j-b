import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-secondary">
        Start tracking your job search in minutes.
      </p>
      <div className="mt-6">
        <RegisterForm showRoleSelect={false} />
      </div>
      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-violet underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
