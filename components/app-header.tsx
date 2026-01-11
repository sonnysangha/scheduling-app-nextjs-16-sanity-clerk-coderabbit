"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Calendar, CalendarCheck, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const leftNavItems = [
  { href: "/availability", label: "Availability", icon: Calendar },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
];

const rightNavItems = [
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();

  const renderNavItem = (item: (typeof leftNavItems)[number]) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-2 sm:px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-blue-600 text-white"
            : "text-blue-100 hover:bg-blue-600 hover:text-white",
        )}
      >
        <Icon className="size-4" />
        <span className="hidden sm:inline">{item.label}</span>
      </Link>
    );
  };

  return (
    <header className="border-b bg-blue-500">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/availability" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Calvero
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {leftNavItems.map(renderNavItem)}
          </nav>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {rightNavItems.map(renderNavItem)}
          </nav>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
