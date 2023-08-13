import React from 'react'
import { ExperienceComponent, ExperienceComponentProps } from '../../components/ExperienceComponent'
import { Title } from '../../components/Title'
import Background from '../Background'

export const Experience = () => {


    const backgroundDesign  = [
        [0,1,1,1],
        [0,0,0,0],
        [1,0,0,0],
        [1,0,0,0]
    ]

    const experiences = [
        {title:"Senior Frontend Developer", company:"Red IT", period:"Jul 2022 - Present", 
        activities:['Developed design interfaces based on design patterns.', 'Worked on a DevOps environment.',
        "Developed documentation about Testing React Components with Jest and provided training sessions in order to help team members to apply unit test on components.",
        "Provided assistance for Junior Frontend Developers.",
        "Worked on bug fixes providing measures to prevent future performance issues"]},
        {title:"Senior Frontend Developer", company:"Red IT", period:"Jul 2022 - Present", 
        activities:['Developed design interfaces based on design patterns.', 'Worked on a DevOps environment.',
        "Developed documentation about Testing React Components with Jest and provided training sessions in order to help team members to apply unit test on components.",
        "Provided assistance for Junior Frontend Developers.",
        "Worked on bug fixes providing measures to prevent future performance issues"]},
        {title:"Senior Frontend Developer", company:"Red IT", period:"Jul 2022 - Present", 
        activities:['Developed design interfaces based on design patterns.', 'Worked on a DevOps environment.',
        "Developed documentation about Testing React Components with Jest and provided training sessions in order to help team members to apply unit test on components.",
        "Provided assistance for Junior Frontend Developers.",
        "Worked on bug fixes providing measures to prevent future performance issues"]},
    ] as ExperienceComponentProps[]

    return (
        <div id="experience">
            <Background backgroundDesign={backgroundDesign} direction='column' >
                <Title name='Experience' lineDirection='right' />
                <div className='experience-content'>
                    {experiences.map((experience) => (
                        <ExperienceComponent key={experience.title} {...experience}/>
                    ))}
                </div>
            </Background>
        </div>
    )
}
