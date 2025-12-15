import React, { useRef, useEffect, Suspense } from "react";
import gsap from "gsap";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Center, OrbitControls, useHelper } from "@react-three/drei";

const Model = ({ path }) => {
    const { scene } = useGLTF(path);
    return <primitive object={scene} scale={3} />;
}

const FeatureDisplay = ({ selectedFeature }) => {
    const imageRef = useRef(null);
    const containerRef = useRef(null);


    useEffect(() => {
        if (!imageRef.current) return;
        const tl = gsap.timeline();

        tl.fromTo(imageRef.current,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "power2.inOut" }
        );

    }, [selectedFeature]);

    

    return (
        <div className="feature_image" ref={containerRef}>
            <div ref={imageRef} style={{ width: '100%', height: '100%' }}>
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <directionalLight position={[0, 20, 15]} intensity={10} />
                    <Suspense fallback={null}>
                        <Center>
                            <Model path={selectedFeature.image} key={selectedFeature.image} />
                        </Center>
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate={true} autoRotateSpeed={2} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
                        <axesHelper args={[5]} />
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
};

export default FeatureDisplay;
