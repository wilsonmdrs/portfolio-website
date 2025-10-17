import { Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import { DownloadCV } from "./downloadCV";

export function HeroSection() {
  return (
    <section className="bg-gray-900 min-h-screen flex flex-col w-full p-6">
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-4 max-w-2xl">
          <span className="flex items-center gap-2">
            <span className="w-6.5 h-[1px] bg-primary" />
            <p className="text-primary">Hello</p>
          </span>
          <span>
            <p className="flex text-4xl gap-2 font-bold">
              {"I'm"}
              <span className="text-primary">Wilson</span>Medeiros
            </p>
          </span>
          <p className="text-gray-300">
            Software Engineer specialized on Frontend Development building with
            high quality web and mobile applications for Android and iOS
            platforms
          </p>
          <DownloadCV />
        </div>
      </div>
      <div className="flex gap-4 mb-4 w-full justify-start max-w-[1440px]">
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
      </div>
    </section>
  );
}
