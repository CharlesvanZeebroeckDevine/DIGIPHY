import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, PerspectiveCamera, useEnvironment } from '@react-three/drei'
import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { WireframeRevealMaterial } from './WireframeRevealMaterial'
import { useRevealMask } from './useRevealMask'

function CameraRig() {
    const { camera, pointer } = useThree()
    const initialCameraPosition = new THREE.Vector3(0, 5, -20)
    const lookAtTarget = new THREE.Vector3(0, 5, 7)

    // Mutable state for rotation smoothing
    const rotation = useRef({ x: 0, y: 0 })
    const targetRotation = useRef({ x: 0, y: 0 })
    const rotationSpeed = 0.2

    useFrame(() => {
        targetRotation.current.y = pointer.x * Math.PI * 0.03
        targetRotation.current.x = pointer.y * Math.PI * 0.01

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

    return <PerspectiveCamera makeDefault position={[0, 5, -20]} fov={50} near={0.1} far={1000} />
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

function CarModel({ path, envMap, opacity = 1.0 }) {
    const { scene } = useGLTF(path)
    const modelRef = useRef()
    const groupRef = useRef()

    // Initialize custom hook for reveal mask
    // Pass ref to model for raycasting
    const revealMask = useRevealMask(modelRef)
    const { size, camera } = useThree()

    // Constants
    const WIREFRAME_OPACITY_MIN = 0.01
    const WIREFRAME_OPACITY_MAX = 0.09
    const WIREFRAME_PULSATION_SPEED = 0.5

    useEffect(() => {
        if (scene) {
            const box = new THREE.Box3().setFromObject(scene)
            const center = box.getCenter(new THREE.Vector3())

            scene.position.x = -center.x
            scene.position.y = -box.min.y
            scene.position.z = -center.z

            // Replace materials with WireframeRevealMaterial
            scene.traverse((child) => {
                if (child.isMesh) {
                    const originalMaterial = child.material
                    const originalColor = originalMaterial.color ? originalMaterial.color.clone() : new THREE.Color(1, 1, 1)
                    const hasTexture = originalMaterial.map !== null
                    const originalTexture = hasTexture ? originalMaterial.map : new THREE.Texture()
                    const hasRoughnessMap = originalMaterial.roughnessMap !== null
                    const roughnessMap = hasRoughnessMap ? originalMaterial.roughnessMap : new THREE.Texture()
                    const roughness = originalMaterial.roughness !== undefined ? originalMaterial.roughness : 0.5

                    // Create new shader material
                    const material = new WireframeRevealMaterial()

                    material.uniforms.uTime.value = 0
                    material.uniforms.uRevealMask.value = revealMask || new THREE.Texture()
                    material.uniforms.uOriginalTexture.value = originalTexture
                    material.uniforms.uHasTexture.value = hasTexture
                    material.uniforms.uOriginalColor.value = originalColor
                    material.uniforms.uWireframeOpacity.value = 0.025
                    material.uniforms.uRevealMaskSize.value = new THREE.Vector2(size.width, size.height)
                    material.uniforms.uEnvMap.value = envMap || new THREE.Texture()
                    material.uniforms.uHasEnvMap.value = !!envMap
                    material.uniforms.uCameraPosition.value = camera.position
                    material.uniforms.uRoughness.value = roughness
                    material.uniforms.uRoughnessMap.value = roughnessMap
                    material.uniforms.uHasRoughnessMap.value = hasRoughnessMap

                    material.transparent = true
                    material.side = THREE.DoubleSide

                    child.material = material
                    child.castShadow = false
                    child.receiveShadow = false

                    // Store reference to material for animation if needed
                    child.userData.shaderMaterial = material
                }
            })
        }
    }, [scene, revealMask, envMap, size, camera])

    // Animate shader uniforms and handle opacity transition
    useFrame((state) => {
        if (modelRef.current) {
            const time = state.clock.getElapsedTime()
            const pulsation = Math.sin(time * WIREFRAME_PULSATION_SPEED) * 0.5 + 0.5
            const wireframeOpacity = WIREFRAME_OPACITY_MIN + (pulsation * (WIREFRAME_OPACITY_MAX - WIREFRAME_OPACITY_MIN))

            modelRef.current.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Apply opacity transition to material
                    // This multiplies the final shader opacity by our transition opacity
                    child.material.opacity = opacity

                    if (child.material.uniforms) {
                        child.material.uniforms.uTime.value = time
                        child.material.uniforms.uCameraPosition.value.copy(camera.position)
                        child.material.uniforms.uWireframeOpacity.value = wireframeOpacity
                        child.material.uniforms.uRevealMaskSize.value.set(size.width, size.height)

                        // Ensure textures are updated if they change
                        if (revealMask) {
                            child.material.uniforms.uRevealMask.value = revealMask
                        }
                    }
                }
            })
        }
    })

    return (
        <group visible={opacity > 0}>
            <primitive ref={modelRef} object={scene} />
        </group>
    )
}

export default function Experience({ activeModelPath, transitionOpacity }) {
    // Load environment map to pass to shader
    const envMap = useEnvironment({ files: '/studio_small_08_2k.hdr' })
    const { scene } = useThree()

    // Set scene background to black (hiding HDRI background)
    useEffect(() => {
        scene.background = new THREE.Color(0x000000)
    }, [scene])

    return (
        <>
            <CameraRig />

            {/* Lighting only (HDRI background hidden) */}
            <Environment map={envMap} />

            <directionalLight
                position={[10, 10, 5]}
                intensity={0.3}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
            />

            {/* Floor */}
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color={0x808080} roughness={0.8} metalness={0.1} />
            </mesh>

            {/* Models */}
            <AutoScaledModel path="/SB.glb" />

            {/* Car Models with opacity transition */}
            <CarModel
                path="/Lamborghini.glb"
                envMap={envMap}
                opacity={activeModelPath === '/Lamborghini.glb' ? transitionOpacity : 0}
            />
            <CarModel
                path="/CAR2.glb"
                envMap={envMap}
                opacity={activeModelPath === '/CAR2.glb' ? transitionOpacity : 0}
            />
        </>
    )
}
