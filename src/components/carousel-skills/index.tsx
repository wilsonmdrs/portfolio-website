import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skill } from "@/types";

export interface CarouselSkills {
  skills: Skill[];
}

export function CarouselSkills({ skills }: CarouselSkills) {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full p4 "
    >
      <CarouselContent>
        {skills.map((skill) => (
          <CarouselItem
            key={skill.name}
            className="md:basis-1/3 lg:basis-1/5 sm:basis-1 "
          >
            <div className="p-1">
              <Card className="bg-gray-950">
                <CardContent className="flex aspect-square items-center justify-center p-2 flex-col ">
                  <span className="text-xl font-semibold text-primary">
                    {skill.name}
                  </span>
                  <span className="text-lg font-semibold">{skill.years}+</span>
                  <span className="text-sm font-semibold text-tertiary">
                    years
                  </span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
