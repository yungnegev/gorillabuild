"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BoltIcon,
  CalendarDaysIcon,
  FlagIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/workout", label: "Workout", icon: BoltIcon },
  { href: "/plans", label: "Plans", icon: CalendarDaysIcon },
  { href: "/friends", label: "Friends", icon: UsersIcon },
  { href: "/goal", label: "Goal", icon: FlagIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuthPage) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur"
    >
      <ul className="mx-auto grid h-16 max-w-5xl grid-cols-5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? "text-lime-300" : "text-white/65"
                }`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                <span className="text-[10px] leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
