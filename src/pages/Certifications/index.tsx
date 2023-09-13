import React from "react";
import { Title } from "@components/Title";
import Background from "@components/Background";

export const Certifications = () => {
  const backgroundDesign = [
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 0],
  ];

  return (
    <div id="certifications">
      <Background backgroundDesign={backgroundDesign}>
        <Title name="Training and Certifications" lineDirection="right" />
      </Background>
    </div>
  );
};

export default Certifications;
