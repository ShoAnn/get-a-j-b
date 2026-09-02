"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useToast } from "./Toast";

export default function Header() {
    const router = useRouter();
    const { showToast } = useToast();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
            if (
                showMobileMenu &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(e.target as Node) &&
                hamburgerRef.current &&
                !hamburgerRef.current.contains(e.target as Node)
            ) {
                setShowMobileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMobileMenu]);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 768) {
                setShowMobileMenu(false);
            }
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        setIsLoggingOut(true);
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok && res.status !== 204) {
                const body = await res.json().catch(() => ({} as Record<string, unknown>));
                const message =
                    (typeof body.message === "string" && body.message) ||
                    (typeof body.error === "string" && body.error) ||
                    "We couldn't sign you out. Please try again.";
                showToast(message, "error");
                setIsLoggingOut(false);
                return;
            }
            setShowUserMenu(false);
            setShowMobileMenu(false);
            router.push("/login");
            router.refresh();
        } catch {
            showToast("Unable to reach the server. Please check your connection.", "error");
            setIsLoggingOut(false);
        }
    }

    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-[#333355] dark:bg-[#1A1A2E]/80">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-4 lg:px-6">
                {/* Logo */}
                <Link href="/" className="flex shrink-0 items-center gap-2">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-violet">
                        <rect x="3" y="5" width="16" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M7 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11 5V3a2 2 0 012-2h0a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span className="text-base font-semibold tracking-tight text-midnight dark:text-[#F5F5F0]">
                        Get a J*b
                    </span>
                </Link>

                {/* Desktop: Right actions */}
                <div className="ml-auto hidden items-center gap-4 md:flex">
                    {/* Notifications */}
                    <button className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-[#9999AA] dark:hover:bg-[#2E2E4A]">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M9 1.5a5.5 5.5 0 00-5.5 5.5v2.5l-1.5 3h14l-1.5-3V7A5.5 5.5 0 009 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                            <path d="M6.5 14a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error ring-1 ring-white dark:ring-[#1A1A2E]" />
                    </button>

                    {/* User avatar / profile menu */}
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={() => setShowUserMenu((v) => !v)}
                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-violet text-xs font-medium text-white transition-opacity hover:opacity-90"
                        >
                            U
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 bg-surface py-1.5 shadow-lg dark:border-[#333355] dark:bg-[#252540]">
                                <div className="border-b border-zinc-200 px-4 py-2.5 dark:border-[#333355]">
                                    <p className="text-sm font-medium text-midnight dark:text-[#F5F5F0]">User</p>
                                    <p className="text-xs text-text-secondary dark:text-[#9999AA]">user@example.com</p>
                                </div>
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-midnight transition-colors hover:bg-zinc-50 dark:text-[#F5F5F0] dark:hover:bg-[#2E2E4A]"
                                    onClick={() => setShowUserMenu(false)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-zinc-400">
                                        <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M2 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                    Account
                                </Link>
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-midnight transition-colors hover:bg-zinc-50 dark:text-[#F5F5F0] dark:hover:bg-[#2E2E4A]"
                                    onClick={() => setShowUserMenu(false)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-zinc-400">
                                        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M7.5 5v3M7.5 10v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                    Settings
                                </Link>
                                <hr className="my-1 border-zinc-200 dark:border-[#333355]" />
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    aria-label="Log out"
                                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-error transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#2E2E4A]"
                                >
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-error">
                                        <path d="M5.5 3.5V2a1 1 0 011-1h4a1 1 0 011 1v11a1 1 0 01-1 1h-4a1 1 0 01-1-1v-1.5" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M2 7.5h6m-2-2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {isLoggingOut ? "Signing out..." : "Log out"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Theme toggle */}
                    <ThemeToggle />
                </div>

                {/* Mobile: hamburger */}
                <button
                    ref={hamburgerRef}
                    onClick={() => setShowMobileMenu((v) => !v)}
                    className="ml-auto flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-[#9999AA] dark:hover:bg-[#2E2E4A] md:hidden"
                    aria-label="Toggle menu"
                >
                    {showMobileMenu ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile dropdown menu */}
            {showMobileMenu && (
                <div
                    ref={mobileMenuRef}
                    className="border-t border-zinc-200 bg-white px-4 pb-4 pt-3 shadow-lg dark:border-[#333355] dark:bg-[#1A1A2E] md:hidden"
                >
                    <div className="flex flex-col gap-3">
                        {/* Mobile actions row */}
                        <div className="flex items-center gap-3">
                            <button className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-[#9999AA] dark:hover:bg-[#2E2E4A]">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M9 1.5a5.5 5.5 0 00-5.5 5.5v2.5l-1.5 3h14l-1.5-3V7A5.5 5.5 0 009 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                                    <path d="M6.5 14a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error ring-1 ring-white dark:ring-[#1A1A2E]" />
                            </button>

                            <ThemeToggle />
                        </div>

                        {/* Mobile user section */}
                        <div className="rounded-lg border border-zinc-200 dark:border-[#333355]">
                            <div className="flex items-center gap-3 border-b border-zinc-200 px-3 py-2.5 dark:border-[#333355]">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet text-xs font-medium text-white">
                                    U
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-midnight dark:text-[#F5F5F0]">User</p>
                                    <p className="truncate text-xs text-text-secondary dark:text-[#9999AA]">user@example.com</p>
                                </div>
                            </div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-3 py-2 text-sm text-midnight transition-colors hover:bg-zinc-50 dark:text-[#F5F5F0] dark:hover:bg-[#2E2E4A]"
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-zinc-400">
                                    <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M2 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                Account
                            </Link>
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-3 py-2 text-sm text-midnight transition-colors hover:bg-zinc-50 dark:text-[#F5F5F0] dark:hover:bg-[#2E2E4A]"
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-zinc-400">
                                    <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M7.5 5v3M7.5 10v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                Settings
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                aria-label="Log out"
                                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-error transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#2E2E4A]"
                            >
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-error">
                                    <path d="M5.5 3.5V2a1 1 0 011-1h4a1 1 0 011 1v11a1 1 0 01-1 1h-4a1 1 0 01-1-1v-1.5" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M2 7.5h6m-2-2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {isLoggingOut ? "Signing out..." : "Log out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
