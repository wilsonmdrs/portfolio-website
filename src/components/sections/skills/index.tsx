import { CarouselSkills } from "@/components/carousel-skills";
import { Skill } from "@/types";

function calculateSkillTime(since: string): string {
  const sinceDate = new Date(since);
  const today = new Date();

  const years = today.getFullYear() - sinceDate.getFullYear();

  return String(
    today <
      new Date(today.getFullYear(), sinceDate.getMonth(), sinceDate.getDate())
      ? years - 1
      : years
  );
}

const skills: Skill[] = [
  { name: "React JS", years: calculateSkillTime("01-03-2017") },
  { name: "React Native", years: calculateSkillTime("01-03-2017") },
  { name: "Javascript", years: calculateSkillTime("01-03-2017") },
  { name: "Typescript", years: calculateSkillTime("01-03-2021") },
  { name: "Node", years: calculateSkillTime("01-03-2019") },
  { name: "Python", years: calculateSkillTime("01-03-2020") },
];

export function SkillsSection() {
  return (
    <section className="bg-gray-900  flex flex-col w-full p-6 py-20">
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-6 max-w-3xl">
          <span className="flex items-center gap-4 pb-6">
            <span className="w-8.5 h-[2px] bg-primary" />
            <p className="text-primary text-4xl font-bold ">My Skills</p>
          </span>
        </div>
      </div>
      <div className="flex p-10">
        <CarouselSkills skills={skills} />
      </div>
    </section>
  );
}
