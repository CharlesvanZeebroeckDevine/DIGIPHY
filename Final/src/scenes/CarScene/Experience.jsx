import { useFrame, useThree, useLoader } from '@react-three/fiber'
import { useGLTF, PerspectiveCamera, Environment, MeshReflectorMaterial, ContactShadows, Html } from '@react-three/drei'
import { useEffect, useRef, useMemo, useState } from 'react'
import { EffectComposer, Bloom, Vignette, N8AO, ToneMapping, LUT } from '@react-three/postprocessing'
import { LUTCubeLoader } from 'three/examples/jsm/loaders/LUTCubeLoader'
import * as THREE from 'three'
import { useRevealMask } from './useRevealMask'
import { patchSolidMaterial, patchWireframeMaterial, updateRevealUniforms, createRevealUniforms } from './RevealMaterials'

import { CAMERA_CONFIG, USECASE_CAMERA_CONFIG, FLIP_MODELS_X, LED_CONFIG, HDRI_CONFIG, POST_PROCESSING_CONFIG, WINDOW_CONFIG } from './config'

import SeatingBuck from './SeatingBuck'
import Poster from './Poster'

// Cubic Bezier interpolation helper
function getCubicBezierPoint(t, p0, p1, p2, p3) {
    const oneMinusT = 1 - t
    const oneMinusT2 = oneMinusT * oneMinusT
    const oneMinusT3 = oneMinusT2 * oneMinusT
    const t2 = t * t
    const t3 = t2 * t

    const x = oneMinusT3 * p0.x + 3 * oneMinusT2 * t * p1.x + 3 * oneMinusT * t2 * p2.x + t3 * p3.x
    const y = oneMinusT3 * p0.y + 3 * oneMinusT2 * t * p1.y + 3 * oneMinusT * t2 * p2.y + t3 * p3.y
    const z = oneMinusT3 * p0.z + 3 * oneMinusT2 * t * p1.z + 3 * oneMinusT * t2 * p2.z + t3 * p3.z

    return new THREE.Vector3(x, y, z)
}

