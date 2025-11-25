
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, PerspectiveCamera, ContactShadows, BakeShadows } from '@react-three/drei'
import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { useRevealMask } from './useRevealMask'
import { patchSolidMaterial, patchWireframeMaterial, updateRevealUniforms, createRevealUniforms } from './RevealMaterials'

function CameraRig() {
    const { camera, pointer } = useThree()
    const initialCameraPosition = new THREE.Vector3(0, 5, -32)
    const lookAtTarget = new THREE.Vector3(0, 4, 0)

    // Mutable state for rotation smoothing
    const rotation = useRef({ x: 0, y: 0 })
    const targetRotation = useRef({ x: 0, y: 0 })
    const rotationSpeed = 0.1

    useFrame(() => {
        targetRotation.current.y = pointer.x * Math.PI * 0.1
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

    return <PerspectiveCamera makeDefault position={[0, 5, -15]} fov={30} near={0.1} far={1000} />
}

function AutoScaledModel({ path, ...props }) {
    const { scene } = useGLTF(path)
    const ref = useRef()

    useEffect(() => {
        if (scene) {
            const model = scene
            model.scale.set(1, 1, 1)
            model.position.set(0, 0, 0)
            model.rotation.set(0, 0, 0)

            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())

            const maxDimension = Math.max(size.x, size.y, size.z)
            if (maxDimension > 10) {
                const scale = 10 / maxDimension
                model.scale.multiplyScalar(scale)
                box.setFromObject(model)
                box.getCenter(center)
                box.getSize(size)
            }

            model.position.x = -center.x
            model.position.y = -box.min.y
            model.position.z = -center.z

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })
        }
    }, [scene])

    return <primitive object={scene} {...props} />
}

function CarModel({ path, opacity = 1.0 }) {
    const { scene } = useGLTF(path)
    const modelRef = useRef()
    const wireframeGroupRef = useRef()
    const hitBoxRef = useRef()
    const meshesRef = useRef([])

    // Initialize custom hook for reveal mask
    // OPTIMIZATION: Raycast against the simple hitBox instead of the complex model
    // Note: We keep simulation active even if opacity is 0 to ensure readiness, 
    // or we can pause it but keep the mesh visible. Let's keep it active for now to avoid stutter.
    const revealMaskRef = useRevealMask(hitBoxRef, true)
    const { size, camera } = useThree()

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

        // Toggle shadows based on visibility to avoid ghost shadows
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
        <group>
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

export default function Experience({ activeModelPath, transitionOpacity }) {
    // Load environment map to pass to shader
    const { scene } = useThree()

    // Set scene background to black (hiding HDRI background)
    useEffect(() => {
        scene.background = new THREE.Color(0x000000)
    }, [scene])

    return (
        <>
            <CameraRig />

            {/* Lighting only (HDRI background hidden) */}
            <Environment preset="city" background blur={0.8} />

            <ContactShadows
                resolution={1024}
                scale={50}
                blur={5}
                opacity={0.5}
                far={10}
                color="#000000"
            />

            <BakeShadows />

            {/* Models */}
            <AutoScaledModel path="/SB.glb" />

            {/* Car Models with opacity transition */}
            <CarModel
                path="/BmwSUV.glb"
                opacity={activeModelPath === '/BmwSUV.glb' ? transitionOpacity : 0}
            />
            <CarModel
                path="/CAR2.glb"
                opacity={activeModelPath === '/CAR2.glb' ? transitionOpacity : 0}
            />
            <CarModel
                path="/FordTransit.glb"
                opacity={activeModelPath === '/FordTransit.glb' ? transitionOpacity : 0}
            />
        </>
    )
}
