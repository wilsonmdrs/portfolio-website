import React, { useEffect, useRef, useState } from 'react'
import { SkillComponent } from '../../components/SkillComponent'
import { Title } from '../../components/Title'
import Background from '../Background'
import { useRouter } from 'next/router'

export const Skills = () => {
    const backgroundDesign  = [
        [1,0,0,0],
        [1,0,0,0],
        [1,0,0,0],
        [0,1,1,1]
    ]


    const skills = [
        {name: "Javascript", level:5},{name: "Typescript", level:5},
        {name: "Tailwind", level:3},{name: "ReactJS", level:5},
        {name: "NextJS", level:5}, {name: "React Native", level:5},
        {name: "Bootstrap", level:3}, {name: "Sass", level:4},
        {name: "Python", level:3}, {name: "Testing Library", level:4},
        {name: "Jest", level:4}, {name: "SQL", level:3},
        {name: "NodeJS", level:3},
        {name: "Figma", level:4}, {name: "Adobe XD", level:3},
        {name: "Github", level:4},{name: "Storybook", level:4}
    ]

    return (
        <div id="skills">
            <Background backgroundDesign={backgroundDesign} direction='column' >
                <Title name='Skills' lineDirection='left' />
                <div className='skill-content'>
                    {skills.map((skill) => (
                        <div key={skill.name} className='skill-item'>
                            <SkillComponent {...skill} />
                        </div>
                    ))}
                </div>  
            </Background>
        </div>
    )
}
