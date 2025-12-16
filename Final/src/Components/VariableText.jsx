
import React, { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function VariableText({
    children,
    className = '',
    baseSettings = { wght: 300, slnt: 100, CNTR: 100 },
    hoverSettings = { wght: 700, slnt: 0, CNTR: 0 },
    radius = 400,
    fullEffectRadius = 250
}) {
    const containerRef = useRef(null)
    const charsMapRef = useRef(new Map())
    const mouseRef = useRef({ x: 0, y: 0 })

    // 1. Mouse Tracking (Passive listener)
    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX
            mouseRef.current.y = e.clientY
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    // 2. Remove static caching - Read layout in loop for scroll support
    // (We removed the resize listener/layout effect because we check every frame now)

    // 3. Animation Loop (GSAP Ticker)
    useEffect(() => {
        const update = () => {
            const { x, y } = mouseRef.current

            // READ STEP: Get all positions first to avoid layout thrashing
            // This is necessary because the element moves during scroll
            const chars = Array.from(charsMapRef.current.values())
            const charRects = chars.map(char => {
                if (!char) return null
                const rect = char.getBoundingClientRect()
                return {
                    char,
                    cx: rect.left + rect.width / 2,
                    cy: rect.top + rect.height / 2
                }
            })

            // WRITE STEP: Apply styles
            charRects.forEach((item) => {
                if (!item) return
                const { char, cx, cy } = item

                const dx = x - cx
                const dy = y - cy
                const dist = Math.sqrt(dx * dx + dy * dy)

                // Calculate factor with a plateau
                // If dist < fullEffectRadius, factor is 1
                // If dist > radius, factor is 0
                const rawFactor = 1 - ((dist - fullEffectRadius) / (radius - fullEffectRadius))
                const factor = Math.max(0, Math.min(1, rawFactor))

                // "Early" factor for things that should react sooner (Slant/Contrast)
                // easeOutQuad / sqrt curve: starts fast, slows down
                const earlyFactor = Math.pow(factor, 0.9)

                // Interpolate
                // Weight uses linear (standard feel)
                const wght = gsap.utils.mapRange(0, 1, baseSettings.wght, hoverSettings.wght, factor)
                // Slant and Contrast use earlyFactor to start morphing further away
                const slnt = gsap.utils.mapRange(0, 1, baseSettings.slnt, hoverSettings.slnt, earlyFactor)
                const CNTR = gsap.utils.mapRange(0, 1, baseSettings.CNTR, hoverSettings.CNTR, earlyFactor)

                // Letter Spacing (Optional)
                if (baseSettings.letterSpacing !== undefined && hoverSettings.letterSpacing !== undefined) {
                    const tracking = gsap.utils.mapRange(0, 1, baseSettings.letterSpacing, hoverSettings.letterSpacing, factor)
                    char.style.letterSpacing = `${tracking}px`
                }

                // Apply efficiently
                char.style.fontVariationSettings = `'wght' ${wght}, 'slnt' ${slnt}, 'CNTR' ${CNTR}`
            })
        }

        gsap.ticker.add(update)
        return () => gsap.ticker.remove(update)
    }, [baseSettings, hoverSettings, radius, fullEffectRadius])


    // 4. Recursive Child Processor to build span tree
    const processChildren = (node, i) => {
        if (!node) return null

        if (typeof node === 'string') {
            return node.split('').map((char, charIndex) => (
                <span
                    key={`${i}-${charIndex}`}
                    ref={el => {
                        const key = `${i}-${charIndex}`
                        if (el) charsMapRef.current.set(key, el)
                        else charsMapRef.current.delete(key)
                    }}
                    style={{
                        display: 'inline-block',
                        whiteSpace: 'pre' // Preserve spacing
                    }}
                >
                    {char}
                </span>
            ))
        }

        if (React.isValidElement(node)) {
            // Passthrough for breaks
            if (node.type === 'br') return <br key={i} />

            // Recurse
            return React.cloneElement(node, { key: i },
                React.Children.map(node.props.children, (child, childIndex) =>
                    processChildren(child, `${i}-${childIndex}`)
                )
            )
        }

        return node
    }

    return (
        <div ref={containerRef} className={className}>
            {React.Children.map(children, (child, i) => processChildren(child, i))}
        </div>
    )
}
