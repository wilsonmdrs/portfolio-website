import React from 'react'
import { Title } from '../../components/Title'
import Background from '../Background'
export const Contact = () => {
    const backgroundDesign  = [
        [1,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
        [1,1,1,1]
    ]

    return (
        <div id="contact">
            <Background backgroundDesign={backgroundDesign}>
                <Title name='Contact' lineDirection='left' />
            </Background>
        </div>
    )
}
