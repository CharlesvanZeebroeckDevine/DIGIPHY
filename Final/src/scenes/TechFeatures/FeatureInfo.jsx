import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const FeatureInfo = ({ selectedFeature }) => {
    const textRef = useRef();

    useLayoutEffect(() => {
        if (!textRef.current) return;

        let split;
        const init = () => {
            // Split text into lines, words, and chars
            split = new SplitText(textRef.current, { type: "chars, words" });

            // Initial state: chars hidden and slightly shifted left
            gsap.set(split.chars, { opacity: 0, x: -5 });

            // Animate chars in
            gsap.to(split.chars, {
                opacity: 1,
                x: 0,
                duration: 0.05, // Fast char reveal
                stagger: 0.01,  // Stagger for typewriter effect
                ease: "none",
                delay: 0.1
            });
        };

        // Ensure fonts are loaded before splitting
        document.fonts.ready.then(() => {
            init();
        });

        // Cleanup: revert split text to original DOM structure when component unmounts or feature changes
        return () => {
            if (split) split.revert();
        };
    }, [selectedFeature]);

    return (
        <div className="feature_description">
            <span key={selectedFeature.index} ref={textRef}>
                {selectedFeature.description}
            </span>
        </div>
    );
};

export default FeatureInfo;
