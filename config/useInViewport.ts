import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";

export function useInViewport(elementId:string): { ref: any } {
    const [isVisible, setIsVisible] = useState(false)
    const router = useRouter()
    const ref = useRef<HTMLElement|null>(null)
  

    const setRef = useCallback((node: HTMLElement | null) => {
        if (node !== null) {
            ref.current = node
        }
    }, [ref]);


    useEffect(() => {
        const observer = (e:Event) => {
            if (ref.current) {
                const scrollPositon = window.scrollY
                const element = {
                    height:ref.current.offsetTop + ref.current.clientHeight,
                    position:ref.current.offsetTop
                } 
                if (scrollPositon >= element.position && scrollPositon <= element.height) {
                    setIsVisible(true)
                }else { 
                    setIsVisible(false)
                }
            }

        }

        window.addEventListener('scroll', observer, true)
        
        return () => {
           window.removeEventListener('scroll', observer)
        }
    }, [])

    useEffect(() => {

        if(isVisible && router.asPath !== `${elementId}` && elementId) router.push('/', {hash:`${elementId}`}, {scroll:false, })
    },[router, isVisible, elementId])

    return { ref: setRef };
}