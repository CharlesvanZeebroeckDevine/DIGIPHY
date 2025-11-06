import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(
    20, // Field of view
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

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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

// FBX Loader
const fbxLoader = new FBXLoader();
let model = null;

fbxLoader.load(
    '/DigiPHY_model.fbx',
    (fbx) => {
        model = fbx;

        // Enable shadows on the model
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
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

        console.log('FBX model loaded successfully');
        console.log('Model size:', size);
        console.log('Camera position:', camera.position);
        console.log('Camera distance:', distance);
    },
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading FBX model:', error);
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

