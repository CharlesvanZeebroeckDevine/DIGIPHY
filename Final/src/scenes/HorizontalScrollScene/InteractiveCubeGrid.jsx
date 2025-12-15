import React, { forwardRef, useEffect, useLayoutEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

const CONFIG = {
    gridSize: 15,
    cubeSize: 1.0,  // Match test.html
    gap: 0.7,       // Match test.html
    hoverRadiusPx: 250, // Match test.html
    maxRotation: Math.PI,
    lerpSpeed: 0.1,
    baseColor: 0x191411,
    outlineColor: 0xffffff
}

export const InteractiveCubeGrid = forwardRef(function InteractiveCubeGrid(_props, ref) {
    const groupRef = useRef()
    const cubesRef = useRef([])
    const { camera, pointer, size, gl } = useThree()
    const revealTlRef = useRef(null)

    // Shared Resources (Optimization matching test.html singleton pattern)
    const { geometry, material, edgesGeometry, edgesMaterial } = useMemo(() => {
        const geo = new THREE.BoxGeometry(CONFIG.cubeSize, CONFIG.cubeSize, CONFIG.cubeSize)

        const mat = new THREE.MeshBasicMaterial({
            colorWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        })

        const edgesGeo = new THREE.EdgesGeometry(geo)
        const edgesMat = new THREE.LineBasicMaterial({ color: CONFIG.outlineColor })

        return { geometry: geo, material: mat, edgesGeometry: edgesGeo, edgesMaterial: edgesMat }
    }, [])

    useEffect(() => {
        return () => {
            geometry?.dispose?.()
            material?.dispose?.()
            edgesGeometry?.dispose?.()
            edgesMaterial?.dispose?.()
        }
    }, [geometry, material, edgesGeometry, edgesMaterial])

    // Plane/Raycaster
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
    const raycaster = useMemo(() => new THREE.Raycaster(), [])
    const worldMouse = useMemo(() => new THREE.Vector3(), [])

    // Grid Data
    const gridData = useMemo(() => {
        const data = []
        const totalGridWidth = (CONFIG.gridSize * CONFIG.cubeSize) + ((CONFIG.gridSize - 1) * CONFIG.gap)
        const offset = totalGridWidth / 2 - CONFIG.cubeSize / 2

        for (let x = 0; x < CONFIG.gridSize; x++) {
            for (let z = 0; z < CONFIG.gridSize; z++) {
                // Create a gap in the middle for text
                if (x >= 3 && x <= 11 && z >= 6 && z <= 8) {
                    continue
                }

                data.push({
                    x: (x * (CONFIG.cubeSize + CONFIG.gap)) - offset,
                    z: (z * (CONFIG.cubeSize + CONFIG.gap)) - offset,
                    id: `${x}-${z}`
                })
            }
        }
        return data
    }, [])

    // Stable left edge in LOCAL coordinates (independent of current reveal scale)
    const leftEdgeLocalX = useMemo(() => {
        const minCenterX = gridData.reduce((min, d) => Math.min(min, d.x), Infinity)
        return minCenterX - (CONFIG.cubeSize / 2)
    }, [gridData])

    const rightEdgeLocalX = useMemo(() => {
        const maxCenterX = gridData.reduce((max, d) => Math.max(max, d.x), -Infinity)
        return maxCenterX + (CONFIG.cubeSize / 2)
    }, [gridData])

    // Fixed reveal origin: center of the grid’s left edge in world coords
    // (matches your choice: fixed-left-center, not the actual line head point)
    const revealOrigin = useMemo(() => {
        const totalGridWidth = (CONFIG.gridSize * CONFIG.cubeSize) + ((CONFIG.gridSize - 1) * CONFIG.gap)
        const offset = totalGridWidth / 2 - CONFIG.cubeSize / 2
        return { x: -offset, z: 0 }
    }, [])

    useLayoutEffect(() => {
        // Build (or rebuild) the reveal timeline once refs exist
        if (!cubesRef.current.length) return

        // Ensure initial hidden state (scale from 0)
        cubesRef.current.forEach((g) => g?.scale?.set?.(0, 0, 0))

        // Kill any previous timeline
        if (revealTlRef.current) {
            revealTlRef.current.kill()
            revealTlRef.current = null
        }

        // Sort cubes by distance from the fixed origin (radial wave)
        const orderedGroups = cubesRef.current
            .filter(Boolean)
            .slice()
            .sort((a, b) => {
                const da = (a.position.x - revealOrigin.x) ** 2 + (a.position.z - revealOrigin.z) ** 2
                const db = (b.position.x - revealOrigin.x) ** 2 + (b.position.z - revealOrigin.z) ** 2
                return da - db
            })

        const tl = gsap.timeline({ paused: true })
        tl.to(
            orderedGroups.map((g) => g.scale),
            {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.45,
                ease: 'power2.out',
                stagger: 0.01,
            }
        )

        revealTlRef.current = tl

        return () => {
            tl.kill()
            if (revealTlRef.current === tl) revealTlRef.current = null
        }
    }, [gridData, revealOrigin])

    useImperativeHandle(ref, () => ({
        playReveal: () => {
            const tl = revealTlRef.current
            if (!tl) return
            // Always replay from start when triggered
            tl.play(0)
        },
        reverseReveal: () => {
            const tl = revealTlRef.current
            if (!tl) return
            // Reverse back toward the hidden state
            tl.reverse()
        },
        // Returns the leftmost cube edge as a viewport clientX, based on the current camera & canvas size.
        // This is used by the DOM/SVG line to stop exactly at the cube boundary.
        getLeftEdgeClientX: () => {
            if (!gl?.domElement || !camera) return null
            const canvasRect = gl.domElement.getBoundingClientRect()
            if (!canvasRect.width) return null

            // Local point on the left edge of the grid (y=0, z=0 is sufficient for a top-down-ish view)
            const local = new THREE.Vector3(leftEdgeLocalX, 0, 0)
            const world = groupRef.current?.localToWorld ? groupRef.current.localToWorld(local.clone()) : local

            const ndc = world.clone().project(camera)
            const px = (ndc.x * 0.5 + 0.5) * size.width
            return canvasRect.left + px
        },
        getRightEdgeClientX: () => {
            if (!gl?.domElement || !camera) return null
            const canvasRect = gl.domElement.getBoundingClientRect()
            if (!canvasRect.width) return null

            const local = new THREE.Vector3(rightEdgeLocalX, 0, 0)
            const world = groupRef.current?.localToWorld ? groupRef.current.localToWorld(local.clone()) : local

            const ndc = world.clone().project(camera)
            const px = (ndc.x * 0.5 + 0.5) * size.width
            return canvasRect.left + px
        },
    }), [])

    useFrame((state, delta) => {
        if (!cubesRef.current.length) return

        // Raycasting
        raycaster.setFromCamera(pointer, camera)
        raycaster.ray.intersectPlane(plane, worldMouse)

        // Calculate Dynamic World Radius based on Screen Radius (Exact port from test.html)
        // distanceToGrid is camera.position.y (assuming top-down view at y>0 looking at y=0)
        // Adjust if camera is rotated, but for top-down logic:
        const distanceToGrid = camera.position.y
        const vFOV = THREE.MathUtils.degToRad(camera.fov)
        const visibleHeight = 2 * Math.tan(vFOV / 2) * distanceToGrid

        // Convert px radius to world units using current canvas height
        const worldRadius = (CONFIG.hoverRadiusPx / size.height) * visibleHeight

        // Update Cubes
        cubesRef.current.forEach((cubeGroup) => {
            if (!cubeGroup) return

            const dx = worldMouse.x - cubeGroup.position.x
            // Use local z position relative to world mouse z
            const dz = worldMouse.z - cubeGroup.position.z
            const dist = Math.sqrt(dx * dx + dz * dz)

            const targetRot = { x: 0, z: 0 }
            let targetY = 0

            if (dist < worldRadius) {
                const influence = 1 - (dist / worldRadius)
                const smoothInfluence = Math.pow(influence, 2)
                const angle = smoothInfluence * CONFIG.maxRotation

                // Guard against dist === 0 to avoid NaNs when mouse is directly over a cube
                if (dist > 1e-6) {
                    targetRot.x = (dz / dist) * angle
                    targetRot.z = -(dx / dist) * angle
                }

                targetY = smoothInfluence * 0.5 // Match test.html's 0.5 lift
            }

            // Lerp
            cubeGroup.rotation.x = THREE.MathUtils.lerp(cubeGroup.rotation.x, targetRot.x, CONFIG.lerpSpeed)
            cubeGroup.rotation.z = THREE.MathUtils.lerp(cubeGroup.rotation.z, targetRot.z, CONFIG.lerpSpeed)
            cubeGroup.position.y = THREE.MathUtils.lerp(cubeGroup.position.y, targetY, CONFIG.lerpSpeed)
        })
    })

    return (
        <group ref={groupRef}>
            {gridData.map((data, i) => (
                <group
                    key={data.id}
                    position={[data.x, 0, data.z]}
                    ref={el => cubesRef.current[i] = el}
                    scale={[0, 0, 0]}
                >
                    <mesh geometry={geometry} material={material} />
                    <lineSegments geometry={edgesGeometry} material={edgesMaterial} />
                </group>
            ))}
        </group>
    )
})
