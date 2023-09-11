import React from "react";
import {
  ExperienceComponent,
  ExperienceComponentProps,
} from "../../components/ExperienceComponent";
import { Title } from "../../components/Title";
import Background from "../Background";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
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
          <Swiper
             effect={'coverflow'}
             loop={true}
              initialSlide={0}
            // centeredSlides={true}
             grabCursor={true}
             spaceBetween={5}
             slidesPerView={'auto'}
             coverflowEffect={{
                scale:0.9,
               rotate: -10,
               stretch: 2,
               depth:100,
               modifier: 1,
               slideShadows:false
             }}
             loopedSlides={4}
             navigation={true}
             pagination={{
              clickable: true,
            }}
             modules={[EffectCoverflow, Pagination, Navigation]}
          >
            {experiences.map((experience) => (
              <SwiperSlide  key={experience.period}>
                <ExperienceComponent {...experience} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Background>
    </div>
  );
};
