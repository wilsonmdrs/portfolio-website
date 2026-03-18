import Link from "next/link";
import { Mail, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="flex w-full text-tertiary bg-gray-950 backdrop-blur justify-center items-center">
      <div className="w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand / About */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-xl text-primary font-semibold tracking-widest ">
                WM
              </span>
            </Link>
            <p className="text-sm text-tertiary font-semibold max-w-xs">
              Wilson Medeiros
            </p>
          </div>

          {/* Quick Links */}
          <div className="">
            <h4 className="flex justify-center mb-3 text-sm font-semibold uppercase tracking-wide  text-tertiary">
              Quick Links
            </h4>
            <ul className="flex flex-col items-center space-y-2 text-sm ">
              <li>
                <Link href="/about" className="hover:text-primary transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/resume" className="hover:text-primary transition">
                  Resume
                </Link>
              </li>
              <li>
                <Link
                  href="/featured-works"
                  className="hover:text-primary transition"
                >
                  Featured Works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div>
            <h4 className="flex mb-3 text-sm font-semibold uppercase tracking-wide  justify-end items-end text-tertiary">
              Stay Connected
            </h4>
            <div className="flex gap-4 mb-4 w-full justify-end">
              <Link
                href="#"
                aria-label="Github"
                className="hover:text-primary transition"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:info@example.com"
                aria-label="Email"
                className="hover:text-primary transition"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
            <p className="flex text-xs text-muted-foreground  w-full justify-end">
              © {new Date().getFullYear()} Wilson Medeiros. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
