import React, { useRef, useEffect } from "react";
import gsap from "gsap";

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
            <img
                key={selectedFeature.image} 
                ref={imageRef}
                src={selectedFeature.image}
                alt={selectedFeature.name}
            />
        </div>
    );
};

export default FeatureDisplay;
