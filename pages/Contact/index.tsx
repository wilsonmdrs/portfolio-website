import React from 'react'
import Image from 'next/image'
import { Title } from '../../components/Title'
import Background from '../Background'

// Assets
import WhatsappIcon from '../../assets/icons/whatsapp-rounded.svg'
import GithubIcon from '../../assets/icons/github-rounded.svg'
import TelegramIcon from '../../assets/icons/telegram-rounded.svg'
import LinkedinIcon from '../../assets/icons/linkedin-rounded.svg'
import MailIcon from '../../assets/icons/google-rounded.svg'

export const Contact = () => {
    const backgroundDesign  = [
        [1,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
        [1,1,1,1]
    ]

    return (
        <div id="contact">
            <Background backgroundDesign={backgroundDesign} direction='column'>
                <Title name='Contact' lineDirection='left' />
                <div className='icon-container'>
                    <Image className='contact-icon' src={TelegramIcon} alt="telegram" />
                    <Image className='contact-icon' src={WhatsappIcon} alt="telegram" />
                    <Image className='contact-icon' src={GithubIcon} alt="telegram" />
                    <Image className='contact-icon' src={LinkedinIcon} alt="telegram" />
                    <Image className='contact-icon' src={MailIcon} alt="telegram" />
                </div>
            </Background>
        </div>
    )
}
