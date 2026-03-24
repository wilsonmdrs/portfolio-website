"use client";
import { CarouselSkills } from "@/components/carousel-skills";
import { Skill } from "@/types";
import { motion } from "motion/react";

function calculateSkillTime(since: string): string {
  const sinceDate = new Date(since);
  const today = new Date();

  const years = today.getFullYear() - sinceDate.getFullYear();

  return String(
    today <
      new Date(today.getFullYear(), sinceDate.getMonth(), sinceDate.getDate())
      ? years - 1
      : years,
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
    <motion.section
      id="skills"
      className="bg-gray-900 flex flex-col w-full p-6 py-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-6 max-w-3xl">
          <motion.span
            className="flex items-center gap-4 pb-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className="w-8.5 h-[2px] bg-primary" />
            <p className="text-primary text-4xl font-bold ">My Skills</p>
          </motion.span>
        </div>
      </div>
      <motion.div
        className="flex p-10"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
      >
        <CarouselSkills skills={skills} />
      </motion.div>
    </motion.section>
  );
}
