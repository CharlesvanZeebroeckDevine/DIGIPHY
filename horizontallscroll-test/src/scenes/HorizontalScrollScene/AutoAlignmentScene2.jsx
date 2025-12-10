import { Html } from '@react-three/drei'

const AutoAlignmentScene2 = () => {
    return (
        <>
            <div className="horiz_scroll--scene auto_alignment--container">
                <div className="auto_alignment--title">
                    <h1>Auto</h1>
                    <h1>Alignment</h1>
                </div>
                <div className="auto_alignment--text">
                    <p>Accuracy is a metric measured in millimeters. DigiPHY uses 10 precision tracking cameras and proprietary algorithms to fuse the physical and virtual worlds instantly, keeping models perfectly aligned no matter how you move.</p>
                </div>
                <div className="auto_alignment--text--2">
                    <p>Instant physical feedback makes ideas easier to evaluate, mistakes easier to catch, and decisions easier to make.</p>
                </div>
            </div>
        </>
    )
}

export default AutoAlignmentScene2