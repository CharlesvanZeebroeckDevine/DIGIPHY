import { useFBO } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { MaskSimulationMaterial } from './MaskSimulationMaterial'

export function useRevealMask(modelRef, isActive = true) {
    const { size, gl, camera, raycaster, pointer } = useThree()

    // Create two FBOs for ping-pong rendering
    // HalfFloatType ensures smooth fading without banding
    const options = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        stencilBuffer: false,
        depthBuffer: false,
    }

    // OPTIMIZATION: Reduce FBO resolution
    // Full screen resolution is overkill for a soft fluid mask
    const fboWidth = Math.min(size.width * 1.0, 2048)
    const fboHeight = Math.min(size.height * 1.0, 2048)

    const targetA = useFBO(fboWidth, fboHeight, options)
    const targetB = useFBO(fboWidth, fboHeight, options)

    // Refs to track ping-pong state
    const currentTarget = useRef(targetA)
    const prevTarget = useRef(targetB)

    // Output ref to be consumed by the material
    // We use a ref because the texture object changes every frame
    const outputRef = useRef(targetA.texture)

    // Simulation scene setup
    const simScene = useMemo(() => new THREE.Scene(), [])
    const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), [])
    const simMaterial = useMemo(() => new MaskSimulationMaterial(), [])

    // Create a full-screen quad for the simulation
    const simMesh = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(2, 2)
        const mesh = new THREE.Mesh(geometry, simMaterial)
        simScene.add(mesh)
        return mesh
    }, [simScene, simMaterial])

    // State for mouse interaction
    const isHovering = useRef(false)
    const mouseUV = useRef(new THREE.Vector2(0.5, 0.5))

    // Update FBO size on resize
    useEffect(() => {
        const w = Math.min(size.width * 1.0, 2048)
        const h = Math.min(size.height * 1.0, 2048)
        targetA.setSize(w, h)
        targetB.setSize(w, h)
        simMaterial.uniforms.uResolution.value.set(w, h)
    }, [size, targetA, targetB, simMaterial])

    // Cached data for hit detection
    const modelData = useRef({ center: new THREE.Vector3(), radius: 0 })
    const lastModel = useRef(null)

    // Raycasting logic
    useFrame(() => {
        // OPTIMIZATION: Skip everything if not active
        if (!isActive || !modelRef.current) return

        // Update cached model data if model changes
        if (modelRef.current !== lastModel.current) {
            const box = new THREE.Box3().setFromObject(modelRef.current)
            const center = new THREE.Vector3()
            const size = new THREE.Vector3()

            box.getCenter(center)
            box.getSize(size)

            // Use the largest dimension for the radius, plus a generous padding
            // This ensures the brush works well outside the car
            const maxDim = Math.max(size.x, size.z)

            modelData.current = {
                center: center,
                // Large radius: car size + 15 units of padding
                radius: (maxDim / 2) + 15.0
            }
            lastModel.current = modelRef.current
        }

        raycaster.setFromCamera(pointer, camera)

        // Priority 1: Direct intersection with the model
        const intersects = raycaster.intersectObject(modelRef.current, true)
        let hitPoint = null

        if (intersects.length > 0) {
            hitPoint = intersects[0].point
        } else {
            // Priority 2: Fallback to ground plane
            // We want the brush to appear on the "floor" when outside the car
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
            const cursorWorldPosition = new THREE.Vector3()
            const planeIntersection = raycaster.ray.intersectPlane(groundPlane, cursorWorldPosition)

            if (planeIntersection) {
                // Check distance on XZ plane (ignoring height)
                const dx = cursorWorldPosition.x - modelData.current.center.x
                const dz = cursorWorldPosition.z - modelData.current.center.z
                const distance = Math.sqrt(dx * dx + dz * dz)

                if (distance < modelData.current.radius) {
                    hitPoint = cursorWorldPosition
                }
            }
        }

        if (hitPoint) {
            isHovering.current = true

            // Convert world pos to screen UV (0-1)
            const screenPos = hitPoint.clone()
            screenPos.project(camera)

            const u = screenPos.x * 0.5 + 0.5
            const v = screenPos.y * 0.5 + 0.5
            mouseUV.current.set(u, v)
        } else {
            isHovering.current = false
        }
    })

    // Render Loop
    useFrame((state) => {
        // OPTIMIZATION: Skip simulation if not active
        if (!isActive) return

        const time = state.clock.getElapsedTime()

        // Update uniforms
        simMaterial.uniforms.uTime.value = time
        simMaterial.uniforms.uIsHovering.value = isHovering.current
        simMaterial.uniforms.uMouse.value.copy(mouseUV.current)
        simMaterial.uniforms.uTexture.value = prevTarget.current.texture

        // Render to the current target
        gl.setRenderTarget(currentTarget.current)
        gl.render(simScene, simCamera)
        gl.setRenderTarget(null)

        // Update output ref to point to the freshly rendered texture
        outputRef.current = currentTarget.current.texture

        // Swap targets for next frame
        const temp = currentTarget.current
        currentTarget.current = prevTarget.current
        prevTarget.current = temp
    })

    return outputRef
}

