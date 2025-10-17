"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Utility to join classNames
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/featured-works", label: "Featured Works" },
  { href: "/contact", label: "Contact" },
];

// Desktop link
function DesktopLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <NavigationMenuLink
      asChild
      className={cn(
        "px-3 py-2 text-sm weight-bold font-medium rounded transition  hover:text-gray-900 hover:bg-primary",
        isActive ? "bg-primary/10 text-primary" : "text-white"
      )}
    >
      <Link href={href}>{label}</Link>
    </NavigationMenuLink>
  );
}

// Mobile link
function MobileLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block w-full rounded-xl px-3 py-2 text-base",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

// Cart button (desktop)
// function CartButton({ count }: { count: number }) {
//   return (
//     <Button
//       asChild
//       variant="ghost"
//       size="icon"
//       className="relative hidden md:inline-flex"
//       aria-label="Open cart"
//     >
//       <Link href="/cart">
//         <ShoppingCart className="h-5 w-5 stroke-white" />
//         {count > 0 && (
//           <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-primary-foreground">
//             {count}
//           </span>
//         )}
//       </Link>
//     </Button>
//   );
// }

export function Navbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="fixed top-0 z-50 w-full bg-gray-900">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo (left) */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl text-primary font-semibold tracking-widest ">
              WM
            </span>
          </Link>
        </div>

        {/* Desktop Nav (center) */}
        <div className="hidden flex-1 justify-center md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-8">
              {NAV_LINKS.map((l) => (
                <NavigationMenuItem key={l.href}>
                  <DesktopLink href={l.href} label={l.label} />
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Desktop cart button */}
          {/* <CartButton count={cartCount} /> */}

          {/* Mobile menu trigger on the RIGHT */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-6 w-6 stroke-white" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[84%] sm:max-w-sm p-0">
              <SheetHeader className="px-4 pt-4 pb-2 border-b">
                <SheetTitle className="text-left text-base">Menu</SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((l) => (
                  <MobileLink
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    onClick={() => setOpen(false)}
                  />
                ))}
                {/* <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex  items-center justify-between rounded-xl bg-muted px-3 py-2"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Cart
                  </span>
                  {cartCount > 0 && (
                    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </Link> */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
