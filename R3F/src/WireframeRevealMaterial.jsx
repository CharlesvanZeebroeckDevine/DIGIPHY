import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const vertexShader = `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec4 vScreenPosition;

void main() {
    vUv = uv;
    
    // Calculate world position and normal for reflections
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    
    // Calculate view position for reflections
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    // Calculate screen position for reveal mask sampling
    vec4 screenPos = projectionMatrix * mvPosition;
    vScreenPosition = screenPos;
    
    gl_Position = screenPos;
}
`

const fragmentShader = `
uniform float uTime;
uniform sampler2D uRevealMask;
uniform sampler2D uOriginalTexture;
uniform bool uHasTexture;
uniform vec3 uOriginalColor;
uniform float uWireframeOpacity;
uniform vec2 uRevealMaskSize;
uniform sampler2D uEnvMap;
uniform bool uHasEnvMap;
uniform vec3 uCameraPosition;
uniform float uRoughness;
uniform sampler2D uRoughnessMap;
uniform bool uHasRoughnessMap;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec4 vScreenPosition;

// Noise function for liquid distortion
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    // Convert screen position to UV coordinates for reveal mask sampling
    vec3 screenPos = vScreenPosition.xyz / vScreenPosition.w;
    vec2 screenUV = (screenPos.xy * 0.5 + 0.5);
    
    // Original logic: screenUV.y = 1.0 - screenUV.y; // Flip Y coordinate
    // If mask is inverted, we should NOT flip Y here if canvas drawing already flips it.
   
    
    // Let's try NOT flipping manually here and let Three.js handle it.
    // screenUV.y = 1.0 - screenUV.y; 
    
    // Sample reveal mask at screen coordinates
    vec4 revealMask = texture2D(uRevealMask, screenUV);
    float reveal = revealMask.a; // Use mask alpha directly - it fades naturally over time
    
    // Completely zero out reveal values below threshold to ensure full wireframe restoration
    // This prevents tiny floating point values from affecting opacity
    const float REVEAL_THRESHOLD = 0.01;
    reveal = reveal * step(REVEAL_THRESHOLD, reveal);
    
    // Create wireframe effect using edge detection
    // Simple wireframe pattern based on UV coordinates
    vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
    float wireframe = min(min(grid.x, grid.y), 1.0);
    wireframe = 1.0 - smoothstep(0.0, 1.5, wireframe);
    
    // Wireframe color (white with pulsating opacity)
    // Wireframe opacity should remain constant - we don't reduce it based on reveal
    vec3 wireframeColor = vec3(1.0);
    float wireframeAlpha = uWireframeOpacity;
    
    // Original material color
    vec3 originalColor = uHasTexture ? texture2D(uOriginalTexture, vUv).rgb : uOriginalColor;
    
    // Calculate environment map reflections with roughness
    vec3 finalColor = originalColor;
    if (uHasEnvMap && reveal > 0.0) {
        // Get roughness value (from texture or uniform)
        float roughness = uHasRoughnessMap ? texture2D(uRoughnessMap, vUv).g : uRoughness;
        roughness = clamp(roughness, 0.0, 1.0);
        
        // Calculate reflection vector in world space
        // View direction from world position to camera
        vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
        vec3 normal = normalize(vWorldNormal);
        vec3 reflectDir = reflect(-viewDir, normal);
        
        // Sample environment map with roughness-based blur using stratified sampling
        vec3 envColor = vec3(0.0);
        
        // For low roughness, use single sharp sample
        if (roughness < 0.1) {
            float longitude = atan(reflectDir.z, reflectDir.x) / (2.0 * 3.14159265359) + 0.5;
            float latitude = asin(reflectDir.y) / 3.14159265359 + 0.5;
            vec2 envUV = vec2(longitude, latitude);
            envColor = texture2D(uEnvMap, envUV).rgb;
        } else {
            // For higher roughness, use simple sampling fallback to keep it performant in React
            // (The complex stratified sampling from original is heavy for this port unless needed)
             float longitude = atan(reflectDir.z, reflectDir.x) / (2.0 * 3.14159265359) + 0.5;
             float latitude = asin(reflectDir.y) / 3.14159265359 + 0.5;
             vec2 envUV = vec2(longitude, latitude);
             
             // Simple blur simulation by sampling at lower mipmap level if supported, 
             // or just standard sampling for now.
             envColor = texture2D(uEnvMap, envUV).rgb;
        }
        
        // Blend reflections with original color (simulate metallic/reflective surface)
        // Use a simple approximation: mix based on view angle and reveal amount
        float fresnel = pow(1.0 - dot(viewDir, normal), 2.0);
        float reflectivity = 0.5 + fresnel * 0.5; // More reflective at grazing angles
        // Roughness also affects reflectivity (rougher = less reflective)
        reflectivity *= (1.0 - roughness * 0.5);
        finalColor = mix(originalColor, envColor, reflectivity * 0.6 * reveal);
    }
    
    // Blend between wireframe and original (with reflections) based on reveal
    finalColor = mix(wireframeColor, finalColor, reveal);
    
    // Final opacity: 
    // - When reveal = 0 (wireframe only): opacity = wireframeAlpha (low, constant)
    // - When reveal = 1 (material only): opacity = 1.0 (full)
    // - During transition: opacity stays at wireframeAlpha until reveal is mostly complete,
    //   then quickly transitions to 1.0
    // This prevents opacity from becoming higher than wireframe during partial reveals
    float opacityTransition = smoothstep(0.7, 1.0, reveal);
    float finalOpacity = mix(wireframeAlpha, 1.0, opacityTransition);
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}
`

const WireframeRevealMaterial = shaderMaterial(
    {
        uTime: 0,
        uRevealMask: new THREE.Texture(),
        uOriginalTexture: new THREE.Texture(),
        uHasTexture: false,
        uOriginalColor: new THREE.Color(1, 1, 1),
        uWireframeOpacity: 0.045,
        uRevealMaskSize: new THREE.Vector2(1, 1),
        uEnvMap: new THREE.Texture(),
        uHasEnvMap: false,
        uCameraPosition: new THREE.Vector3(0, 0, 0),
        uRoughness: 0.5,
        uRoughnessMap: new THREE.Texture(),
        uHasRoughnessMap: false
    },
    vertexShader,
    fragmentShader
)

// Pre-register the material so it's available as <wireframeRevealMaterial />
extend({ WireframeRevealMaterial })

export { WireframeRevealMaterial }
