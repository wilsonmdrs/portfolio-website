import React from "react";
import {
  ExperienceComponent,
  ExperienceComponentProps,
} from "@components/ExperienceComponent";
import { Title } from "@components/Title";
import Background from "components/Background";
import Carousel from "nuka-carousel";

// Assets
import RightIcon from "@assets/icons/chevron-right-solid.svg";
import LeftIcon from "@assets/icons/chevron-left-solid.svg";
import Image from "next/image";

export const Experience = () => {
  const backgroundDesign = [
    [0, 1, 1, 1],
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ];

  const experiences = [
    {
      title: "Senior React Native Developer",
      company: "Mobiweb",
      period: "Jun 2023 - Present",
      activities: [
        "Developed design interfaces based on design patterns.",
        "Worked on a DevOps environment.",
        "Developed documentation about Testing React Components with Jest and provided training sessions in order to help team members to apply unit test on components.",
        "Provided assistance for Junior Frontend Developers.",
        "Worked on bug fixes providing measures to prevent future performance issues",
      ],
    },
    {
      title: "Senior React Developer",
      company: "Red IT",
      period: "Jul 2022 - Abr 2023",
      activities: [
        "Developed design interfaces based on design patterns.",
        "Worked on a DevOps environment.",
        "Developed documentation about Testing React Components with Jest and provided training sessions in order to help team members to apply unit test on components.",
        "Provided assistance for Junior Frontend Developers.",
        "Worked on bug fixes providing measures to prevent future performance issues",
      ],
    },
    {
      title: "Software Engineer",
      company: "Exact Code",
      period: "Aug 2019 - Apr 2022",
      activities: [
        "Developed design interfaces based on design patterns.",
        "Worked on a DevOps environment.",
        "Developed documentation about Testing React Components with Jest and provided training sessions in order to help team members to apply unit test on components.",
        "Provided assistance for Junior Frontend Developers.",
        "Worked on bug fixes providing measures to prevent future performance issues",
      ],
    },
    {
      title: "Software Engineer",
      company: "Exact Code",
      period: "Mar 2017 - Aug 2019",
      activities: [
        "Developed design interfaces based on design patterns.",
        "Worked on a DevOps environment.",
        "Developed documentation about Testing React Components with Jest and provided training sessions in order to help team members to apply unit test on components.",
        "Provided assistance for Junior Frontend Developers.",
        "Worked on bug fixes providing measures to prevent future performance issues",
      ],
    },
  ] as ExperienceComponentProps[];

  return (
    <div id="experience">
      <Background backgroundDesign={backgroundDesign} direction="column">
        <Title name="Experience" lineDirection="right" />
        <div className="experience-content">
          <Carousel
            slidesToShow={3}
            dragging
            wrapAround
            cellSpacing={0}
            renderCenterLeftControls={({ previousSlide }) => (
              <button className="wrapper-button" onClick={previousSlide}>
                <Image src={LeftIcon} alt="move left" width={20} />
              </button>
            )}
            renderCenterRightControls={({ nextSlide }) => (
              <button className="wrapper-button" onClick={nextSlide}>
                <Image src={RightIcon} alt="move right" width={20} />
              </button>
            )}
          >
            {experiences.map((experience) => (
              <ExperienceComponent key={experience.period} {...experience} />
            ))}
          </Carousel>
        </div>
      </Background>
    </div>
  );
};

export default Experience;
