import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface NavBarProps {
  navClass: string;
}
export const NavBar = ({ navClass }: NavBarProps) => {
  const router = useRouter();
  const [selected, setSelected] = useState("home");

  useEffect(() => {
    const observer = () => {
      const scrollPosition = window.scrollY;
      const screenHeight = window.innerHeight;
      if (scrollPosition < screenHeight * 0.7 && selected !== "home") {
        setSelected("home");
      }
      if (
        scrollPosition > screenHeight * 0.7 &&
        scrollPosition < screenHeight * 1.5 &&
        selected !== "education"
      ) {
        setSelected("education");
      }
      if (
        scrollPosition > screenHeight * 1.5 &&
        scrollPosition < screenHeight * 2.5 &&
        selected !== "skills"
      ) {
        setSelected("skills");
      }
      if (
        scrollPosition > screenHeight * 2.5 &&
        scrollPosition < screenHeight * 3.5 &&
        selected !== "experience"
      ) {
        setSelected("experience");
      }
      if (
        scrollPosition > screenHeight * 3.5 &&
        scrollPosition < screenHeight * 4.5 &&
        selected !== "projects"
      ) {
        setSelected("projects");
      }
      if (
        scrollPosition > screenHeight * 4.5 &&
        scrollPosition < screenHeight * 5.5 &&
        selected !== "contact"
      ) {
        setSelected("contact");
      }
    };

    router && window.addEventListener("scroll", observer, true);

    return () => {
      window.removeEventListener("scroll", observer, true);
    };
  }, [router, selected]);

  return (
    <nav className={`${navClass}`}>
      <div className="nav-profile">
        <div className="title-container">
          <h1>Wilson Medeiros</h1>
          <h2>Software Engineer</h2>
        </div>
      </div>
      <Link
        scroll={false}
        href={"#home"}
        className={`${selected === "home" ? "navitem-selected" : "navitem"}`}
      >
        Home
      </Link>
      <Link
        scroll={false}
        href={"#education"}
        className={`${
          selected === "education" ? "navitem-selected" : "navitem"
        }`}
      >
        Education
      </Link>
      <Link
        scroll={false}
        href={"#skills"}
        className={`${selected === "skills" ? "navitem-selected" : "navitem"}`}
      >
        Skills
      </Link>
      <Link
        scroll={false}
        href={"#experience"}
        className={`${
          selected === "experience" ? "navitem-selected" : "navitem"
        }`}
      >
        Experience
      </Link>
      <Link
        scroll={false}
        href={"#projects"}
        className={`${
          selected === "projects" ? "navitem-selected" : "navitem"
        }`}
      >
        Projects
      </Link>
      <Link
        scroll={false}
        href={"#contact"}
        className={`${selected === "contact" ? "navitem-selected" : "navitem"}`}
      >
        Contact
      </Link>
    </nav>
  );
};