function CameraRig({ scrollProgress, zoomLevel = 0, interactionStrength = 1 }) {
    const { camera, pointer } = useThree()

    // Zoom Logic: Interpolate base Z position from -25 (default) to -35 (zoomed out)
    const baseZ = THREE.MathUtils.lerp(CAMERA_CONFIG.initialPosition.z, -35, zoomLevel)

    const initialCameraPosition = new THREE.Vector3(
        CAMERA_CONFIG.initialPosition.x,
        CAMERA_CONFIG.initialPosition.y,
        baseZ
    )
    const lookAtTarget = new THREE.Vector3(
        CAMERA_CONFIG.lookAtTarget.x,
        CAMERA_CONFIG.lookAtTarget.y,
        CAMERA_CONFIG.lookAtTarget.z
    )

    // Mutable state for rotation smoothing
    const rotation = useRef({ x: 0, y: 0 })
    const targetRotation = useRef({ x: 0, y: 0 })
    const rotationSpeed = CAMERA_CONFIG.rotationSpeed

    useFrame(() => {
        if (scrollProgress > 0) {
            // BEZIER PATH MODE
            // Interpolate position based on scrollProgress
            const points = USECASE_CAMERA_CONFIG.path

            // Ensure smoothness from the current zoomed-out state (-35) if needed, 
            // but the Bezier curve starts at a fixed point. 
            // Ideally, P0 of Bezier should match the exit position of the Zoom.
            // P0 is { x: 0, y: 7, z: -25 }. 
            // If we are fully zoomed out at z: -35, and then jump to Bezier P0 z: -25, there is a jump.
            // However, the Exit Trigger zooms us BACK to -25 (zoomLevel 1->0) during the exit phase.
            // So by the time scrollProgress > 0 (CarUsecases start), zoomLevel should be 0 (back at -25).

            const newPos = getCubicBezierPoint(
                scrollProgress,
                points[0],
                points[1],
                points[2],
                points[3]
            )

            // Interpolate LookAt 
            // From Default Target -> Usecase Target
            const defaultTarget = new THREE.Vector3(CAMERA_CONFIG.lookAtTarget.x, CAMERA_CONFIG.lookAtTarget.y, CAMERA_CONFIG.lookAtTarget.z)
            const endTarget = new THREE.Vector3(USECASE_CAMERA_CONFIG.lookAtTarget.x, USECASE_CAMERA_CONFIG.lookAtTarget.y, USECASE_CAMERA_CONFIG.lookAtTarget.z)
            const currentLookAt = new THREE.Vector3().lerpVectors(defaultTarget, endTarget, scrollProgress)

            camera.position.copy(newPos)
            camera.lookAt(currentLookAt)

        } else {
            // MOUSE INTERACTION MODE + ZOOM
            // Apply interaction strength to fade out influence
            targetRotation.current.y = (pointer.x * Math.PI * 0.10) * interactionStrength
            targetRotation.current.x = (pointer.y * Math.PI * 0.02) * interactionStrength

            rotation.current.x += (targetRotation.current.x - rotation.current.x) * rotationSpeed
            rotation.current.y += (targetRotation.current.y - rotation.current.y) * rotationSpeed

            const quaternion = new THREE.Quaternion()
            quaternion.setFromEuler(new THREE.Euler(rotation.current.x, rotation.current.y, 0, 'YXZ'))

            // Re-calculate offset based on the DYNAMIC initialCameraPosition (with zoom)
            const offset = initialCameraPosition.clone().sub(lookAtTarget)
            offset.applyQuaternion(quaternion)

            // Ensure camera world matrix is updated for raycasting
            camera.position.copy(lookAtTarget).add(offset)
            camera.lookAt(lookAtTarget)
        }
        camera.updateMatrixWorld()
    })

    return <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={CAMERA_CONFIG.fov} near={0.1} far={1000} />
}

