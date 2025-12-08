import { useState } from "react";
import features from "./techFeatures.json";
import "./tech.css";

const FeatureViewer = () => {
    const [selected, setSelected] = useState(features[0]);

    return (
        <div className="tech__container">
            <div className="feature__nav">
                {features.map((item) => (
                    <button
                        key={item.index}
                        className={`feature__button ${selected.index === item.index ? "active" : ""}`}
                        onClick={() => setSelected(item)}
                    >
                        {item.name}
                    </button>
                ))}
            </div>
            <div className="feature__image">
                <img src={selected.image} alt={selected.name} />
            </div>
            <div className="feature__description">
                <p>{selected.description}</p>
            </div>
        </div>
    );
};

export default FeatureViewer;
