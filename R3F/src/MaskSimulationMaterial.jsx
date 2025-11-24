import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const MaskSimulationMaterial = shaderMaterial(
    {
        uTexture: new THREE.Texture(),
        uMouse: new THREE.Vector2(0.5, 0.5),
        uResolution: new THREE.Vector2(1, 1),
        uIsHovering: false,
        uTime: 0,
        uFadeSpeed: 0.95,
        uBrushRadius: 0.15, // UV space radius
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform bool uIsHovering;
    uniform float uTime;
    uniform float uFadeSpeed;
    uniform float uBrushRadius;

    varying vec2 vUv;

    void main() {
      // Sample the previous frame
      vec4 oldColor = texture2D(uTexture, vUv);
      
      // Apply fade
      float newAlpha = oldColor.a * uFadeSpeed;
      
      // Hard cutoff to prevent ghosting
      if (newAlpha < 0.005) newAlpha = 0.0;
      
      float brushAlpha = 0.0;

      if (uIsHovering) {
        // Calculate distance to mouse, correcting for aspect ratio to ensure circular brush
        float aspectRatio = uResolution.x / uResolution.y;
        vec2 aspect = vec2(aspectRatio, 1.0);
        
        vec2 uvCorrected = vUv * aspect;
        vec2 mouseCorrected = uMouse * aspect;
        
        vec2 diff = uvCorrected - mouseCorrected;
        float dist = length(diff);
        
        // Calculate angle for noise
        float angle = atan(diff.y, diff.x);
        
        // Replicate the noise logic from the canvas version
        // The original used pixels, here we use UV space relative to radius
        float distortion = 0.0;
        distortion += sin(angle * 3.0 + uTime * 2.0);
        distortion += cos(angle * 5.0 - uTime * 1.5) * 0.5;
        distortion += sin(angle * 7.0 + uTime * 3.0) * 0.3;
        
        // Scale distortion magnitude (approx 10% of radius)
        float radiusNoise = uBrushRadius * (1.0 + distortion * 0.1);
        
        // Soft edge brush
        float brush = 1.0 - smoothstep(radiusNoise * 0.8, radiusNoise, dist);
        
        brushAlpha = brush;
      }
      
      // Combine old and new (max operator to keep the trail)
      float finalAlpha = max(newAlpha, brushAlpha);
      
      gl_FragColor = vec4(1.0, 1.0, 1.0, finalAlpha);
    }
  `
)

extend({ MaskSimulationMaterial })

export { MaskSimulationMaterial }