function CarModel({ path, opacity = 1.0, scale = [1, 1, 1], isActive }) {
    const { scene } = useGLTF(path)
    const groupRef = useRef()
    const modelRef = useRef()
    const wireframeGroupRef = useRef()
    const hitBoxRef = useRef()
    const meshesRef = useRef([])

    // Initialize custom hook for reveal mask
    // OPTIMIZATION: Raycast against the simple hitBox instead of the complex model
    // Note: We keep simulation active even if opacity is 0 to ensure readiness, 
    // or we can pause it but keep the mesh visible. Let's keep it active for now to avoid stutter.
    const revealMaskRef = useRevealMask(hitBoxRef, true)

    // Create unique uniforms for this car instance
    const localUniforms = useMemo(() => createRevealUniforms(), [])

    // Prepare materials once when scene loads
    useEffect(() => {
        if (scene) {
            const box = new THREE.Box3().setFromObject(scene)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())

            scene.position.x = -center.x
            scene.position.y = -box.min.y
            scene.position.z = -center.z

            // Update HitBox to match the model bounds
            if (hitBoxRef.current) {
                hitBoxRef.current.position.y = size.y / 2
                hitBoxRef.current.scale.set(size.x, size.y, size.z)
            }

            // Create a clone for the wireframe pass
            // We need to clone the scene deeply to have separate materials
            const wireframeScene = scene.clone()

            meshesRef.current = [] // Reset meshes array

            // Process Solid Pass (Original Scene)
            scene.traverse((child) => {
                if (child.isMesh) {
                    // Keep the original material but patch it
                    // If it's not a standard material, convert it or wrap it
                    if (!child.material.isMeshStandardMaterial) {
                        // Fallback: create a standard material preserving color/map
                        const newMat = new THREE.MeshStandardMaterial({
                            color: child.material.color || new THREE.Color(1, 1, 1),
                            map: child.material.map || null,
                            roughness: child.material.roughness || 0.5,
                            metalness: child.material.metalness || 0.5,
                        })
                        child.material = newMat
                    }

                    patchSolidMaterial(child.material, localUniforms)
                    child.castShadow = true
                    child.receiveShadow = true
                    meshesRef.current.push(child) // Store for updates
                }
            })

            // Process Wireframe Pass (Cloned Scene)
            wireframeScene.traverse((child) => {
                if (child.isMesh) {
                    // Create a basic material for wireframe
                    const wireMat = new THREE.MeshBasicMaterial()
                    patchWireframeMaterial(wireMat, localUniforms)
                    child.material = wireMat
                    child.castShadow = false
                    child.receiveShadow = false
                }
            })

            // Add wireframe scene to the group
            if (wireframeGroupRef.current) {
                wireframeGroupRef.current.clear()
                wireframeGroupRef.current.add(wireframeScene)
            }
        }
    }, [scene, localUniforms, path])

    // Animate uniforms and shadows
    useFrame((state) => {
        // Update opacity uniform
        if (localUniforms.uOpacity) {
            localUniforms.uOpacity.value = opacity
        }

        // Toggle entire group visibility based on active state
        // This ensures the shadow camera sees the geometry even if opacity is 0 (during fade in)
        if (groupRef.current) {
            groupRef.current.visible = isActive
        }

        // We don't need to toggle specific castShadows anymore since the group visibility handles it
        // But keeping it for completeness if needed logic changes
        const isVisible = opacity > 0.01

        meshesRef.current.forEach(mesh => {
            mesh.castShadow = isVisible
            mesh.receiveShadow = isVisible
        })

        if (revealMaskRef.current) {
            const drawingSize = new THREE.Vector2()
            state.gl.getDrawingBufferSize(drawingSize)

            updateRevealUniforms(
                revealMaskRef.current,
                drawingSize,
                state.clock.getElapsedTime(),
                localUniforms
            )
        }
    })

    return (
        <group ref={groupRef} scale={scale}>
            {/* HitBox Proxy for Raycasting - Only active when visible */}
            <mesh ref={hitBoxRef} visible={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="red" wireframe />
            </mesh>

            {/* Solid Pass */}
            <primitive ref={modelRef} object={scene} />

            {/* Wireframe Pass */}
            <group ref={wireframeGroupRef} position={[0, 0, 0]} />
        </group>
    )
}

function WindowGlowModel({ intensity = 10 }) {
    const { scene } = useGLTF('/Window.glb')

    useEffect(() => {
        if (scene) {
            scene.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color(intensity, intensity, intensity),
                        toneMapped: false,
                        side: THREE.DoubleSide
                    })
                }
            })
        }
    }, [scene, intensity])

    return <primitive object={scene} />
}

