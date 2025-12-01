import * as THREE from 'three';
import React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Image, ScrollControls, Scroll } from '@react-three/drei';

const IMAGES = [
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
]

const ITEM_WIDTH = 4
const GAP = 0.5

const Item = ({ url, index, position }) => {
    return (
        <Image
            url={url}
            position={position}
            scale={[ITEM_WIDTH, 6, 1]}
            transparent
        />
    )
}

const SideScrollSection = () => {
    const { width: viewportWidth } = useThree((state) => state.viewport)
    const totalItemWidth = ITEM_WIDTH + GAP
    const totalScrollWidth = IMAGES.length * totalItemWidth
    const pages = Math.max(1, totalScrollWidth / viewportWidth) + 0.5

    return(
        <ScrollControls horizontal pages={pages} damping={0.1}>
            <Scroll>
                {IMAGES.map((url, i) => (
                    <Item
                        key={i}
                        index={i}
                        url={url}
                        position={[i * (ITEM_WIDTH + GAP), 0, 0]}
                    />
                ))}
            </Scroll>
        </ScrollControls>
    )
}

const sideScrollScene = () => {
    return (
        <div style={{ width: '100vw', height: '100vh'}}>
            <Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
                <SideScrollSection />
            </Canvas>
        </div>
    )
}

export default sideScrollScene
    