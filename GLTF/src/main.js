import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// Scene setup
const scene = new THREE.Scene();
// Background will be set by HDRI

// Camera setup - Fixed FOV and position
const camera = new THREE.PerspectiveCamera(
    50, // Field of view (fixed)
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
);
// Fixed camera position (will not be adjusted based on model)
camera.position.set(0, 5, -20);

// Store initial camera position and target for cursor following
// Initialize from actual camera position so it updates when you change the position above
let initialCameraPosition = camera.position.clone();
let lookAtTarget = new THREE.Vector3(0, 5, 7);
let currentRotationX = 0;
let currentRotationY = 0;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
// Use outputColorSpace for Three.js r152+ (replaces outputEncoding)
if (renderer.outputColorSpace !== undefined) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
} else {
    // Fallback for older versions
    renderer.outputEncoding = THREE.sRGBEncoding;
}
document.getElementById('app').appendChild(renderer.domElement);

// Camera controls - locked position, only rotation follows cursor
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth camera movement
controls.dampingFactor = 0.05;
controls.enablePan = false; // Disable panning
controls.enableZoom = false; // Disable zooming
controls.enableRotate = false; // Disable manual rotation (we'll handle it with cursor)
controls.minDistance = 1; // Minimum zoom distance
controls.maxDistance = 50; // Maximum zoom distance
controls.maxPolarAngle = Math.PI * 0.75; // Allow looking from below but not completely upside down
controls.minPolarAngle = 0; // Allow looking from above
controls.target.set(0, 0, 0); // Look at the origin initially
controls.update(); // Initialize controls

// Cursor tracking for camera rotation
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
const rotationSpeed = 0.2; // How fast the camera follows the cursor (0-1)

document.addEventListener('mousemove', (event) => {
    // Normalize mouse position to -1 to 1 range
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Calculate target rotation angles (limited range for subtle movement)
    targetRotationY = mouseX * Math.PI * 0.03; // Horizontal rotation (left/right)
    targetRotationX = mouseY * Math.PI * 0.01; // Vertical rotation (up/down)

    // Raycaster for hover detection on Lamborghini
    if (lamborghiniModel) {
        raycaster.setFromCamera(
            new THREE.Vector2(mouseX, -mouseY),
            camera
        );

        // Check if cursor hits the car directly
        const carIntersects = raycaster.intersectObject(lamborghiniModel, true);

        // Always get cursor position in 3D space (raycast to ground plane)
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const cursorWorldPosition = new THREE.Vector3();
        const planeIntersection = raycaster.ray.intersectPlane(groundPlane, cursorWorldPosition);

        // Only proceed if we have a valid cursor position (raycast hit the ground plane)
        if (planeIntersection !== null) {
            // Check if cursor is directly on car OR within brush radius of car
            if (carIntersects.length > 0) {
                // Direct hit - use car intersection point for distance check, cursor position for drawing
                isHoveringLamborghini = true;
                mouseWorldPosition.copy(cursorWorldPosition);
            } else {
                // No direct hit - check if cursor is within brush radius of car (in screen space)
                // Project cursor position to screen space
                const cursorScreenPos = cursorWorldPosition.clone().project(camera);
                const cursorScreenX = (cursorScreenPos.x * 0.5 + 0.5) * window.innerWidth;
                const cursorScreenY = (cursorScreenPos.y * -0.5 + 0.5) * window.innerHeight;

                // Check distance to car in screen space by raycasting in a circle around cursor
                let nearCar = false;
                const checkRadius = BRUSH_RADIUS * BRUSH_CHECK_MULTIPLIER; // Check slightly beyond brush radius for smoother trigger
                const numChecks = 8; // Check 8 points around the cursor

                for (let i = 0; i < numChecks; i++) {
                    const angle = (i / numChecks) * Math.PI * 2;
                    const offsetX = Math.cos(angle) * checkRadius;
                    const offsetY = Math.sin(angle) * checkRadius;

                    const checkScreenX = cursorScreenX + offsetX;
                    const checkScreenY = cursorScreenY + offsetY;

                    // Convert back to normalized device coordinates
                    const checkNDCX = (checkScreenX / window.innerWidth) * 2 - 1;
                    const checkNDCY = -((checkScreenY / window.innerHeight) * 2 - 1);

                    raycaster.setFromCamera(new THREE.Vector2(checkNDCX, checkNDCY), camera);
                    const checkIntersects = raycaster.intersectObject(lamborghiniModel, true);

                    if (checkIntersects.length > 0) {
                        nearCar = true;
                        break;
                    }
                }

                isHoveringLamborghini = nearCar;
                if (nearCar) {
                    mouseWorldPosition.copy(cursorWorldPosition);
                }
            }
        } else {
            // No valid cursor position (ray doesn't intersect ground plane)
            // This can happen when looking up at steep angles
            isHoveringLamborghini = false;
        }
    }
});

