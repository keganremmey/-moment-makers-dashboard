"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/tasks", label: "Tasks" },
  { href: "/wins", label: "Wins" },
  { href: "/sessions", label: "Sessions" },
  { href: "/journal", label: "Journal" },
  { href: "/patterns", label: "Patterns" },
  { href: "/skills", label: "Skills" },
  { href: "/library", label: "Library" },
];

export function DashboardNav({ token }: { token: string }) {
  const pathname = usePathname();
  const base = `/d/${token}`;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-paper-line pb-1 lg:hidden">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive =
          tab.href === "" ? pathname === base : pathname.startsWith(href);

        return (
          <Link
            key={tab.href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`dashboard-tab${isActive ? " is-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
