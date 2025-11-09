import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// Scene setup
const scene = new THREE.Scene();
// Background will be set by HDRI

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
);
// Initial camera position (will be adjusted when model loads)
camera.position.set(0, 3, 5);

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

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth camera movement
controls.dampingFactor = 0.05;
controls.minDistance = 1; // Minimum zoom distance
controls.maxDistance = 50; // Maximum zoom distance
controls.maxPolarAngle = Math.PI * 0.75; // Allow looking from below but not completely upside down
controls.minPolarAngle = 0; // Allow looking from above
controls.target.set(0, 0, 0); // Look at the origin initially
controls.update(); // Initialize controls

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
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x90ee90, // Light green
    roughness: 0.8,
    metalness: 0.2
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// Grid helper for reference
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
scene.add(gridHelper);

// GLTF Loader
const gltfLoader = new GLTFLoader();
let model = null;
const materialGroups = new Map(); // Store materials organized by name/vertex group

gltfLoader.load(
    '/GLTF/Test.gltf',
    (gltf) => {
        model = gltf.scene;

        // Enable shadows and organize materials by vertex groups
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Organize materials by name (vertex groups)
                if (child.material) {
                    // Handle both single material and material arrays
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];

                    materials.forEach((material, index) => {
                        const materialName = material.name || `material_${index}`;

                        if (!materialGroups.has(materialName)) {
                            materialGroups.set(materialName, {
                                material: material,
                                meshes: []
                            });
                        }

                        // Store reference to this mesh for this material
                        materialGroups.get(materialName).meshes.push(child);

                        // Ensure material uses environment map if available
                        if (scene.environment && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)) {
                            material.envMap = scene.environment;
                            material.needsUpdate = true;
                        }
                    });
                }
            }
        });

        // Log all material groups found
        console.log('Material groups (vertex groups) found:');
        materialGroups.forEach((group, name) => {
            console.log(`  - ${name}: ${group.meshes.length} mesh(es)`);
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

        // Adjust camera to frame the model nicely
        // Calculate distance to fit the model in view
        const fov = camera.fov * (Math.PI / 180);
        const modelWidth = Math.max(size.x, size.z);
        const modelHeight = size.y;

        // Calculate distance needed to fit model width in view
        const distanceForWidth = (modelWidth / 2) / Math.tan(fov / 2) * 1.2;
        // Calculate distance needed to fit model height in view
        const distanceForHeight = (modelHeight / 2) / Math.tan(fov / 2) * 1.2;

        // Use the larger distance to ensure model fits
        const distance = Math.max(distanceForWidth, distanceForHeight);
        const height = modelHeight * 0.3 + 1; // Position camera at about 30% up the model

        camera.position.set(0, height, distance);

        // Update controls target to center of model
        controls.target.set(0, modelHeight * 0.4, 0);
        controls.update();

        console.log('GLTF model loaded successfully');
        console.log('Model size:', size);
        console.log('Camera position:', camera.position);
        console.log('Camera distance:', distance);

        // Export material groups to window for easy access
        window.materialGroups = materialGroups;
        window.model = model;
    },
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading GLTF model:', error);
    }
);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.update();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls for smooth damping
    renderer.render(scene, camera);
}

animate();

