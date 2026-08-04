"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/tasks", label: "Tasks" },
  { href: "/wins", label: "Wins" },
  { href: "/sessions", label: "Sessions" },
  { href: "/skills", label: "Skills" },
  { href: "/library", label: "Library" },
];

export function DashboardNav({ token }: { token: string }) {
  const pathname = usePathname();
  const base = `/d/${token}`;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-ink-line pb-1">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive =
          tab.href === "" ? pathname === base : pathname.startsWith(href);

        return (
          <Link
            key={tab.href}
            href={href}
            className={`rounded-t-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-ink-raised text-brass"
                : "text-paper-dim hover:text-paper"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
