import { Button } from "@/components/ui/button";

export function AboutSection() {
  return (
    <section className="bg-gray-950  flex flex-col w-full p-6 py-20">
      <div className="flex flex-1 max-w-[1440px] w-full justify-center flex-col items-center ">
        <div className="flex flex-col gap-6 max-w-3xl">
          <span className="flex items-center gap-4 pb-6">
            <span className="w-8.5 h-[2px] bg-primary" />
            <p className="text-primary text-4xl font-bold ">About me</p>
          </span>
          <p className="text-gray-300 text-sm pb-4">
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
          </p>
          <Button className="uppercase bg-primary rounded w-fit p-6 px-15 cursor-pointer font-bold text-sm tracking-wide ">
            HIRE ME
          </Button>
        </div>
      </div>
    </section>
  );
}
