"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, History, Home, LogOut, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Home", icon: Home },
  { href: "/admin/sessions", label: "Sessions", icon: MessageSquare },
  { href: "/admin/corrections", label: "Corrections", icon: ClipboardList },
  { href: "/admin/history", label: "History", icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-4">
      <div className="mb-6">
        <h1 className="text-sm font-semibold">Chatbot admin</h1>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Talks directly to the RiveScript KB, not affected by CHAT_PROVIDER.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </aside>
  );
}
