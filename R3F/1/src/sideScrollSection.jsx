import React from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber'

const SideScrollSection = () => {
    const items = [
        { id: 1, title: "BMW SUV", desc: "Luxury & performance" },
        { id: 2, title: "BMW SUV", desc: "Luxury & performance" },

    ];

    return (
        <Canvas>
            <color attach="background" args={["#111111"]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
        </Canvas>
    );
};

export default SideScrollSection;