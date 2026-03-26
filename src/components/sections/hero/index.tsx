"use client";
import { Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import { DownloadCV } from "./downloadCV";
import { motion } from "motion/react";
import { ScrollDown } from "@/components/ScrollDown";

export function HeroSection() {
  return (
    <motion.section
      id="hero"
      className="bg-gray-900 min-h-screen flex flex-col w-full p-6 relative"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-4 max-w-2xl">
          <motion.span
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="w-6.5 h-[1px] bg-primary" />
            <p className="text-primary">Hello</p>
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="flex text-4xl gap-2 font-bold">
              {"I'm"}
              <span className="text-primary">Wilson</span>Medeiros
            </p>
          </motion.span>
          <motion.p
            className="text-gray-300"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Software Engineer specialized on Frontend Development building with
            high quality web and mobile applications for Android and iOS
            platforms
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <DownloadCV />
          </motion.div>
        </div>
      </div>
      <motion.div
        className="flex gap-4 mb-4 w-full justify-start max-w-[1440px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <Link
          href="#"
          aria-label="Linkedin"
          className="hover:text-primary transition"
        >
          <Linkedin className="h-5 w-5" />
        </Link>
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
        {/* <ScrollDown /> */}
      </motion.div>
    </motion.section>
  );
}
