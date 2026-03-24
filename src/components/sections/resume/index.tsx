"use client";
import { QualificationCard } from "@/components/cards/qualification";
import { GraduationCap, Album } from "lucide-react";
import { motion } from "motion/react";
import { qualifications } from "./qualifications";

const educationList = [
  {
    id: "01",
    date: "March 2012 - June 2022",
    title: "Computer Science Bachelor",
    description:
      "This degree provides a strong foundation in the principles and practices of computing and software development. The program covers key areas such as programming, data structures, algorithms, computer architecture, databases, software engineering artificial intelligence, cybersecurity, and web and mobile development.",
    institution: "Universidade do Sul de Santa Catarina - Brazil",
  },
];

export function ResumeSection() {
  return (
    <motion.section
      id="resume"
      className="bg-gray-900 flex flex-col w-full p-6 py-20 justify-center items-center"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-2 max-w-3xl">
          <motion.span
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-primary text-4xl font-bold ">Resume</p>
          </motion.span>
          <motion.p
            className="text-gray-400 text-md  "
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Above some my educational journey so far and relevant certifications
          </motion.p>
        </div>
      </div>
      <motion.div
        className="flex py-10 w-full justify-center items-center flex-col gap-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.span
          className="flex gap-2 justify-center items-center w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <GraduationCap className="w-8 h-8 stroke-primary" />
          <p className="text-xl font-bold text-primary">Education</p>
        </motion.span>
        <div className="flex flex-col gap-6 justify-center items-center">
          {educationList.map((education, index) => (
            <motion.div
              key={education.id}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 1.0 + index * 0.2,
                ease: "easeOut",
              }}
              viewport={{ once: true }}
              className="lg:max-w-[60%] lg:w-[60%] sm:w-full justify-self-center items-center"
            >
              <QualificationCard {...education} />
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="flex py-10 w-full justify-center items-center flex-col gap-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        viewport={{ once: true }}
      >
        <motion.span
          className="flex gap-2 justify-center items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          viewport={{ once: true }}
        >
          <Album className="w-8 h-8 stroke-primary" />
          <p className="text-xl font-bold text-primary">Qualifications</p>
        </motion.span>
        <div className="flex flex-row gap-6 flex-wrap justify-center items-center w-full">
          {qualifications.map((qualification, index) => (
            <motion.div
              className="lg:max-w-[40%] lg:w-[40%] sm:w-full"
              key={qualification.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 1.6 + index * 0.2,
                ease: "easeOut",
              }}
              viewport={{ once: true }}
            >
              <QualificationCard {...qualification} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