// HDRI Environment Lighting
const hdrLoader = new HDRLoader();
hdrLoader.load(
    '/studio_small_08_2k.hdr',
    (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        // Set as scene background
        scene.background = texture;

        // Set as environment map for realistic reflections and lighting
        scene.environment = texture;
        environmentMap = texture; // Store for shader use

        // Update shader materials with environment map
        lamborghiniMeshes.forEach(meshInfo => {
            if (meshInfo.shaderMaterial && meshInfo.shaderMaterial.uniforms) {
                meshInfo.shaderMaterial.uniforms.uEnvMap.value = texture;
                meshInfo.shaderMaterial.uniforms.uHasEnvMap.value = true;
            }
        });

        // Update all materials to use the environment map
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];

                materials.forEach((material) => {
                    if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                        material.needsUpdate = true;
                    }
                });
            }
        });

        console.log('HDRI environment loaded successfully');
    },
    (progress) => {
        console.log('HDRI loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading HDRI:', error);
        // Fallback to simple lighting if HDRI fails
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        scene.background = new THREE.Color(0x87ceeb);
    }
);

// Additional directional light for shadows (optional, HDRI provides most lighting)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// Plane floor
const planeGeometry = new THREE.PlaneGeometry(50, 50);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080, // Gray floor
    roughness: 0.8,
    metalness: 0.1
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// GLTF Loader
const gltfLoader = new GLTFLoader();
let model = null;
let rig = null; // Store the rig/skeleton
const bones = new Map(); // Store bones by name
const initialBonePositions = new Map(); // Store initial bone positions for reset
const wireframeMaterials = []; // Store wireframe materials for pulsating effect

// Liquid hover reveal effect state
let lamborghiniModel = null; // Reference to Lamborghini model
const lamborghiniMeshes = []; // Array to store mesh info with original materials
const raycaster = new THREE.Raycaster(); // For hover detection
let mouseWorldPosition = new THREE.Vector3(); // World position of mouse hover
let isHoveringLamborghini = false; // Hover state
let environmentMap = null; // Store environment map for shader

// Brush settings for reveal effect
const BRUSH_RADIUS = 120; // Brush radius in pixels
const BRUSH_CHECK_MULTIPLIER = 1.5; // Check radius multiplier for hover detection

// Brush appearance settings
const BRUSH_COLOR = { r: 255, g: 255, b: 255 }; // RGB color (255, 255, 255 = white)
const BRUSH_OPACITY_CENTER = 1; // Opacity at center (0.0 to 1.0) - lower = less trail
const BRUSH_OPACITY_MID = 0.6; // Opacity at 70% radius (0.0 to 1.0)
const BRUSH_OPACITY_EDGE = 0; // Opacity at edge (usually 0 for smooth falloff)
const BRUSH_FADE_SPEED = 0.99; // How fast brush trails fade (0.95 = 5% fade per frame, lower = faster fade)

// Wireframe opacity settings
const WIREFRAME_OPACITY_MIN = 0.01; // Minimum opacity (1%) - darkest point of pulsation
const WIREFRAME_OPACITY_MAX = 0.04; // Maximum opacity (4%) - brightest point of pulsation
const WIREFRAME_PULSATION_SPEED = 0.5; // Speed multiplier for pulsation (1.0 = normal)

