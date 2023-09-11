import React from 'react'
import { Carousel, CarouselBody, CarouselFooter } from '../../components/Carousel'
import { Certificate, CertificateProps } from '../../components/Certificate'
import { Title } from '../../components/Title'
import Background from '../Background'
import ias from '../../assets/img/unisul.jpeg'

export const Education = () => {
    const backgroundDesign = [
        [0, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 0]
    ]

    const certificates = [
        { id: "11", title: "Computer Science Bachelor", 
        content: "This education has equipped me with a strong foundation in technology and problem-solving, enabling me to tackle complex challenges and contribute to the world of computing", 
        image: './assets/img/unisul.jpeg' },
    ]

    return (
        <div id="education">
            <Background backgroundDesign={backgroundDesign} direction='column'>
                <Title name='Education' lineDirection='right' />
                <Carousel>
                    <CarouselBody<CertificateProps>
                        data={certificates}
                    >
                        {certificates.map(certificate => (
                            <Certificate key={certificate.title} {...certificate} />
                        ))}
                    </CarouselBody>
                    <CarouselFooter>
                        <div className='timeline'>
                            <div className='circle' />
                            <div className='line' />
                        </div>
                        <div className='year-container'>
                            <p>2022</p>
                        </div>
                    </CarouselFooter>
                </Carousel>
            </Background>
        </div>
    )
}
