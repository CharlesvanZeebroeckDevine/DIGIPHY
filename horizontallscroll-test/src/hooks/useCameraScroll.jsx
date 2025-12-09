import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useThree } from '@react-three/fiber'

gsap.registerPlugin(ScrollTrigger)

export const useCameraScroll = () => {
  const { camera } = useThree()
  const timelineRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#car-usecases',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        markers: {
          startColor: 'blue',
          endColor: 'purple',
          fontSize: '18px',
          fontWeight: 'bold',
          indent: 20
        },
        id: 'camera-movement'
      }
    })

    // Animate camera to the right wall to show use case posters
    tl.to(camera.position, {
      x: 15,
      y: 4,
      z: -10,
      duration: 1,
      ease: 'power2.inOut'
    })
    .to(camera.rotation, {
      y: Math.PI / 2,
      duration: 1,
      ease: 'power2.inOut'
    }, '<')

    timelineRef.current = tl

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [camera])

  return null
}