gltfLoader.load(
    '/SB.glb',
    (gltf) => {
        model = gltf.scene;

        // Enable shadows and access rig
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Access skeleton/rig if this is a skinned mesh
                if (child.isSkinnedMesh && child.skeleton) {
                    rig = child.skeleton;

                    // Store all bones by name and their initial positions
                    child.skeleton.bones.forEach((bone) => {
                        bones.set(bone.name, bone);
                        // Store initial position (clone to avoid reference issues)
                        initialBonePositions.set(bone.name, bone.position.clone());
                    });

                    console.log('Rig found!');
                    console.log('Number of bones:', child.skeleton.bones.length);
                    console.log('Bone names:', child.skeleton.bones.map(b => b.name));

                    // Create HUD controls after bones are loaded
                    createBoneControls();
                }
            }
        });

        // Calculate bounding box to center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Optionally scale if model is too large/small
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 10) {
            const scale = 10 / maxDimension;
            model.scale.multiplyScalar(scale);
            // Recalculate box after scaling
            box.setFromObject(model);
            box.getCenter(center);
            box.getSize(size);
        }

        // Center the model horizontally, but place it on the floor
        model.position.x = -center.x;
        model.position.y = -box.min.y; // Place bottom of model on floor (y=0)
        model.position.z = -center.z;

        scene.add(model);

        // Camera position and FOV are fixed - no automatic adjustment
        // Update controls target to center of model (at floor level)
        controls.target.set(0, 0, 0);
        lookAtTarget.set(0, 1, 2);
        controls.update();

        console.log('GLTF model loaded successfully');
        console.log('Model size:', size);
        console.log('Camera position (fixed):', camera.position);
        console.log('Camera FOV (fixed):', camera.fov);

        // Export model, rig, and bones to window for easy access from DOM
        window.model = model;
        window.rig = rig;
        window.bones = bones;

        // Helper function to get a bone by name (for easier DOM access)
        window.getBone = (name) => {
            return bones.get(name);
        };

        // Helper function to list all bone names
        window.getBoneNames = () => {
            return Array.from(bones.keys());
        };

        console.log('Rig and bones exported to window. Use window.bones or window.getBone(name) to access bones.');
    },
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading GLTF model:', error);
    }
);

// Face-based wireframe shader for liquid reveal effect
const wireframeVertexShader = `
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
`;

