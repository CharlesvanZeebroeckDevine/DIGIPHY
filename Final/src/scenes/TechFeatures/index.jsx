import "./tech.css";

import { useState, useRef, useLayoutEffect } from "react";
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

    const titleRef = useRef(null);
    const navRef = useRef(null);
    const infoRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set([titleRef.current, navRef.current, infoRef.current], {
                y: 100,
                opacity: 0
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: wrapperRef.current,
                    start: "top top",
                    end: "+=150%",
                    pin: true,
                    scrub: 1,
                }
            });

            gsap.fromTo(containerRef.current,
                { clipPath: 'inset(0% 10% 0% 10% round 1px)' },
                {
                    clipPath: 'inset(0% 0% 0% 0% round 0px)',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: wrapperRef.current,
                        start: 'top bottom',
                        end: 'top top',
                        scrub: true
                    }
                }
            );

            tl.to({}, { duration: 0.1 })
                .to([titleRef.current, navRef.current, infoRef.current], {
                    y: 0,
                    opacity: 1,
                    stagger: 0.1,
                    duration: 0.5,
                    ease: "power2.out"
                })
                .to({}, { duration: 0.4 });

        }, wrapperRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={wrapperRef} className="feature_container--wrapper">
            <div ref={containerRef} className="feature_container">
                <div className="feature_background">
                    <TechFeaturesCanvas selectedFeature={selectedFeature} />
                </div>

                <div style={{ pointerEvents: 'none', position: 'relative', zIndex: 1 }}>
                    <div ref={titleRef}>
                        <VariableText
                            className="feature_title"
                            baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                            hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                            radius={400}
                        >
                            <h2>The Hidden Layer Inside DigiPHY</h2>
                        </VariableText>
                    </div>
                </div>

                <div className="tech_container">
                    <div ref={navRef} className="feature_nav">
                        <FeatureNavigation
                            features={features}
                            selectedFeature={selectedFeature}
                            onSelectFeature={setSelectedFeature}
                        />
                    </div>

                    <div ref={infoRef} className="feature_description">
                        <FeatureInfo selectedFeature={selectedFeature} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechFeatures;