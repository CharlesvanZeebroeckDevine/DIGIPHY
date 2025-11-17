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

// GLTF Loader
const gltfLoader = new GLTFLoader();
let model = null;
let rig = null; // Store the rig/skeleton
const bones = new Map(); // Store bones by name
const initialBonePositions = new Map(); // Store initial bone positions for reset
const wireframeMaterials = []; // Store wireframe materials for pulsating effect

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

// Load Lamborghini model with transparent wireframe shader
gltfLoader.load(
    '/Lamborghini.glb',
    (gltf) => {
        const lamborghiniModel = gltf.scene;

        // Apply transparent wireframe shader to all meshes
        lamborghiniModel.traverse((child) => {
            if (child.isMesh) {
                // Create wireframe material with transparency
                const wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff, // White wireframe
                    wireframe: true,
                    transparent: true,
                    opacity: 0.02,
                    side: THREE.FrontSide
                });

                // Handle both single material and material arrays
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(() => {
                        const clonedMaterial = wireframeMaterial.clone();
                        wireframeMaterials.push(clonedMaterial);
                        return clonedMaterial;
                    });
                } else {
                    child.material = wireframeMaterial;
                    wireframeMaterials.push(wireframeMaterial);
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
});

// Animation loop
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls for smooth damping

    // Update skeleton/rig if it exists
    if (rig) {
        rig.update();
    }

    // Pulsating wireframe opacity effect
    time += 0.05; // Adjust speed of pulsation (lower = slower)
    // Use sine wave to create smooth on/off effect (oscillates between 0 and 1)
    // Then map it to opacity range (e.g., 0.02 to 0.8)
    const opacity = (Math.sin(time) * 0.5 + 0.5) * 0.03 + 0.01; // Range: 0.02 to 0.8

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