const wireframeFragmentShader = `
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
    screenUV.y = 1.0 - screenUV.y; // Flip Y coordinate
    
    // Sample reveal mask at screen coordinates
    vec4 revealMask = texture2D(uRevealMask, screenUV);
    float reveal = revealMask.a; // Use mask alpha directly - it fades naturally over time
    
    // Create wireframe effect using edge detection
    // Simple wireframe pattern based on UV coordinates
    vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
    float wireframe = min(min(grid.x, grid.y), 1.0);
    wireframe = 1.0 - smoothstep(0.0, 1.5, wireframe);
    
    // Wireframe color (white with pulsating opacity)
    vec3 wireframeColor = vec3(1.0);
    float wireframeAlpha = uWireframeOpacity * (1.0 - reveal);
    
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
            // For higher roughness, use stratified sampling for better quality
            // Create tangent space basis for sampling
            vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
            if (length(tangent) < 0.1) {
                tangent = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
            }
            vec3 bitangent = cross(normal, tangent);
            
            // Use stratified sampling (regular grid) instead of random for better quality
            int gridSize = int(mix(2.0, 4.0, roughness));
            gridSize = max(2, min(4, gridSize));
            int totalSamples = gridSize * gridSize;
            float sampleRadius = roughness * 0.3;
            
            vec3 sampleSum = vec3(0.0);
            float totalWeight = 0.0;
            
            // Stratified grid sampling
            for (int y = 0; y < 4; y++) {
                if (y >= gridSize) break;
                for (int x = 0; x < 4; x++) {
                    if (x >= gridSize) break;
                    
                    // Calculate stratified position in grid
                    vec2 gridPos = vec2(float(x), float(y)) / float(gridSize);
                    // Center the grid and add small jitter for better coverage
                    vec2 jitter = vec2(
                        (gridPos.x - 0.5) * 2.0 + (random(vUv + vec2(float(x), float(y))) - 0.5) * 0.2,
                        (gridPos.y - 0.5) * 2.0 + (random(vUv + vec2(float(y), float(x))) - 0.5) * 0.2
                    );
                    
                    // Create offset in tangent space
                    vec3 offset = (jitter.x * tangent + jitter.y * bitangent) * sampleRadius;
                    vec3 sampleDir = normalize(reflectDir + offset);
                    
                    // Convert to equirectangular UV
                    float longitude = atan(sampleDir.z, sampleDir.x) / (2.0 * 3.14159265359) + 0.5;
                    float latitude = asin(sampleDir.y) / 3.14159265359 + 0.5;
                    vec2 envUV = vec2(longitude, latitude);
                    
                    // Sample environment map
                    vec3 sampleColor = texture2D(uEnvMap, envUV).rgb;
                    
                    // Weight based on distance from center (Gaussian-like falloff)
                    float dist = length(jitter);
                    float weight = exp(-dist * dist * 2.0);
                    sampleSum += sampleColor * weight;
                    totalWeight += weight;
                }
            }
            
            // Average samples
            if (totalWeight > 0.0) {
                envColor = sampleSum / totalWeight;
            } else {
                // Fallback
                float longitude = atan(reflectDir.z, reflectDir.x) / (2.0 * 3.14159265359) + 0.5;
                float latitude = asin(reflectDir.y) / 3.14159265359 + 0.5;
                vec2 envUV = vec2(longitude, latitude);
                envColor = texture2D(uEnvMap, envUV).rgb;
            }
            
            // Apply denoising: bilateral filter in environment map UV space
            if (roughness > 0.2) {
                vec3 denoisedColor = envColor;
                float denoiseWeight = 1.0;
                float denoiseRadius = (roughness - 0.2) * 0.015; // Adaptive radius based on roughness
                
                // Base UV coordinates
                float baseLongitude = atan(reflectDir.z, reflectDir.x) / (2.0 * 3.14159265359) + 0.5;
                float baseLatitude = asin(reflectDir.y) / 3.14159265359 + 0.5;
                
                // Sample neighboring pixels in environment map UV space
                for (int i = -2; i <= 2; i++) {
                    for (int j = -2; j <= 2; j++) {
                        if (i == 0 && j == 0) continue;
                        
                        vec2 neighborUV = vec2(
                            baseLongitude + float(i) * denoiseRadius,
                            baseLatitude + float(j) * denoiseRadius
                        );
                        neighborUV = clamp(neighborUV, vec2(0.0), vec2(1.0));
                        
                        vec3 neighborColor = texture2D(uEnvMap, neighborUV).rgb;
                        
                        // Bilateral filter: weight by color similarity and distance
                        float colorDiff = length(neighborColor - envColor);
                        float spatialDist = float(abs(i) + abs(j));
                        float weight = exp(-colorDiff * 2.0 - spatialDist * 0.5);
                        
                        denoisedColor += neighborColor * weight;
                        denoiseWeight += weight;
                    }
                }
                
                envColor = denoisedColor / denoiseWeight;
            }
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
    
    // Final opacity: wireframe when not revealed, original when revealed
    float finalOpacity = mix(wireframeAlpha, 1.0, reveal);
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}
`;

// Create reveal mask canvas and texture
const revealCanvas = document.createElement('canvas');
revealCanvas.width = window.innerWidth;
revealCanvas.height = window.innerHeight;
const revealCtx = revealCanvas.getContext('2d', { willReadFrequently: true });
revealCtx.fillStyle = 'rgba(0, 0, 0, 0)';
revealCtx.fillRect(0, 0, revealCanvas.width, revealCanvas.height);

const revealTexture = new THREE.CanvasTexture(revealCanvas);
revealTexture.needsUpdate = true;
revealTexture.minFilter = THREE.LinearFilter;
revealTexture.magFilter = THREE.LinearFilter;
revealTexture.wrapS = THREE.ClampToEdgeWrapping;
revealTexture.wrapT = THREE.ClampToEdgeWrapping;

