import React, { useEffect, useState } from 'react'
import Background from '../Background'

// SVG
import WhatsAppSVG from '../../assets/icons/whatsapp.svg'
import LinkedInSVG from '../../assets/icons/linkedin.svg'
import GithubSVG from '../../assets/icons/github.svg'
import { NavBar } from '../../components/Navbar'
import Image from 'next/image'

export const Home = () => {

    const [navClass, setNavClass] = useState<string>("navbar-home")

    const backgroundDesign = [
        [1, 1, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1]
    ]

    useEffect(() => {
        const addClassToNav = () => {
            if (window.scrollY >= 600) {
                setNavClass("nav-scroll")
            } else {
                setNavClass("navbar-home")
            }
        }
        window.addEventListener('scroll', addClassToNav)
        return () => {
            window.removeEventListener('scroll', addClassToNav)
        }
    }, [])

    return (
        <div id="home">
            <Background backgroundDesign={backgroundDesign}   >
                <div className='profile-container'>
                    <div className='profile-picture'>
                        <div className='profile-image' >
                        </div>
                    </div>
                    <div className='profile-title'>
                        <h1>Wilson Medeiros Jr.</h1>
                        <h2>Software Engineer</h2>
                    </div>
                    <div className='profile-quote'>
                        <p className='quote-text'>
                            {`"Imagination is more important than knowledge. 
                        For knowledge is limited, whereas imagination 
                        embraces the entire world, stimulating progress, 
                        giving birth to evolution."`}
                        </p>
                        <p className='quote-author'>Albert Einstein</p>
                    </div>
                    <div className='profile-social'>
                        <div className='social-container'>
                           <Image src={LinkedInSVG} width={25} height={25} alt="linkedin svg" />
                        </div>
                        <div className='social-container'>
                        <Image src={GithubSVG} width={25} height={25} alt="github svg" />
                        </div>
                        <div className='social-container'>
                        <Image src={WhatsAppSVG} width={25} height={25} alt="whatsapp svg" />
                        </div>
                    </div>
                </div>
                {navClass === 'navbar-home' ? (
                    <NavBar navClass={navClass} />
                ) : (
                    <div className='navbar-home' />
                )}


            </Background>
            {navClass === 'nav-scroll' && (
                <NavBar navClass={navClass} />
            )}

        </div>
    )
}
