import React, { useRef, useEffect } from "react";
import gsap from "gsap";

const FeatureInfo = ({ selectedFeature }) => {
    const textRef = useRef(null);

    useEffect(() => {
        if (!textRef.current) return;

        gsap.fromTo(textRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power2.inOut", delay: 0.1 }
        );

    }, [selectedFeature]);

    return (
        <div className="feature_description">
            <p key={selectedFeature.index} ref={textRef}>
                {selectedFeature.description}
            </p>
        </div>
    );
};

export default FeatureInfo;
