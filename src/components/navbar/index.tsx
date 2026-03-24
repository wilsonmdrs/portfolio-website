"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  { href: "#hero", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#resume", label: "Resume" },
  // { href: "#featured-works", label: "Featured Works" },
  // { href: "#contact", label: "Contact" },
];

// Desktop link
function DesktopLink({
  href,
  label,
  activeSection,
}: {
  href: string;
  label: string;
  activeSection: string;
}) {
  const isActive = activeSection === href;
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <NavigationMenuLink
        asChild
        className={cn(
          "px-3 py-2 text-sm weight-bold font-medium rounded transition hover:text-gray-900 hover:bg-primary",
          isActive ? "bg-primary/10 text-primary" : "text-white",
        )}
      >
        <Link href={href}>{label}</Link>
      </NavigationMenuLink>
    </motion.div>
  );
}

// Mobile link
function MobileLink({
  href,
  label,
  activeSection,
  onClick,
}: {
  href: string;
  label: string;
  activeSection: string;
  onClick?: () => void;
}) {
  const isActive = activeSection === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block w-full rounded-xl px-3 py-2 text-base",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>("#hero");

  React.useEffect(() => {
    // Function to update active section based on scroll position
    const updateActiveSection = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Find the section that's most visible in the viewport
      let currentSection = "#hero"; // Default to hero

      NAV_LINKS.forEach((link) => {
        const element = document.querySelector(link.href);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + scrollY;
          const elementHeight = rect.height;

          // Check if the element is in the upper portion of the viewport
          if (
            scrollY >= elementTop - windowHeight * 0.3 &&
            scrollY < elementTop + elementHeight - windowHeight * 0.3
          ) {
            currentSection = link.href;
          }
        }
      });

      setActiveSection(currentSection);
    };

    // Set initial active section
    updateActiveSection();

    // Add scroll listener as primary method
    window.addEventListener("scroll", updateActiveSection, { passive: true });

    // Also try IntersectionObserver as backup
    const timeoutId = setTimeout(() => {
      const sections = NAV_LINKS.map((link) =>
        document.querySelector(link.href),
      ).filter(Boolean);

      if (sections.length > 0) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.target.id) {
                setActiveSection(`#${entry.target.id}`);
              }
            });
          },
          {
            root: null,
            rootMargin: "-20% 0px -60% 0px",
            threshold: 0.1,
          },
        );

        sections.forEach((section) => {
          if (section) observer.observe(section);
        });

        return () => observer.disconnect();
      }
    }, 100);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <motion.header
      className="fixed top-0 z-50 w-full bg-gray-900"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo (left) */}
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link href="/" className="flex items-center gap-2">
            <motion.span
              className="text-xl text-primary font-semibold tracking-widest"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              WM
            </motion.span>
          </Link>
        </motion.div>

        {/* Desktop Nav (center) */}
        <div className="hidden flex-1 justify-center md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-8">
              {NAV_LINKS.map((l) => (
                <NavigationMenuItem key={l.href}>
                  <DesktopLink
                    href={l.href}
                    label={l.label}
                    activeSection={activeSection}
                  />
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Mobile menu trigger on the RIGHT */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={open ? "Close menu" : "Open menu"}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={open ? "close" : "open"}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {open ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Menu className="h-6 w-6 stroke-white" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent side="right" className="w-[84%] sm:max-w-sm p-0">
              <SheetHeader className="px-4 pt-4 pb-2 border-b">
                <SheetTitle className="text-left text-base">Menu</SheetTitle>
              </SheetHeader>

              <motion.nav
                className="flex flex-col gap-1 p-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {NAV_LINKS.map((l, index) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.1 + index * 0.1,
                      ease: "easeOut",
                    }}
                  >
                    <MobileLink
                      href={l.href}
                      label={l.label}
                      activeSection={activeSection}
                      onClick={() => {
                        setOpen(false);
                        setActiveSection(l.href);
                      }}
                    />
                  </motion.div>
                ))}
              </motion.nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
