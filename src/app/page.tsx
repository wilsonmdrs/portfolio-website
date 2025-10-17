import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { AboutSection } from "@/components/sections/about";
import { HeroSection } from "@/components/sections/hero";
import { ResumeSection } from "@/components/sections/resume";
import { SkillsSection } from "@/components/sections/skills";

export default function Home() {
  return (
    <div className="font-sans flex flex-1 flex-col items-center justify-items-center min-h-screen">
      <Navbar />
      <main className="flex flex-col  flex-1 row items-center w-full   sm:items-start">
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ResumeSection />
      </main>
      <Footer />
    </div>
  );
}
