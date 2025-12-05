import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PerspectiveCamera, Environment, MeshReflectorMaterial, ContactShadows, Html } from '@react-three/drei'
import { useEffect, useRef, useMemo, useState } from 'react'
import { EffectComposer, Bloom, Vignette, N8AO, ToneMapping } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useRevealMask } from './useRevealMask'
import { patchSolidMaterial, patchWireframeMaterial, updateRevealUniforms, createRevealUniforms } from './RevealMaterials'

import { CAMERA_CONFIG, FLIP_MODELS_X, LED_CONFIG, HDRI_CONFIG, POST_PROCESSING_CONFIG, WINDOW_CONFIG } from './config'

function CameraRig() {
    const { camera, pointer } = useThree()
    const initialCameraPosition = new THREE.Vector3(
        CAMERA_CONFIG.initialPosition.x,
        CAMERA_CONFIG.initialPosition.y,
        CAMERA_CONFIG.initialPosition.z
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
        targetRotation.current.y = pointer.x * Math.PI * 0.15
        targetRotation.current.x = pointer.y * Math.PI * 0.05

        rotation.current.x += (targetRotation.current.x - rotation.current.x) * rotationSpeed
        rotation.current.y += (targetRotation.current.y - rotation.current.y) * rotationSpeed

        const quaternion = new THREE.Quaternion()
        quaternion.setFromEuler(new THREE.Euler(rotation.current.x, rotation.current.y, 0, 'YXZ'))

        const offset = initialCameraPosition.clone().sub(lookAtTarget)
        offset.applyQuaternion(quaternion)

        // Ensure camera world matrix is updated for raycasting
        camera.position.copy(lookAtTarget).add(offset)
        camera.lookAt(lookAtTarget)
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

export default function Experience({ activeModelPath, transitionOpacity }) {
    const { scene } = useThree()
    const [carsGroup, setCarsGroup] = useState(null)

    // Load the Seating Buck model directly
    const sbModel = useGLTF('/SB.glb')
    const studioScene = useGLTF('/BakedScene.glb')

    // Apply LED configuration to the Seating Buck
    useEffect(() => {
        if (sbModel.scene) {
            sbModel.scene.traverse((child) => {
                if (child.isMesh && child.material.name === 'Led') {
                    child.material.emissive = new THREE.Color(LED_CONFIG.color)
                    child.material.emissiveIntensity = LED_CONFIG.intensity
                    child.material.toneMapped = false // Optional: makes it glow more in post-processing
                }
            })
        }
    }, [sbModel.scene])

    // Set scene background to white
    useEffect(() => {
        scene.background = new THREE.Color('#ffffff')
    }, [scene])

    const modelScale = FLIP_MODELS_X ? [-1, 1, 1] : [1, 1, 1]

    return (
        <>
            <CameraRig />

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


            {/* Seating Buck Environment - Rendered directly at native scale */}
            <primitive object={sbModel.scene} scale={modelScale} />

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
            </EffectComposer>
        </>
    )
}
