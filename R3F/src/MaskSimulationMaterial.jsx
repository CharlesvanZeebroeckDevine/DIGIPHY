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
    uFadeSpeed: 0.02, // Subtractive decay amount
    uBrushRadius: 0.2,
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

    // Simplex 3D Noise 
    // by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;

    // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      //  x0 = x0 - 0.0 + 0.0 * C 
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    // Permutations
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients
    // ( N*N points uniformly over a square, mapped onto an octahedron.)
      float n_ = 1.0/7.0; // N=7
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,N*N)

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

    // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    // Smooth Maximum (Metaball function)
    // k controls the smoothness of the blend
    float smax(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
        float boost = k * h * (1.0 - h);
        
        // Fix: Gate the boost using MIN to only apply when merging TWO blobs
        // If one value is zero (isolated blob), we don't want to boost it
        // This allows the decay to work properly
        boost *= smoothstep(0.0, 0.05, min(a, b));
        
        return mix(b, a, h) + boost;
    }

    void main() {
      vec4 oldColor = texture2D(uTexture, vUv);
      float oldAlpha = oldColor.a;

      // --- Organic Decay ---
      float newAlpha = 0.0;
      
      // OPTIMIZATION: Only calculate expensive decay noise if there is actually paint to decay
      // This skips the heavy snoise calculation for the vast majority of empty pixels
      if (oldAlpha > 0.001) {
          float decayNoise = snoise(vec3(vUv * 8.0, uTime * 0.2));
          float decayFactor = 0.5 + (decayNoise * 0.5 + 0.5);
          newAlpha = oldAlpha - (uFadeSpeed * decayFactor);
          
          if (newAlpha < 0.005) newAlpha = 0.0;
      }
      
      // --- Organic Brush ---
      float brushAlpha = 0.0;

      if (uIsHovering) {
        float aspectRatio = uResolution.x / uResolution.y;
        vec2 aspect = vec2(aspectRatio, 1.0);
        
        vec2 uvCorrected = vUv * aspect;
        vec2 mouseCorrected = uMouse * aspect;
        
        vec2 diff = uvCorrected - mouseCorrected;
        float dist = length(diff);
        
        // OPTIMIZATION: Only calculate expensive brush noise if we are close to the brush
        // The max distorted radius is uBrushRadius * (0.9 + 0.4) = 1.3 * radius
        // We use 1.5 as a safe margin to ensure no clipping
        if (dist < uBrushRadius * 1.5) {
            float brushNoise = snoise(vec3(vUv * 5.0, uTime * 1.5));
            
            // Increased distortion and radius
            float distortedRadius = uBrushRadius * (0.9 + brushNoise * 0.4);
            
            // Softer edge to allow better merging (0.2 instead of 0.5 start)
            float brush = 1.0 - smoothstep(distortedRadius * 0.2, distortedRadius, dist);
            
            brushAlpha = brush;
        }
      }
      
      // Combine using Smooth Max for metaball merging effect
      // k = 0.2 gives a nice gooey blend
      float finalAlpha = smax(newAlpha, brushAlpha, 0.2);
      
      finalAlpha = clamp(finalAlpha, 0.0, 1.0);
      
      gl_FragColor = vec4(1.0, 1.0, 1.0, finalAlpha);
    }
  `
)

extend({ MaskSimulationMaterial })

export { MaskSimulationMaterial }
