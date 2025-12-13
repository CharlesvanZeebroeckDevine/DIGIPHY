import React, { useRef, useEffect } from "react";
import gsap from "gsap";

const FeatureNavigation = ({ features, selectedFeature, onSelectFeature }) => {
    const indicatorRef = useRef(null);
    const navRef = useRef(null);

    useEffect(() => {
        const activeBtn = navRef.current.querySelector(`.feature_button[data-index="${selectedFeature.index}"]`);

        if (activeBtn && indicatorRef.current) {
            gsap.to(indicatorRef.current, {
                top: activeBtn.offsetTop,
                height: activeBtn.offsetHeight,
                duration: 0.5,
                ease: "power2.inOut"
            });
        }
    }, [selectedFeature]);

    return (
        <div className="feature_nav" ref={navRef} style={{ position: 'relative' }}>
            <div
                className="nav_track"
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: 'var(--doctor)',
                }}
            />

            <div
                ref={indicatorRef}
                className="nav_indicator"
                style={{
                    position: 'absolute',
                    right: '-1.5px', 
                    width: '4px',
                    backgroundColor: 'var(--meteor-shower)',
                    borderRadius: '2px',
                    top: 0,
                    height: 0,
                    zIndex: 2 
                }}
            />

            {features.map((item) => (
                <button
                    key={item.index}
                    data-index={item.index}
                    className={`feature_button ${selectedFeature.index === item.index ? "active" : ""}`}
                    onClick={() => onSelectFeature(item)}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    {item.name}
                </button>
            ))}
        </div>
    );
};

export default FeatureNavigation;
