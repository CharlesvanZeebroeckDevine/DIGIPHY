import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import React, { useRef, useMemo, useState, useEffect } from 'react';
import vertexShader from './shader/vertex.glsl?raw';
import fragmentShader from './shader/fragment.glsl?raw';
import features from './techFeatures.json';
import gsap from 'gsap';

const ImageTransitionMaterial = shaderMaterial(
    {
        uTexture: new THREE.Texture(),
        uProgress: 0,
        uSize: new THREE.Vector2(1, 1),
        uResolution: new THREE.Vector2(1, 1),
        uImageResolution: new THREE.Vector2(1, 1),
    },
    vertexShader,
    fragmentShader
);

import { extend } from '@react-three/fiber';
extend({ ImageTransitionMaterial });

const TransitionPlane = ({ texture, isVisible, isActive, isBackground }) => {
    const materialRef = useRef();
    const meshRef = useRef();
    const { viewport, size } = useThree();

    useFrame(() => {
        if (materialRef.current) {
            materialRef.current.uSize = new THREE.Vector2(viewport.width, viewport.height);
            materialRef.current.uResolution = new THREE.Vector2(viewport.width, viewport.height);
        }
    });

    useEffect(() => {
        if (materialRef.current && texture) {
            materialRef.current.uTexture = texture;
            if (texture.image) {
                materialRef.current.uImageResolution = new THREE.Vector2(
                    texture.image.width,
                    texture.image.height
                );
            }
        }
    }, [texture]);

    useEffect(() => {
        if (materialRef.current) {
            if (isBackground) {
                materialRef.current.uProgress = 1.5;
            } else if (isActive) {
                materialRef.current.uProgress = 0;
                gsap.to(materialRef.current, {
                    uProgress: 1.5,
                    duration: 1.5,
                    ease: "power2.inOut",
                });
            }
        }
    }, [isActive, isBackground]);

    return (
        <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry args={[1, 1, 32, 32]} />
            <imageTransitionMaterial
                ref={materialRef}
                transparent={true}
            />
        </mesh>
    );
};

const Scene = ({ selectedFeatureIndex }) => {
    const textures = useTexture(features.map(f => f.image));
    const { viewport } = useThree();

    const [displayState, setDisplayState] = useState({
        prev: 0,
        current: selectedFeatureIndex,
        key: 0
    });

    useEffect(() => {
        if (selectedFeatureIndex !== displayState.current) {
            setDisplayState(prevState => ({
                prev: prevState.current,
                current: selectedFeatureIndex,
                key: prevState.key + 1
            }));
        }
    }, [selectedFeatureIndex]);

    return (
        <>
            <TransitionPlane
                texture={textures[displayState.prev]}
                isActive={false}
                isBackground={true}
            />

            <TransitionPlane
                key={displayState.key}
                texture={textures[displayState.current]}
                isActive={true}
            />
        </>
    );
};

const TechFeaturesCanvas = ({ selectedFeature }) => {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [0, 0, 1] }}
                dpr={[1, 2]}
            >
                <Scene selectedFeatureIndex={selectedFeature.index} />
            </Canvas>
        </div>
    );
};

export default TechFeaturesCanvas;
