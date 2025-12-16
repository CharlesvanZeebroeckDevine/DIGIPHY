import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import './PrimaryButton.css'
import { useAudio } from '../../audio/AudioContext.js'

export default function PrimaryButton({
    text,
    onClick,
    className = '',
    duration = 0.5,
    stagger = 0.05
}) {
    const charsRef = useRef([])
    const containerRef = useRef(null)
    const fillRef = useRef(null)
    const tlRef = useRef(null)
    const audio = useAudio()

    const chars = text.split('').map((char, index) => ({
        char,
        isSpace: char === ' ',
        id: index
    }))

    useEffect(() => {
        const ctx = gsap.context(() => {
            tlRef.current = gsap.timeline({ paused: true })

            tlRef.current.to(fillRef.current, {
                y: '0%',
                borderRadius: '0% 0% 0 0', 
                duration: duration,
                ease: 'power2.inOut' 
            }, 0)

            tlRef.current.to(charsRef.current, {
                y: '-100%',
                duration: duration,
                stagger: stagger,
                ease: 'power2.out'
            }, 0) 

        }, containerRef)

        return () => ctx.revert()
    }, [text, duration, stagger])

    const handleMouseEnter = () => {
        if (tlRef.current) tlRef.current.play()
        if (window.matchMedia?.('(hover: hover)').matches) {
            void audio.play('hover')
        }
    }

    const handleMouseLeave = () => {
        if (tlRef.current) tlRef.current.reverse()
        if (window.matchMedia?.('(hover: hover)').matches) {
            void audio.play('hoverout')
        }
    }

    return (
        <div
            ref={containerRef}
            className={`footer_btn ${className}`.trim()}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={fillRef}
                className="footer_btn_fill"
                style={{ borderRadius: '50% 50% 0 0' }}
            />
            {chars.map((item, i) => {
                if (item.isSpace) {
                    return <span key={i} className="footer_char_space">&nbsp;</span>
                }
                return (
                    <span className="footer_char_wrapper" key={i}>
                        <span
                            ref={el => charsRef.current[i] = el}
                            className="footer_char"
                            data-letter={item.char}
                        >
                            {item.char}
                        </span>
                    </span>
                )
            })}
        </div>
    )
}
