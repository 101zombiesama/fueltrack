"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  Flame,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "Food Log", icon: UtensilsCrossed },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold mr-8">
          <Flame className="h-5 w-5 text-orange-500" />
          <span>FuelTrack</span>
        </Link>
        <nav className="flex gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.username}
            {user.is_admin && (
              <span className="ml-1 rounded bg-orange-500/15 px-1.5 py-0.5 text-xs text-orange-600 dark:text-orange-400">
                admin
              </span>
            )}
          </span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