export default function Experience({ activeModelPath, transitionOpacity, cameraProgress, zoomLevel, interactionStrength }) {
    const { scene } = useThree()
    const [carsGroup, setCarsGroup] = useState(null)

    // Load the studio scene directly
    const studioScene = useGLTF('/BakedScene.glb')

    // Set scene background to white
    useEffect(() => {
        scene.background = new THREE.Color('#ffffff')
    }, [scene])

    const texture = useLoader(LUTCubeLoader, POST_PROCESSING_CONFIG.lut.lut)

    const modelScale = FLIP_MODELS_X ? [-1, 1, 1] : [1, 1, 1]

    return (
        <>
            <CameraRig scrollProgress={cameraProgress} zoomLevel={zoomLevel} interactionStrength={interactionStrength} />

            {/* Realistic Lighting Setup */}
            <Environment
                files="/studio_small_09_1k.hdr"
                // background // Hidden as per request
                environmentRotation={[HDRI_CONFIG.rotation.x, HDRI_CONFIG.rotation.y, HDRI_CONFIG.rotation.z]}
                // backgroundRotation={[HDRI_CONFIG.rotation.x, HDRI_CONFIG.rotation.y, HDRI_CONFIG.rotation.z]}
                environmentIntensity={HDRI_CONFIG.intensity}
            />

            {/* Studio Environment */}
            <primitive object={studioScene.scene} />

            <ContactShadows
                key={activeModelPath} // Force-remount on model switch to bake new shadow
                frames={1} // Bake only once for performance
                resolution={512}
                scale={[20, 10]}
                blur={1}
                opacity={0.3 * transitionOpacity} // Fade shadow with model
                far={10}
                color="#000000"
                position={[0, 0.01, 0]}
            />

            {/* Window */}
            {/* Window Glow - Using the provided model for perfect alignment */}
            <WindowGlowModel intensity={WINDOW_CONFIG.intensity} />

            {/* Posters - Experimental Placement */}
            <group position={[8, 5, 14.5]}>
                <Poster url="/posters/4.webp" position={[0, 0, 0]} />
                <Poster url="/posters/5.webp" position={[-4, 0, 0]} />
                <Poster url="/posters/6.webp" position={[-8, 0, 0]} />
            </group>


            {/* Seating Buck Environment - Rendered directly at native scale */}
            <SeatingBuck activeModelIndex={activeModelPath === 'car-models/BmwSUV.glb' ? 0 : activeModelPath === 'car-models/AudiSport.glb' ? 1 : 2} />

            {/* Car Models with opacity transition */}
            <group ref={setCarsGroup}>
                <CarModel
                    path="car-models/BmwSUV.glb"
                    opacity={activeModelPath === 'car-models/BmwSUV.glb' ? transitionOpacity : 0}
                    isActive={activeModelPath === 'car-models/BmwSUV.glb'}
                    scale={modelScale}
                />
                <CarModel
                    path="car-models/AudiSport.glb"
                    opacity={activeModelPath === 'car-models/AudiSport.glb' ? transitionOpacity : 0}
                    isActive={activeModelPath === 'car-models/AudiSport.glb'}
                    scale={modelScale}
                />
                <CarModel
                    path="car-models/FordTransit.glb"
                    opacity={activeModelPath === 'car-models/FordTransit.glb' ? transitionOpacity : 0}
                    isActive={activeModelPath === 'car-models/FordTransit.glb'}
                    scale={modelScale}
                />
            </group>


            {/* Post-Processing */}
            <EffectComposer disableNormalPass multisampling={0} >
                {/* <N8AO
                    halfRes
                    quality="performance"
                    screenSpaceRadius={false}
                    denoiseSamples={2}
                    denoiseRadius={0.1}
                    aoRadius={0.5}
                    intensity={POST_PROCESSING_CONFIG.ssao.intensity}
                    radius={POST_PROCESSING_CONFIG.ssao.radius}
                    luminanceInfluence={POST_PROCESSING_CONFIG.ssao.luminanceInfluence}
                    color={POST_PROCESSING_CONFIG.ssao.color}
                /> */}
                <Bloom
                    luminanceThreshold={POST_PROCESSING_CONFIG.bloom.luminanceThreshold}
                    mipmapBlur={POST_PROCESSING_CONFIG.bloom.mipmapBlur}
                    intensity={POST_PROCESSING_CONFIG.bloom.intensity}
                    luminanceSmoothing={POST_PROCESSING_CONFIG.bloom.luminanceSmoothing}
                />
                <Vignette
                    offset={POST_PROCESSING_CONFIG.vignette.offset}
                    darkness={POST_PROCESSING_CONFIG.vignette.darkness}
                />
                <ToneMapping
                    mode={THREE.ACESFilmicToneMapping}
                />
                <LUT
                    lut={texture.texture3D}
                    opacity={POST_PROCESSING_CONFIG.lut.intensity}
                />
            </EffectComposer>
        </>
    )
}
