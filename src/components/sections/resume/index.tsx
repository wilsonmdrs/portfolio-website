import { QualificationCard } from "@/components/cards/qualification";
import { GraduationCap, Album } from "lucide-react";

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

const qualificationsList = [
  {
    id: "01",
    date: "February 2022",
    title: "Advanced React",
    description:
      "Create robust and reusable components with advanced techniques and learn different patterns to reuse common behavior",
    institution: "Meta - Coursera",
  },
];
export function ResumeSection() {
  return (
    <section
      id="resume"
      className="bg-gray-900 flex flex-col w-full p-6 py-20 justify-center items-center"
    >
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-2 max-w-3xl">
          <span className="flex items-center justify-center gap-4">
            <p className="text-primary text-4xl font-bold ">Resume</p>
          </span>
          <p className="text-gray-400 text-md  ">
            Above some my educational journey so far and relevant certifications
          </p>
        </div>
      </div>
      <div className="flex py-10 w-full justify-center items-center flex-col gap-6">
        <span className="flex gap-2 justify-center items-center">
          <GraduationCap className="w-8 h-8 stroke-primary" />
          <p className="text-xl font-bold text-primary">Education</p>
        </span>
        {educationList.map((education) => (
          <QualificationCard key={education.id} {...education} />
        ))}
      </div>
      <div className="flex p-10 w-full justify-center items-center flex-col gap-6">
        <span className="flex gap-2 justify-center items-center">
          <Album className="w-8 h-8 stroke-primary" />
          <p className="text-xl font-bold text-primary">Qualifications</p>
        </span>
        <div className="flex flex-row gap-6 flex-wrap justify-center w-full">
          {qualificationsList.map((qualification) => (
            <QualificationCard key={qualification.id} {...qualification} />
          ))}
        </div>
      </div>
    </section>
  );
}
