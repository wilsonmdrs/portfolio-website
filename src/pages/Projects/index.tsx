import React, { useEffect, useRef, useState } from "react";
import { Title } from "../../components/Title";
import Background from "../../components/Background";
import Image from "next/image";
import ComingSoonSVG from "@assets/icons/coming-soon.svg";
export const Projects = () => {
  const backgroundDesign = [
    [1, 0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ];

  const [percentage, setPercentage] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inteval = setInterval(
      () =>
        setPercentage((prevState) => {
          if (prevState <= 60) {
            return prevState + 0.5;
          }

          if (prevState <= 85) {
            return prevState + 0.25;
          }

          if (prevState <= 90) {
            return prevState + 0.1;
          }
          return 0;
        }),
      25,
    );
    return () => clearInterval(inteval);
  }, []);

  return (
    <div id="projects">
      <Background backgroundDesign={backgroundDesign} direction="column">
        <Title name="Projects" lineDirection="left" />
        <div className="projects-content">
          <Image src={ComingSoonSVG} alt="coming soon image" width={500} />
          <div className="loading-container">
            <div ref={containerRef} className="loading-indicator">
              <div
                ref={ref}
                style={{ width: `${percentage}%` }}
                className="loading-filled"
              />
            </div>
            <div className="loading-percentage">
              <p>{Math.min(percentage).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </Background>
    </div>
  );
};

export default Projects;
