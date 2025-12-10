import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import './StaggerButton.css'

export default function StaggerButton({
    text,
    onClick,
    active = false,
    className = '',
    duration = 0.5,
    stagger = 0.05
}) {
    const charsRef = useRef([])
    const containerRef = useRef(null)
    const tlRef = useRef(null)

    // Split text into characters
    const chars = text.split('').map((char, index) => ({
        char,
        isSpace: char === ' ',
        id: index
    }))

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Create the timeline but pause it initially
            // We animate 'y' to -100% to slide the current letter up
            // and pull the pseudo-element (::after) into view from the bottom
            tlRef.current = gsap.timeline({ paused: true })
                .to(charsRef.current, {
                    y: '-100%',
                    duration: duration,
                    stagger: stagger,
                    ease: 'power2.out' // Using a standard ease, can be adjusted
                })
        }, containerRef)

        return () => ctx.revert()
    }, [text, duration, stagger])

    const handleMouseEnter = () => {
        if (tlRef.current) tlRef.current.play()
    }

    const handleMouseLeave = () => {
        if (tlRef.current) tlRef.current.reverse()
    }

    return (
        <div
            ref={containerRef}
            className={`stagger_btn ${active ? 'active' : ''} ${className}`}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {chars.map((item, i) => {
                if (item.isSpace) {
                    return <span key={i} className="stagger_char_space">&nbsp;</span>
                }
                return (
                    <span className="stagger_char_wrapper" key={i}>
                        <span
                            ref={el => charsRef.current[i] = el}
                            className="stagger_char"
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
