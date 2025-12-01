import * as THREE from 'three'

// Initialize with a 1x1 black data texture to ensure defined behavior before the FBO is ready
const defaultMask = new THREE.DataTexture(
    new Uint8Array([0, 0, 0, 0]),
    1, 1,
    THREE.RGBAFormat
)
defaultMask.needsUpdate = true

// Shared uniforms for both materials
const sharedUniforms = {
    uRevealMask: { value: defaultMask },
    uRevealMaskSize: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 }
}

// Helper to create a fresh set of uniforms for an instance
export const createRevealUniforms = () => ({
    uRevealMask: { value: defaultMask },
    uRevealMaskSize: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uOpacity: { value: 1.0 }
})

// Dithering function for the solid material
const ditherFragmentChunk = `
  uniform sampler2D uRevealMask;
  uniform vec2 uRevealMaskSize;
  uniform float uOpacity;
  
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
`

// Logic to discard pixels based on the mask
const ditherLogicChunk = `
    // Apply global opacity first
    // Use dithering for smooth fade out if needed, or just alpha
    // For now, simple alpha multiplication for fade out
    diffuseColor.a *= uOpacity;
    
    if (diffuseColor.a <= 0.01) discard;

    vec2 screenUV = gl_FragCoord.xy / uRevealMaskSize;
    float reveal = texture2D(uRevealMask, screenUV).a; // Use alpha channel from mask
    
    // Sharp threshold for "liquid" look
    // We discard anything below 0.1 to create a clean edge
    if (reveal < 0.1) discard;
    
    // Inner Shadow / Rim Effect
    // Darken the edges of the blob to give it volume/shadow
    // Map 0.1->0.2 range to 0.0->1.0
    float edge = smoothstep(0.1, 0.25, reveal);
    
    // Apply shadow: darker at the edge (0.1), lighter inside (>0.25)
    float shadow = 0.3 + 0.7 * edge;
    
    diffuseColor.rgb *= shadow;
`

export const patchSolidMaterial = (material, customUniforms = null) => {
    material.onBeforeCompile = (shader) => {
        const uniforms = customUniforms || sharedUniforms
        shader.uniforms.uRevealMask = uniforms.uRevealMask
        shader.uniforms.uRevealMaskSize = uniforms.uRevealMaskSize
        shader.uniforms.uTime = uniforms.uTime
        shader.uniforms.uOpacity = uniforms.uOpacity

        // Inject uniforms at the top of the fragment shader
        shader.fragmentShader = `
      ${ditherFragmentChunk}
      ${shader.fragmentShader}
    `

        // Inject the discard logic. 
        // <color_fragment> is a safe place where diffuseColor is defined.
        // We modify diffuseColor or discard immediately after.
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
      #include <color_fragment>
      ${ditherLogicChunk}
      `
        )
    }

    material.transparent = true // Enable transparency for fading
    material.depthWrite = true
    material.needsUpdate = true

    return material
}

// Wireframe material logic
const wireframeFragmentChunk = `
  uniform sampler2D uRevealMask;
  uniform vec2 uRevealMaskSize;
  uniform float uTime;
  uniform float uOpacity;
`

const wireframeLogicChunk = `
    // Apply global opacity
    diffuseColor.a *= uOpacity;

    vec2 screenUV = gl_FragCoord.xy / uRevealMaskSize;
    float reveal = texture2D(uRevealMask, screenUV).a;
    
    // Visible when reveal is LOW (0)
    // Tighten the fade out so it disappears right before the solid blob starts (at 0.1)
    // This prevents overlap and creates a "cutout" effect for the shadow
    float visibility = 1.0 - smoothstep(0.0, 0.15, reveal);
    
    if (visibility <= 0.01) discard;
    
    float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
    
    // Apply to outgoing color
    diffuseColor.a *= visibility * (0.01 + 0.05 * pulse);
`

export const patchWireframeMaterial = (material, customUniforms = null) => {
    material.onBeforeCompile = (shader) => {
        const uniforms = customUniforms || sharedUniforms
        shader.uniforms.uRevealMask = uniforms.uRevealMask
        shader.uniforms.uRevealMaskSize = uniforms.uRevealMaskSize
        shader.uniforms.uTime = uniforms.uTime
        shader.uniforms.uOpacity = uniforms.uOpacity

        shader.fragmentShader = `
      ${wireframeFragmentChunk}
      ${shader.fragmentShader}
    `

        // For MeshBasicMaterial, <color_fragment> is also available
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
      #include <color_fragment>
      ${wireframeLogicChunk}
      `
        )
    }

    material.transparent = true
    material.depthWrite = false
    material.blending = THREE.AdditiveBlending
    material.wireframe = true
    material.color = new THREE.Color(1, 1, 1)

    return material
}

export const updateRevealUniforms = (maskTexture, size, time, customUniforms = null) => {
    const uniforms = customUniforms || sharedUniforms
    if (maskTexture) {
        uniforms.uRevealMask.value = maskTexture
    }
    uniforms.uRevealMaskSize.value.set(size.width, size.height)
    uniforms.uTime.value = time
}
