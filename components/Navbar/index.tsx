import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface NavBarProps {
  navClass: string;
}
export const NavBar = ({ navClass }: NavBarProps) => {

  const router = useRouter()

  




  return (
    <nav className={`${navClass}`}>
      <div className="nav-profile">
        <div className="title-container">
          <h1>Wilson Medeiros</h1>
          <h2>Software Engineer</h2>
        </div>
      </div>
      
      <Link scroll={false} 
      
      
      
      
      
      
      
      href={"#home"} className={`${router.asPath === '/' || router.asPath === '/#home'  ? 'navitem-selected':'navitem'}`}>
        Home
      </Link>
      <Link scroll={false}  href={"#education"}  className={`${router.asPath === '/#education' ? 'navitem-selected':'navitem'}`}>
        Education
      </Link>
      <Link scroll={false} href={"#skills"}  className={`${router.asPath === '/#skills' ? 'navitem-selected':'navitem'}`}>
        Skills
      </Link>
      <Link scroll={false} href={"#experience"}  className={`${router.asPath === '/#experience' ? 'navitem-selected':'navitem'}`}>
        Experience
      </Link>
      <Link scroll={false} href={"#projects"}  className={`${router.asPath === '/#projects' ? 'navitem-selected':'navitem'}`}>
        Projects
      </Link>
      <Link scroll={false} href={"#certifications"}  className={`${router.asPath === '/#certifications' ? 'navitem-selected':'navitem'}`}>
        Certifications
      </Link>
      <Link scroll={false} href={"#contact"}  className={`${router.asPath === '/#contact' ? 'navitem-selected':'navitem'}`}>
        Contact
      </Link>
    </nav>
  );
};
