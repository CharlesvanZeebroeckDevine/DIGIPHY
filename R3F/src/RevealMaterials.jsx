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

// Dithering function for the solid material
const ditherFragmentChunk = `
  uniform sampler2D uRevealMask;
  uniform vec2 uRevealMaskSize;
  
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
`

// Logic to discard pixels based on the mask
const ditherLogicChunk = `
    vec2 screenUV = gl_FragCoord.xy / uRevealMaskSize;
    float reveal = texture2D(uRevealMask, screenUV).a; // Use alpha channel from mask
    
    float noise = random(gl_FragCoord.xy);
    float alpha = smoothstep(0.0, 1.0, reveal);
    
    // Discard if the random noise is greater than our alpha/reveal value
    // This creates the dissolve effect
    if (alpha < noise) discard;
`

export const patchSolidMaterial = (material) => {
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uRevealMask = sharedUniforms.uRevealMask
        shader.uniforms.uRevealMaskSize = sharedUniforms.uRevealMaskSize
        shader.uniforms.uTime = sharedUniforms.uTime

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

    material.transparent = false // Important for Z-buffer
    material.depthWrite = true
    material.needsUpdate = true

    return material
}

// Wireframe material logic
const wireframeFragmentChunk = `
  uniform sampler2D uRevealMask;
  uniform vec2 uRevealMaskSize;
  uniform float uTime;
`

const wireframeLogicChunk = `
    vec2 screenUV = gl_FragCoord.xy / uRevealMaskSize;
    float reveal = texture2D(uRevealMask, screenUV).a;
    
    // Visible when reveal is LOW (0)
    float visibility = 1.0 - smoothstep(0.0, 0.5, reveal);
    
    if (visibility <= 0.01) discard;
    
    float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
    
    // Apply to outgoing color
    diffuseColor.a *= visibility * (0.01 + 0.05 * pulse);
`

export const patchWireframeMaterial = (material) => {
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uRevealMask = sharedUniforms.uRevealMask
        shader.uniforms.uRevealMaskSize = sharedUniforms.uRevealMaskSize
        shader.uniforms.uTime = sharedUniforms.uTime

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

export const updateRevealUniforms = (maskTexture, size, time) => {
    if (maskTexture) {
        sharedUniforms.uRevealMask.value = maskTexture
    }
    sharedUniforms.uRevealMaskSize.value.set(size.width, size.height)
    sharedUniforms.uTime.value = time
}
