import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";
import { AdminSidebar } from "./components/AdminSidebar";

// Unrestricted in dev (local testing tool, exactly as before this feature
// existed). In production, gated by a password-derived cookie — see
// adminAuth.ts and /admin/login. This route group exists specifically so
// /admin/login (a sibling, outside this group) is NOT wrapped by this
// layout — a layout has no way to tell "am I rendering the login page
// itself," so without the split, redirecting unauthenticated requests to
// /admin/login would redirect the login page to itself in a loop.
//
// Also the dashboard shell (sidebar + main content) — shared by every real
// route under here (sessions/corrections/history), so each of those pages
// only needs to render its own content, not the surrounding layout.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
    if (!isValidSessionToken(token)) {
      redirect("/admin/login");
    }
  }
  return (
    // h-screen (not min-h-screen) clips this row to exactly the viewport
    // height, so `main`'s own overflow-y-auto is what scrolls instead of
    // the whole page. min-h-0 is also required: a flex item's default
    // min-height is `auto`, which lets it grow past its allotted space to
    // fit tall content (e.g. a long chat transcript) instead of clipping
    // — overflow-y-auto alone doesn't override that, min-h-0 does.
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
