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
  waitDuration: 300,    // ms
  fadeInDuration: 300,   // ms
}

// Configuration for camera behavior
export const CAMERA_CONFIG = {
  initialPosition: { x: 0, y: 7, z: -25 },
  lookAtTarget: { x: 0, y: 4, z: 0 },
  rotationSpeed: 0.1,
  fov: 30,
}

// Car models available
export const CAR_MODELS = [
  'car-models/BmwSUV.glb',
  'car-models/AudiSport.glb',
  'car-models/FordTransit.glb'
]


// Flip models on the X axis
export const FLIP_MODELS_X = false

// Configuration for the LED material on the Seating Buck
export const LED_CONFIG = {
  color: '#913bfb',
  intensity: 200
}

// Configuration for the Window Glow
export const WINDOW_CONFIG = {
  intensity: 34, // High intensity for bloom
}

// Configuration for the HDRI Environment
export const HDRI_CONFIG = {
  rotation: { x: 3, y: -0.4, z: 2 },
  intensity: 1.1
}

// Configuration for Post-Processing Effects
export const POST_PROCESSING_CONFIG = {
  bloom: {
    intensity: 0.2,
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
    radius: 1,
    luminanceInfluence: 0.2,
    color: 'black'
  },
  toneMapping: {
    mode: 'Reinhard',
    exposure: 1.0
  }
}

// Configuration for the Reflective Floor
export const FLOOR_CONFIG = {
  resolution: 1024, // Signifcant performance 
  blur: [300, 100],
  mirror: 0.5,
  mixBlur: 0.7,
  mixStrength: 1.5,
  roughness: 1.0,
  depthScale: 0.1,
  minDepthThreshold: 0.5,
  maxDepthThreshold: 1.4,
  color: '#16141a',
  metalness: 0.4,
}