// Load Lamborghini model with transparent wireframe shader
gltfLoader.load(
    '/CAR2.glb',
    (gltf) => {
        lamborghiniModel = gltf.scene;

        // Apply custom shader material with reveal effect to all meshes
        lamborghiniModel.traverse((child) => {
            if (child.isMesh) {
                // Store original material before replacing
                const originalMaterial = child.material;
                const originalColor = originalMaterial.color
                    ? originalMaterial.color.clone()
                    : new THREE.Color(0xffffff);

                // Check if material has texture
                const hasTexture = originalMaterial.map !== null;
                const originalTexture = hasTexture ? originalMaterial.map : null;

                // Extract roughness (check for roughness map or roughness value)
                const hasRoughnessMap = originalMaterial.roughnessMap !== null;
                const roughnessMap = hasRoughnessMap ? originalMaterial.roughnessMap : null;
                // Get roughness value (default to 0.5 if not specified)
                const roughness = originalMaterial.roughness !== undefined
                    ? originalMaterial.roughness
                    : 0.5;

                // Create custom shader material
                const shaderMaterial = new THREE.ShaderMaterial({
                    vertexShader: wireframeVertexShader,
                    fragmentShader: wireframeFragmentShader,
                    uniforms: {
                        uTime: { value: 0 },
                        uRevealMask: { value: revealTexture },
                        uOriginalTexture: { value: originalTexture },
                        uHasTexture: { value: hasTexture },
                        uOriginalColor: { value: originalColor },
                        uWireframeOpacity: { value: (WIREFRAME_OPACITY_MIN + WIREFRAME_OPACITY_MAX) / 2 },
                        uRevealMaskSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                        uEnvMap: { value: environmentMap },
                        uHasEnvMap: { value: environmentMap !== null },
                        uCameraPosition: { value: camera.position },
                        uRoughness: { value: roughness },
                        uRoughnessMap: { value: roughnessMap },
                        uHasRoughnessMap: { value: hasRoughnessMap }
                    },
                    transparent: true,
                    side: THREE.DoubleSide
                });

                // Handle both single material and material arrays
                if (Array.isArray(child.material)) {
                    child.material = child.material.map((mat, index) => {
                        const meshInfo = {
                            mesh: child,
                            originalMaterial: mat,
                            shaderMaterial: shaderMaterial.clone(),
                            materialIndex: index
                        };
                        lamborghiniMeshes.push(meshInfo);
                        return meshInfo.shaderMaterial;
                    });
                } else {
                    child.material = shaderMaterial;
                    const meshInfo = {
                        mesh: child,
                        originalMaterial: originalMaterial,
                        shaderMaterial: shaderMaterial
                    };
                    lamborghiniMeshes.push(meshInfo);
                }

                child.castShadow = false;
                child.receiveShadow = false;
            }
        });

        // Calculate bounding box to position the Lamborghini
        const box = new THREE.Box3().setFromObject(lamborghiniModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the model horizontally, but place it on the floor
        lamborghiniModel.position.x = -center.x;
        lamborghiniModel.position.y = -box.min.y; // Place bottom of model on floor (y=0)
        lamborghiniModel.position.z = -center.z;

        scene.add(lamborghiniModel);

        console.log('Lamborghini model loaded with wireframe shader');
        console.log('Lamborghini size:', size);
    },
    (progress) => {
        console.log('Lamborghini loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading Lamborghini model:', error);
    }
);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.update();

    // Resize reveal mask canvas
    revealCanvas.width = window.innerWidth;
    revealCanvas.height = window.innerHeight;
    revealCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    revealCtx.fillRect(0, 0, revealCanvas.width, revealCanvas.height);
    revealTexture.needsUpdate = true;

    // Update reveal mask size uniform in all shader materials
    lamborghiniMeshes.forEach(meshInfo => {
        if (meshInfo.shaderMaterial && meshInfo.shaderMaterial.uniforms) {
            meshInfo.shaderMaterial.uniforms.uRevealMaskSize.value.set(window.innerWidth, window.innerHeight);
        }
    });
});

