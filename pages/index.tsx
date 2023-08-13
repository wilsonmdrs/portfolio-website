import { Home } from "./Home";
import { Education } from "./Education";
import { Skills } from "./Skills";
import { Experience } from "./Experience";
import { Projects } from "./Projects";
import { Certifications } from "./Certifications";
import { Contact } from "./Contact";
import { Footer } from "../components/Footer";

export default function App() {
  return (
    <div className="container">
      <Home />
      <Education />
      <Skills />
      <Experience />
      <Projects />
      <Certifications />
      <Contact />
      <Footer />
    </div>
  );
}
