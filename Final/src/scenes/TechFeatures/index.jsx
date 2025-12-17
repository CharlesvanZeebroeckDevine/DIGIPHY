import "./tech.css";

import { useState, useLayoutEffect, useRef } from "react";
import VariableText from '../../Components/VariableText'
import features from "./techFeatures.json";
import FeatureNavigation from "./FeatureNavigation";
import FeatureInfo from "./FeatureInfo";
import TechFeaturesCanvas from "./TechFeaturesCanvas";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TechFeatures = () => {
    const [selectedFeature, setSelectedFeature] = useState(features[0]);
    const wrapperRef = useRef(null);
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { width: '80%' },
                {
                    width: '100%',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: wrapperRef.current,
                        start: 'top bottom',
                        end: 'top top',
                        scrub: true
                    }
                }
            );
        }, wrapperRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={wrapperRef} className="feature_container--wrapper">
            <div ref={containerRef} className="feature_container">
                <div className="feature_background">
                    <TechFeaturesCanvas selectedFeature={selectedFeature} />
                </div>
                <h2 className="visibility-hidden">Tech Features</h2>
                <div style={{ pointerEvents: 'none', position: 'relative', zIndex: 1 }}>
                    <VariableText
                        className="feature_title"
                        baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                        hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                        radius={400}
                    >
                        <h2>The Hidden Layer Inside DigiPHY</h2>
                    </VariableText>
                </div>

                <div className="tech_container">
                    <FeatureNavigation
                        features={features}
                        selectedFeature={selectedFeature}
                        onSelectFeature={setSelectedFeature}
                    />
                    <FeatureInfo selectedFeature={selectedFeature} />
                </div>
            </div>
        </div>
    );
};

export default TechFeatures;