// Animation loop
let time = 0;
function animate() {
    requestAnimationFrame(animate);

    // Smoothly interpolate camera rotation to follow cursor
    currentRotationX += (targetRotationX - currentRotationX) * rotationSpeed;
    currentRotationY += (targetRotationY - currentRotationY) * rotationSpeed;

    // Apply rotation to camera (rotate around the target point)
    // Only apply if initial position is set (after model loads)
    if (initialCameraPosition.length() > 0) {
        // Create rotation quaternion
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(currentRotationX, currentRotationY, 0, 'YXZ'));

        // Rotate the camera position around the target
        const offset = initialCameraPosition.clone().sub(lookAtTarget);
        offset.applyQuaternion(quaternion);
        camera.position.copy(lookAtTarget).add(offset);

        // Make camera look at the target and update controls
        camera.lookAt(lookAtTarget);
        controls.target.copy(lookAtTarget);
    }

    controls.update(); // Update controls for smooth damping

    // Ensure camera matrices are up to date for correct projection calculations
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Update skeleton/rig if it exists
    if (rig) {
        rig.update();
    }

    // Update time for animations
    time += 0.05;

    // Update reveal mask
    if (lamborghiniMeshes.length > 0) {
        // Fade existing mask over time
        const imageData = revealCtx.getImageData(0, 0, revealCanvas.width, revealCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i + 3] *= BRUSH_FADE_SPEED; // Fade alpha channel
        }
        revealCtx.putImageData(imageData, 0, 0);

        // Draw liquid-distorted circle at hover position when hovering
        if (isHoveringLamborghini) {
            // Convert world position to screen coordinates
            const screenPos = mouseWorldPosition.clone().project(camera);
            const screenX = (screenPos.x * 0.5 + 0.5) * revealCanvas.width;
            const screenY = (screenPos.y * -0.5 + 0.5) * revealCanvas.height;

            // Draw liquid-distorted circle
            const numPoints = 32;
            const distortionAmount = 15;

            revealCtx.beginPath();
            for (let i = 0; i <= numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const noise1 = Math.sin(angle * 3 + time * 2) * distortionAmount;
                const noise2 = Math.cos(angle * 5 - time * 1.5) * (distortionAmount * 0.5);
                const noise3 = Math.sin(angle * 7 + time * 3) * (distortionAmount * 0.3);
                const radius = BRUSH_RADIUS + noise1 + noise2 + noise3;
                const x = screenX + Math.cos(angle) * radius;
                const y = screenY + Math.sin(angle) * radius;
                if (i === 0) {
                    revealCtx.moveTo(x, y);
                } else {
                    revealCtx.lineTo(x, y);
                }
            }
            revealCtx.closePath();

            // Create radial gradient
            const gradient = revealCtx.createRadialGradient(
                screenX, screenY, BRUSH_RADIUS * 0.3,
                screenX, screenY, BRUSH_RADIUS * 1.2
            );
            gradient.addColorStop(0, `rgba(${BRUSH_COLOR.r}, ${BRUSH_COLOR.g}, ${BRUSH_COLOR.b}, ${BRUSH_OPACITY_CENTER})`);
            gradient.addColorStop(0.7, `rgba(${BRUSH_COLOR.r}, ${BRUSH_COLOR.g}, ${BRUSH_COLOR.b}, ${BRUSH_OPACITY_MID})`);
            gradient.addColorStop(1, `rgba(${BRUSH_COLOR.r}, ${BRUSH_COLOR.g}, ${BRUSH_COLOR.b}, ${BRUSH_OPACITY_EDGE})`);

            revealCtx.fillStyle = gradient;
            revealCtx.fill();
        }

        // Update reveal texture
        revealTexture.needsUpdate = true;
    }

    // Update shader uniforms
    lamborghiniMeshes.forEach(meshInfo => {
        const uniforms = meshInfo.shaderMaterial.uniforms;
        uniforms.uTime.value = time;
        uniforms.uCameraPosition.value.copy(camera.position);
        // Update wireframe opacity with pulsation
        const pulsation = Math.sin(time * WIREFRAME_PULSATION_SPEED) * 0.5 + 0.5; // 0 to 1
        const wireframeOpacity = WIREFRAME_OPACITY_MIN + (pulsation * (WIREFRAME_OPACITY_MAX - WIREFRAME_OPACITY_MIN));
        uniforms.uWireframeOpacity.value = wireframeOpacity;
    });

    // Pulsating wireframe opacity effect (for old wireframe materials if any)
    const opacity = (Math.sin(time) * 0.5 + 0.5) * 0.03 + 0.01;
    wireframeMaterials.forEach(material => {
        material.opacity = opacity;
    });

    renderer.render(scene, camera);
}

