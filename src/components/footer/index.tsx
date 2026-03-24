"use client";
import Link from "next/link";
import { Mail, Github } from "lucide-react";
import { motion } from "motion/react";

export function Footer() {
  return (
    <motion.footer
      className="flex w-full text-tertiary bg-gray-950 backdrop-blur justify-center items-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 sm:justify-center sm:items-center">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand / About */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="sm:justify-center sm:items-center sm:w-full sm:flex sm:flex-col"
          >
            <Link
              href="/"
              className="flex items-center justify-center gap-2 mb-4"
            >
              <motion.span
                className="text-xl text-primary font-semibold tracking-widest"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                WM
              </motion.span>
            </Link>
            <p className="text-sm text-tertiary flex justify-center font-semibold lg:max-w-xs sm:w-full sm:max-w-full">
              Wilson Medeiros
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className=""
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h4 className="flex justify-center mb-3 text-sm font-semibold uppercase tracking-wide  text-tertiary">
              Quick Links
            </h4>
            <ul className="flex flex-col items-center space-y-2 text-sm ">
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Link href="/about" className="hover:text-primary transition">
                  About
                </Link>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                viewport={{ once: true }}
              >
                <Link href="/resume" className="hover:text-primary transition">
                  Resume
                </Link>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                viewport={{ once: true }}
              >
                <Link
                  href="/featured-works"
                  className="hover:text-primary transition"
                >
                  Featured Works
                </Link>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                viewport={{ once: true }}
              >
                <Link href="/contact" className="hover:text-primary transition">
                  Contact
                </Link>
              </motion.li>
            </ul>
          </motion.div>

          {/* Social & Newsletter */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:justify-center sm:items-center"
          >
            <h4 className="flex mb-3 text-sm font-semibold uppercase tracking-wide  lg:justify-end lg:items-end text-tertiary justify-center sm:items-center w-full">
              Stay Connected
            </h4>
            <div className="flex gap-4 mb-4 w-full lg:justify-end justify-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href="#"
                  aria-label="Github"
                  className="hover:text-primary transition"
                >
                  <Github className="h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href="mailto:info@example.com"
                  aria-label="Email"
                  className="hover:text-primary transition"
                >
                  <Mail className="h-5 w-5" />
                </Link>
              </motion.div>
            </div>
            <motion.p
              className="flex text-xs text-muted-foreground  w-full lg:justify-end justify-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              viewport={{ once: true }}
            >
              © {new Date().getFullYear()} Wilson Medeiros. All rights reserved.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
}
