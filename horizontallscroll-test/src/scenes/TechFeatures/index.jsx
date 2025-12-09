import "./tech.css";
import FeatureViewer from "./FeatureViewer";

const TechFeatures = () => {
    return (
        <>
            <div className="feature__container">
                <h2 className="visibility-hidden">Tech Features</h2>
                <div className="feature__intro">
                    <p className="feature__title">The Hidden Layer Inside</p>
                    <p className="feature__subtitle">explore the technology</p>
                </div>
                <FeatureViewer />
            </div>
        </>
    );
};

export default TechFeatures;
