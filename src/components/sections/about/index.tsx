"use client";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export function AboutSection() {
  return (
    <motion.section
      id="about"
      className="bg-gray-950 flex flex-col w-full p-6 py-20"
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
            <p className="text-primary text-4xl font-bold ">About me</p>
          </motion.span>
          <motion.p
            className="text-gray-300 text-sm pb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Frontend-focused Software Engineer, working since early 2017 on web
            and mobile applications using React, React Native, and TypeScript.
            Skilled in building responsive, accessible, and user-friendly
            interfaces while ensuring performance and maintainability.
            Experienced in troubleshooting, bug fixing, and writing reliable
            tests with Jest and React Testing Library. Strong collaborator in
            cross-functional teams, contributing to clean code practices,
            documentation, and smooth development workflows. Passionate about
            delivering high-quality solutions and continuously improving
            technical skills.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="uppercase bg-primary rounded w-fit p-6 px-15 cursor-pointer font-bold text-sm tracking-wide ">
              HIRE ME
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
