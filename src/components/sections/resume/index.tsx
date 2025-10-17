import { CarouselSkills } from "@/components/carousel-skills";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export function ResumeSection() {
  return (
    <section className="bg-gray-900  flex flex-col w-full p-6 py-20">
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-2 max-w-3xl">
          <span className="flex items-center justify-center gap-4">
            <p className="text-primary text-4xl font-bold ">Resume</p>
          </span>
          <p className="text-gray-400 text-md  ">
            Above some professional contribution and personal projects
            developed. Enjoy!
          </p>
        </div>
      </div>
      <div className="flex p-10 w-full justify-center items-center flex-col gap-6">
        <span className="flex gap-2 justify-center items-center">
          <GraduationCap className="w-8 h-8 stroke-primary" />
          <p className="text-xl font-bold text-primary">Education</p>
        </span>
        <Card className="min-w-120 max-w-180 rounded bg-gray-950">
          <CardContent className="gap-2 flex flex-col">
            <p className="text-sm font-medium text-gray-400">
              March 2012 - June 2022
            </p>
            <p className="text-md font-bold text-primary">
              Computer Science Bachelor
            </p>
            <p className="text-sm font-bold text-gray-300">
              This degree provides a strong foundation in the principles and
              practices of computing and software development. The program
              covers key areas such as programming, data structures, algorithms,
              computer architecture, databases, software engineering, artificial
              intelligence, cybersecurity, and web and mobile development.
            </p>
            <p className="text-sm font-medium text-gray-400">
              Universidade do Sul de Santa Catarina - Brazil
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
