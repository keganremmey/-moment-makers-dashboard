"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HouseSimple,
  ListChecks,
  Trophy,
  ChatCircleText,
  Microphone,
  Fingerprint,
  Medal,
  BookOpen,
} from "@phosphor-icons/react";

const NAV = [
  { href: "", label: "Overview", Icon: HouseSimple },
  { href: "/tasks", label: "Tasks", Icon: ListChecks },
  { href: "/wins", label: "Wins", Icon: Trophy },
  { href: "/sessions", label: "Sessions", Icon: ChatCircleText },
  { href: "/journal", label: "Journal", Icon: Microphone },
  { href: "/patterns", label: "Patterns", Icon: Fingerprint },
  { href: "/skills", label: "Skills", Icon: Medal },
  { href: "/library", label: "Library", Icon: BookOpen },
];

// Persistent left rail on wide screens, so where you are and where you can
// go stay visible at all times instead of competing with page content for
// space at the top. Below lg, DashboardNav's horizontal tabs take over
// (this component renders nothing there), since a fixed-width rail on a
// phone-size viewport eats too much of the one thing there's little of.
export function Sidebar({
  token,
  clientName,
}: {
  token: string;
  clientName: string;
}) {
  const pathname = usePathname();
  const base = `/d/${token}`;

  return (
    <aside className="sidebar hidden lg:flex">
      <div className="sidebar-brand">
        <img src="/bamboo.svg" alt="" aria-hidden="true" className="h-9 w-auto opacity-90" />
        <div>
          <p className="sidebar-brand-label">Moment Makers</p>
          <p className="sidebar-brand-name">{clientName}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ href, label, Icon }) => {
          const target = `${base}${href}`;
          const isActive =
            href === "" ? pathname === base : pathname.startsWith(target);

          return (
            <Link
              key={href}
              href={target}
              aria-current={isActive ? "page" : undefined}
              className={`sidebar-link${isActive ? " is-active" : ""}`}
            >
              <Icon size={19} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="sidebar-footer">Built with Kegan</p>
    </aside>
  );
}
