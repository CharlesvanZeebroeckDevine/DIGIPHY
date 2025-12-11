import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import { useMemo, useEffect } from 'react'
import { SkeletonUtils } from 'three-stdlib'
import { ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

const SphereModel = ({ sphereRefs, position, isLeft }) => {
    const { scene } = useGLTF('/side-scroll/sphere-2.glb')
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

    return (
        <primitive
            object={clone}
            position={position}
            ref={(el) => {
                if (sphereRefs && sphereRefs.current) {
                    if (isLeft) sphereRefs.current.left = el
                    else sphereRefs.current.right = el
                }
            }}
            scale={2.2}
        />
    )
}

const SceneContent = ({ sphereRefs, onReady }) => {
    const { viewport } = useThree()
    const targetX = -viewport.width / 6

    const screenLeftEdge = -viewport.width / 2
    const screenRightEdge = -viewport.width / 2 + viewport.width * (2 / 3)

    const startLeftX = screenLeftEdge - 10
    const startRightX = screenRightEdge + 10

    useEffect(() => {
        if (sphereRefs.current) {
            sphereRefs.current.data = {
                targetX,
                startLeftX,
                startRightX
            }
        }
        if (onReady) {
            onReady()
        }
    }, [onReady, targetX, startLeftX, startRightX, sphereRefs])

    return (
        <>
            <ambientLight intensity={2} />
            <Environment preset="warehouse" />

            <SphereModel
                sphereRefs={sphereRefs}
                position={[startLeftX, 0, 0]}
                isLeft={true}
            />

            <SphereModel
                sphereRefs={sphereRefs}
                position={[startRightX, 0, 0]}
                isLeft={false}
            />
        </>
    )
}

const AutoAlignmentScene2 = ({ sphereRefs, onReady }) => {
    return (
        <div className="horiz_scroll--scene auto_alignment--container">
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                <Canvas events={null} camera={{ position: [0, 0, 10], fov: 35 }}>
                    <ChromaticAberration
                        blendFunction={BlendFunction.NORMAL}
                        offset={[0.5, 0.5]}
                    />
                    <SceneContent sphereRefs={sphereRefs} onReady={onReady} />
                </Canvas>
            </div>

            <div className="auto_alignment--title" style={{ zIndex: 2 }}>
                <h1>Auto</h1>
                <h1>Alignment</h1>
            </div>
            <div className="auto_alignment--text" style={{ zIndex: 2 }}>
                <p>Accuracy is a metric measured in millimeters. DigiPHY uses 10 precision tracking cameras and proprietary algorithms to fuse the physical and virtual worlds instantly, keeping models perfectly aligned no matter how you move.</p>
            </div>
            <div className="auto_alignment--text--2" style={{ zIndex: 2 }}>
                <p>Instant physical feedback makes ideas easier to evaluate, mistakes easier to catch, and decisions easier to make.</p>
            </div>
        </div>
    )
}

export default AutoAlignmentScene2