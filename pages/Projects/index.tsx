import React from 'react'
import { Title } from '../../components/Title'
import Background from '../Background'

export const Projects = () => {


    const backgroundDesign  = [
        [1,0,0,0],
        [0,0,0,1],
        [0,0,0,1],
        [0,0,0,1]
    ]

    return (
        <div id="projects">
            <Background backgroundDesign={backgroundDesign}>
                <Title name='Projects' lineDirection='left' />
            </Background>
        </div>
    )
}
