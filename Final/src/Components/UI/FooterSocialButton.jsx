import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import './FooterSocialButton.css'

export default function FooterSocialButton({
    href,
    children,
    className = '',
    duration = 0.5,
    stagger = 0.05,
}) {
    const containerRef = useRef(null)
    const fillRef = useRef(null)
    const tlRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            tlRef.current = gsap.timeline({ paused: true })
            tlRef.current.to(containerRef.current, {
                scale: 1.15,
                duration: duration,
                ease: 'back.out(1.7)',
                stagger: stagger,
            }, 0)

            tlRef.current.to(fillRef.current, {
                height: '100%',
                duration: duration,
                ease: 'power2.inOut',
                stagger: stagger,
            }, 0)

            tlRef.current.to(fillRef.current, {
                borderRadius: '0% 0% 0 0',
                duration: duration * 0.8, 
                ease: 'power2.inOut',
                stagger: stagger,
            }, 0)

        }, containerRef)

        return () => ctx.revert()
    }, [duration, stagger])

    const handleMouseEnter = () => {
        if (tlRef.current) tlRef.current.play()
    }

    const handleMouseLeave = () => {
        if (tlRef.current) tlRef.current.reverse()
    }

    return (
        <a
            ref={containerRef}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`footer_social_btn ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="footer_social_base">
                {children}
            </div>
            <div
                ref={fillRef}
                className="footer_social_mask"
            >
                <div className="footer_social_overlay_icon">
                    {children}
                </div>
            </div>
        </a>
    )
}