animate();

// HUD Functions
function createBoneControls() {
    const boneControlsContainer = document.getElementById('boneControls');
    if (!boneControlsContainer) return;

    if (bones.size === 0) {
        boneControlsContainer.innerHTML = '<div class="no-bones">No bones found in the model.</div>';
        return;
    }

    boneControlsContainer.innerHTML = '';

    // Create controls for each bone
    bones.forEach((bone, boneName) => {
        const boneGroup = document.createElement('div');
        boneGroup.className = 'bone-group';
        boneGroup.dataset.boneName = boneName.toLowerCase();

        const boneHeader = document.createElement('div');
        boneHeader.className = 'bone-header';

        const boneNameLabel = document.createElement('div');
        boneNameLabel.className = 'bone-name';
        boneNameLabel.textContent = boneName;

        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = () => resetBonePosition(boneName);

        boneHeader.appendChild(boneNameLabel);
        boneHeader.appendChild(resetBtn);
        boneGroup.appendChild(boneHeader);

        // Create controls for X, Y, Z
        const axes = ['x', 'y', 'z'];

        axes.forEach(axis => {
            const controlRow = document.createElement('div');
            controlRow.className = 'control-row';

            const axisLabel = document.createElement('div');
            axisLabel.className = `axis-label ${axis}`;
            axisLabel.textContent = axis.toUpperCase();

            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '-200';
            slider.max = '200';
            slider.step = '0.01';
            slider.value = bone.position[axis];
            slider.dataset.boneName = boneName;
            slider.dataset.axis = axis;

            const numberInput = document.createElement('input');
            numberInput.type = 'number';
            numberInput.step = '0.01';
            numberInput.value = bone.position[axis].toFixed(2);
            numberInput.dataset.boneName = boneName;
            numberInput.dataset.axis = axis;

            // Update bone position when slider changes
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                numberInput.value = value.toFixed(2);
                updateBonePosition(boneName, axis, value);
            });

            // Update bone position when number input changes
            numberInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) || 0;
                slider.value = value;
                updateBonePosition(boneName, axis, value);
            });

            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(numberInput);

            controlRow.appendChild(axisLabel);
            controlRow.appendChild(sliderContainer);

            boneGroup.appendChild(controlRow);
        });

        boneControlsContainer.appendChild(boneGroup);
    });

    // Setup search functionality
    const searchInput = document.getElementById('boneSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const boneGroups = document.querySelectorAll('.bone-group');

            boneGroups.forEach(group => {
                const boneName = group.dataset.boneName;
                if (boneName.includes(searchTerm)) {
                    group.classList.remove('hidden');
                } else {
                    group.classList.add('hidden');
                }
            });
        });
    }

    // Setup toggle button
    const toggleBtn = document.getElementById('toggleHud');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const hud = document.getElementById('hud');
            if (hud) {
                hud.classList.toggle('collapsed');
                toggleBtn.textContent = hud.classList.contains('collapsed') ? '+' : '−';
            }
        });
    }
}

function updateBonePosition(boneName, axis, value) {
    const bone = bones.get(boneName);
    if (bone) {
        bone.position[axis] = value;
        // Mark bone as needing update
        if (rig) {
            rig.update();
        }
    }
}

function resetBonePosition(boneName) {
    const initialPos = initialBonePositions.get(boneName);
    const bone = bones.get(boneName);

    if (initialPos && bone) {
        bone.position.copy(initialPos);

        // Update UI controls
        const sliders = document.querySelectorAll(`input[type="range"][data-bone-name="${boneName}"]`);
        const numberInputs = document.querySelectorAll(`input[type="number"][data-bone-name="${boneName}"]`);

        sliders.forEach(slider => {
            const axis = slider.dataset.axis;
            slider.value = initialPos[axis];
        });

        numberInputs.forEach(input => {
            const axis = input.dataset.axis;
            input.value = initialPos[axis].toFixed(2);
        });

        if (rig) {
            rig.update();
        }
    }
}

