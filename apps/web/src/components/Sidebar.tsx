"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    href: "/jobs",
    label: "Jobs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="4.5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.5 4.5V3a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0111.5 3v1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3 9h12" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    href: "/resumes",
    label: "Resumes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white dark:border-[#333355] dark:bg-[#1A1A2E] lg:block">
      <nav className="flex flex-col gap-1 px-3 pt-4">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet/10 text-violet dark:bg-violet/15 dark:text-violet"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-[#9999AA] dark:hover:bg-[#252540]"
              }`}
            >
              <span className="shrink-0">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
