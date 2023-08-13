import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import { SkillComponent } from '../../components/SkillComponent'
import { Title } from '../../components/Title'
import Background from '../Background'

export const Skills = () => {
    const [isVisible, setIsVisible] = useState(false)
    const router = useRouter()
    const backgroundDesign  = [
        [1,0,0,0],
        [1,0,0,0],
        [1,0,0,0],
        [0,1,1,1]
    ]

    const ref = useRef<HTMLDivElement|null>(null)

    const skills = [
        {name: "Javascript", level:4},{name: "Typescript", level:4},
        {name: "Tailwind", level:3},{name: "ReactJS", level:4},
        {name: "NextJS", level:4}, {name: "React Native", level:3},
        {name: "Bootstrap", level:3}, {name: "Sass", level:4},
        {name: "Python", level:3}, {name: "Testing Library", level:4},
        {name: "Jest", level:4}, {name: "SQL", level:3},
        {name: "NodeJS", level:3},
        {name: "Figma", level:4}, {name: "Adobe XD", level:3},
        {name: "Github", level:3},
       

    ]

    useEffect(() => {
        let isLocated = false
        const observer = (e:Event) => {
            if (ref.current && router) {
                const scrollPositon = window.scrollY
                const element = {
                    height:ref.current.offsetTop + ref.current.clientHeight,
                    position:ref.current.offsetTop
                } 
                const isVisible = (scrollPositon > element.position && scrollPositon < element.position + 5)
                isLocated = (router.asPath === '/#skills' && isVisible)
                if (isVisible) {
                   !isLocated && router.push('',{hash:"skills",  }, {scroll:false, })
                }
            }

        }

        router && window.addEventListener('scroll', observer, true)
        
        return () => {
           window.removeEventListener('scroll', observer, true)
            isLocated = false
        }
    }, [router])

    // useEffect(() => {

    //     if(isVisible && router.asPath !== '/#skills') router.push('/', {hash:"#skills"}, {scroll:false, })

    // },[isVisible, router])

    return (
        <div ref={ref} id="skills">
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
