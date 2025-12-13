import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const getClosedSplinePath = (points) => {
    if (!points || points.length < 3) return ''

    let path = `M${points[0].x},${points[0].y}`

    for (let i = 0; i < points.length; i++) {
        const p0 = points[(i - 1 + points.length) % points.length]
        const p1 = points[i]
        const p2 = points[(i + 1) % points.length]
        const p3 = points[(i + 2) % points.length]
        const tension = 0.2
        const cp1x = p1.x + (p2.x - p0.x) * tension
        const cp1y = p1.y + (p2.y - p0.y) * tension
        const cp2x = p2.x - (p3.x - p1.x) * tension
        const cp2y = p2.y - (p3.y - p1.y) * tension
        path += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
    }
    path += ' Z'
    return path
}

const random = (min, max) => Math.random() * (max - min) + min

export const LiquidFooterLine = () => {
    const pathRefs = useRef([])
    const simulationRef = useRef([])
    const [blobCount, setBlobCount] = useState(80)

    const initSimulation = () => {
        const width = window.innerWidth
        const height = window.innerHeight

        const blobs = []

        const buffer = 50

        for (let i = 0; i < blobCount; i++) {

            const cx = random(-buffer, width + buffer)
            const cy = random(-buffer, height + buffer)
            const radius = random(80, 300)

            const vx = random(-0.3, 0.3)
            const vy = random(-0.3, 0.3)

            const pointsCount = 10
            const points = []
            for (let j = 0; j < pointsCount; j++) {
                points.push({
                    angle: (Math.PI * 2 * j) / pointsCount,
                    noiseOffset: random(0, 100),
                    amp: random(10, 30)
                })
            }

            blobs.push({ cx, cy, radius, vx, vy, points })
        }
        simulationRef.current = blobs
    }

    useEffect(() => {
        initSimulation()

        const ticker = () => {
            const time = Date.now() * 0.001
            const width = window.innerWidth
            const height = window.innerHeight
            const buffer = 300 

            simulationRef.current.forEach((blob, i) => {
                const pathEl = pathRefs.current[i]
                if (!pathEl) return

                blob.cx += blob.vx
                blob.cy += blob.vy

                if (blob.cx > width + buffer) blob.cx = -buffer
                if (blob.cx < -buffer) blob.cx = width + buffer
                if (blob.cy > height + buffer) blob.cy = -buffer
                if (blob.cy < -buffer) blob.cy = height + buffer

                const calculatedPoints = blob.points.map((p, j) => {
                    const t = time
                    const noise = Math.sin(t * 1.5 + p.noiseOffset) * (p.amp * 0.8)
                        + Math.cos(t * 2 + j) * (p.amp * 0.4)

                    const r = blob.radius + noise
                    const x = blob.cx + Math.cos(p.angle) * r
                    const y = blob.cy + Math.sin(p.angle) * r
                    return { x, y }
                })

                const d = getClosedSplinePath(calculatedPoints)
                pathEl.setAttribute('d', d)
            })
        }

        gsap.ticker.add(ticker)

        const onResize = () => {
            initSimulation()
        }
        window.addEventListener('resize', onResize)

        return () => {
            gsap.ticker.remove(ticker)
            window.removeEventListener('resize', onResize)
        }
    }, [blobCount])

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        >
            <defs>
                <filter id="goo-outline">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                        result="goo"
                    />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" result="mix" />
                </filter>
                <filter id="hollow-goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -12"
                        result="goo"
                    />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
                <filter id="neon-goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
                    <feMorphology in="goo" operator="dilate" radius="3" result="thick" />
                    <feComposite in="thick" in2="goo" operator="out" result="stroke" />
                    <feColorMatrix in="stroke" type="matrix" values="
                        0 0 0 0 0.345 
                        0 0 0 0 0.231 
                        0 0 0 0 0.984 
                        0 0 0 0.5 0" result="coloredStroke" />
                </filter>

            </defs>
            <g filter="url(#neon-goo)">
                {Array.from({ length: blobCount }).map((_, i) => (
                    <path
                        key={i}
                        ref={el => pathRefs.current[i] = el}
                        fill="white"
                        stroke="none"
                    />
                ))}
            </g>
        </svg>
    )
}
