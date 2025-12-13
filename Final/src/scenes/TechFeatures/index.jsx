import { useState } from "react";
import "./tech.css";
import VariableText from '../../Components/VariableText'
import features from "./techFeatures.json";
import FeatureNavigation from "./FeatureNavigation";
import FeatureDisplay from "./FeatureDisplay";
import FeatureInfo from "./FeatureInfo";

const TechFeatures = () => {
    const [selectedFeature, setSelectedFeature] = useState(features[0]);

    return (
        <>
            <div className="feature_container">
                <h2 className="visibility-hidden">Tech Features</h2>
                <div style={{ pointerEvents: 'none' }}>
                    <VariableText
                        className="feature_title"
                        baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                        hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                        radius={400}
                    >
                        The Hidden Layer Inside DigiPHY
                    </VariableText>
                </div>

                <div className="tech_container">
                    <FeatureNavigation
                        features={features}
                        selectedFeature={selectedFeature}
                        onSelectFeature={setSelectedFeature}
                    />
                    <FeatureDisplay selectedFeature={selectedFeature} />
                    <FeatureInfo selectedFeature={selectedFeature} />
                </div>
            </div>
        </>
    );
};

export default TechFeatures;
