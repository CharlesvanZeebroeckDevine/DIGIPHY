// Configuration for reveal mask effect
export const REVEAL_CONFIG = {
  fadeSpeed: 0.02,
  brushRadius: 0.2,
  hitboxPadding: 15.0,
  fboScale: 0.5,
  maxFboSize: 1024,
}

// Configuration for model transition animations
export const TRANSITION_CONFIG = {
  fadeOutDuration: 300,  // ms
  waitDuration: 1000,    // ms
  fadeInDuration: 300,   // ms
}

// Configuration for camera behavior
export const CAMERA_CONFIG = {
  initialPosition: { x: 0, y: 10, z: -35 },
  lookAtTarget: { x: 0, y: 5, z: 0 },
  rotationSpeed: 0.1,
  fov: 25,
}

// Car models available in the viewer
export const CAR_MODELS = [
  'car-models/BmwSUV.glb',
  'car-models/CAR2.glb',
  'car-models/FordTransit.glb'
]

// initialPosition: { x: 10, y: 5, z: -22 },
// lookAtTarget: { x: 0, y: 4, z: 0 },

// Flip models on the X axis
export const FLIP_MODELS_X = false

// Configuration for the LED material on the Seating Buck
export const LED_CONFIG = {
  color: '#583BFB',
  intensity: 200
}

// Configuration for the HDRI Environment
export const HDRI_CONFIG = {
  rotation: { x: 1, y: 0, z: 0 },
  intensity: 1
}

// Configuration for Post-Processing Effects
export const POST_PROCESSING_CONFIG = {
  bloom: {
    intensity: 0.1,
    luminanceThreshold: 2,
    luminanceSmoothing: 0.025,
    mipmapBlur: true
  },
  vignette: {
    offset: 0.4,
    darkness: 0.5
  },
  ssao: {
    intensity: 5,
    radius: 0.1,
    luminanceInfluence: 0.5,
    color: 'black'
  },
  toneMapping: {
    mode: 'Reinhard',
    exposure: 1.0
  }
}

// Configuration for the Reflective Floor
export const FLOOR_CONFIG = {
  resolution: 1024,
  blur: [300, 50],
  mirror: 0.2,
  mixBlur: 0.3,
  mixStrength: 12,
  roughness: 0.8,
  depthScale: 0.1,
  minDepthThreshold: 0.5,
  maxDepthThreshold: 1.4,
  color: '#151515',
  metalness: 0.4,
}
