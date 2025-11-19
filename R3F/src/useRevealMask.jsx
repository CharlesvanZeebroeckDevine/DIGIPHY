import { useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function useRevealMask(modelRef) {
    const { size, camera, raycaster, pointer } = useThree()

    // Constants from original
    const BRUSH_RADIUS = 170
    const BRUSH_COLOR = { r: 255, g: 255, b: 255 }
    const BRUSH_OPACITY_CENTER = 1
    const BRUSH_OPACITY_MID = 0.6
    const BRUSH_OPACITY_EDGE = 0
    const BRUSH_FADE_SPEED = 0.99
    const BRUSH_FADE_THRESHOLD = 0.01 // Completely clear pixels below this alpha to ensure full fade

    // State
    const isHovering = useRef(false)
    const mouseWorldPosition = useRef(new THREE.Vector3())

    // Create canvas and texture once
    const [canvas, ctx, texture] = useMemo(() => {
        const c = document.createElement('canvas')
        // Initial size, will be updated
        c.width = window.innerWidth
        c.height = window.innerHeight

        const context = c.getContext('2d', { willReadFrequently: true })
        context.fillStyle = 'rgba(0, 0, 0, 0)'
        context.fillRect(0, 0, c.width, c.height)

        const tex = new THREE.CanvasTexture(c)
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter

        return [c, context, tex]
    }, [])

    // Handle resize
    useEffect(() => {
        canvas.width = size.width
        canvas.height = size.height
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        texture.needsUpdate = true
    }, [size, canvas, ctx, texture])

    // Raycasting logic (runs every frame to detect hover)
    useFrame(() => {
        if (!modelRef.current) return

        // Raycast from camera
        raycaster.setFromCamera(pointer, camera)

        // Priority 1: Direct intersection with the model
        // This is critical: we must find the exact point on the model surface where the ray hits.
        const intersects = raycaster.intersectObject(modelRef.current, true)

        if (intersects.length > 0) {
            isHovering.current = true
            mouseWorldPosition.current.copy(intersects[0].point)
        } else {
            // Priority 2: Fallback to ground plane intersection if we are near the car
            // This helps when hovering just outside the mesh or through holes (e.g. windows)

            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
            const cursorWorldPosition = new THREE.Vector3()
            const planeIntersection = raycaster.ray.intersectPlane(groundPlane, cursorWorldPosition)

            if (planeIntersection) {
                // Check if we are "near" the car in screen space or world space.
                // A simple world-space bounding box check works well for top-down views,
                // but for side views, the ground plane hit might be far behind the car.
                //
                // To make this robust for ALL angles:
                // We check if the ray passes close to the model's bounding sphere/box.

                const box = new THREE.Box3().setFromObject(modelRef.current)
                const sphere = new THREE.Sphere()
                box.getBoundingSphere(sphere)

                // Expand the sphere slightly for the "aura"
                sphere.radius *= 1.2

                if (raycaster.ray.intersectsSphere(sphere)) {
                    // If the ray passes close to the car, we treat it as a valid hover.
                    // BUT: We need a 3D point to project back to screen for painting.
                    // Ideally, this point should be "at the depth of the car" for the current view.
                    // Using the ground plane hit is okay if looking down, but bad if looking from side.

                    // Better fallback: Project the ray to the plane perpendicular to camera at car's center distance?
                    // Or simpler: Just use the ground plane hit if it's within reasonable bounds.

                    // For now, let's stick to the expanded box check on the ground plane point
                    // BUT expand it significantly to catch side-view "floor hits".
                    box.expandByScalar(5.0)

                    if (box.containsPoint(cursorWorldPosition)) {
                        isHovering.current = true
                        mouseWorldPosition.current.copy(cursorWorldPosition)
                    } else {
                        isHovering.current = false
                    }
                } else {
                    isHovering.current = false
                }
            } else {
                isHovering.current = false
            }
        }
    })

    // Animation/Drawing Loop
    useFrame((state) => {
        const time = state.clock.getElapsedTime()

        // Fade existing mask
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
            // Fade alpha
            data[i + 3] *= BRUSH_FADE_SPEED
            // Completely clear pixels below threshold to ensure full fade-out
            if (data[i + 3] < BRUSH_FADE_THRESHOLD * 255) {
                data[i + 3] = 0
            }
        }
        ctx.putImageData(imageData, 0, 0)

        // Draw new circle if hovering
        if (isHovering.current) {
            // Convert world pos to screen pos
            const screenPos = mouseWorldPosition.current.clone()
            screenPos.project(camera)

            // Map from NDC (-1 to 1) to Canvas coordinates (0 to width/height)
            const screenX = (screenPos.x * 0.5 + 0.5) * canvas.width
            const screenY = (-(screenPos.y) * 0.5 + 0.5) * canvas.height // Flip Y for canvas

            const numPoints = 32
            const distortionAmount = 15

            ctx.beginPath()
            for (let i = 0; i <= numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2
                const noise1 = Math.sin(angle * 3 + time * 2) * distortionAmount
                const noise2 = Math.cos(angle * 5 - time * 1.5) * (distortionAmount * 0.5)
                const noise3 = Math.sin(angle * 7 + time * 3) * (distortionAmount * 0.3)
                const radius = BRUSH_RADIUS + noise1 + noise2 + noise3

                const x = screenX + Math.cos(angle) * radius
                const y = screenY + Math.sin(angle) * radius

                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.closePath()

            const gradient = ctx.createRadialGradient(
                screenX, screenY, BRUSH_RADIUS * 0.3,
                screenX, screenY, BRUSH_RADIUS * 1.2
            )
            gradient.addColorStop(0, `rgba(${BRUSH_COLOR.r}, ${BRUSH_COLOR.g}, ${BRUSH_COLOR.b}, ${BRUSH_OPACITY_CENTER})`)
            gradient.addColorStop(0.7, `rgba(${BRUSH_COLOR.r}, ${BRUSH_COLOR.g}, ${BRUSH_COLOR.b}, ${BRUSH_OPACITY_MID})`)
            gradient.addColorStop(1, `rgba(${BRUSH_COLOR.r}, ${BRUSH_COLOR.g}, ${BRUSH_COLOR.b}, ${BRUSH_OPACITY_EDGE})`)

            ctx.fillStyle = gradient
            ctx.fill()
        }

        texture.needsUpdate = true
    })

    return texture
}
