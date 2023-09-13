import Link from "next/link";
import WhatsappIcon from "../../assets/icons/whatsapp-footer.svg";
import GithubIcon from "../../assets/icons/github-footer.svg";
import TelegramIcon from "../../assets/icons/telegram-footer.svg";
import LinkedinIcon from "../../assets/icons/linkedin-footer.svg";
import MailIcon from "../../assets/icons/google-footer.svg";
import Image from "next/image";
export const Footer = () => {
  return (
    <footer>
      <div className="content-container">
        <div className="title-container">
          <h1>Wilson Medeiros</h1>
          <h2>Software Engineer</h2>
        </div>
        <div className="navigation">
          <Link className="nav-item" scroll={false} href={"#home"}>
            Home
          </Link>
          <Link className="nav-item" scroll={false} href={"#education"}>
            Education
          </Link>
          <Link className="nav-item" scroll={false} href={"#skills"}>
            Skills
          </Link>
          <Link className="nav-item" scroll={false} href={"#experience"}>
            Experience
          </Link>
          <Link className="nav-item" scroll={false} href={"#projects"}>
            Projects
          </Link>
          <Link className="nav-item" scroll={false} href={"#contact"}>
            Contact
          </Link>
        </div>
        <div className="contacts">
          <Image className="contact-icon" src={TelegramIcon} alt="telegram" />
          <Image className="contact-icon" src={WhatsappIcon} alt="telegram" />
          <Image className="contact-icon" src={GithubIcon} alt="telegram" />
          <Image className="contact-icon" src={LinkedinIcon} alt="telegram" />
          <Image className="contact-icon" src={MailIcon} alt="telegram" />
        </div>
      </div>
      <div className="rights">
        <p>Designed and Develloped by Wilson Medeiros Jr. - 2023</p>
      </div>
    </footer>
  );
};
