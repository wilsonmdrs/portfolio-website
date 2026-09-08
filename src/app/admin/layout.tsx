import { notFound } from "next/navigation";

// Local-dev-only testing tool. Defense-in-depth safety net in case this
// route is ever built/started with NODE_ENV=production by accident — see
// src/lib/adminGuard.ts for the matching guard on the API routes.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return children;
}
