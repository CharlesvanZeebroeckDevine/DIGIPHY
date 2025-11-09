import { Application, Sprite, Assets, DisplacementFilter, Texture } from 'pixi.js';

// 1. Create a new Pixi Application
const app = new Application();

// IIFE (Immediately Invoked Function Expression) to use async/await
(async () => {
    // Initialize the app and make it fullscreen
    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        resizeTo: window, // Automatically resize renderer to fill the browser
        background: '#000000', // Black background (behind both layers)
    });

    // Append canvas to the hero section instead of body
    const heroSection = document.getElementById('hero');
    heroSection.appendChild(app.canvas);

    // 2. Load your assets
    // The '/_filename_.jpg' path works because they are in the 'public/' folder
    const loadedAssets = await Assets.load([
        '/my_photo-3.jpg',           // Background image
        '/my_depth_map-3.jpg',       // Background depth map
        '/my_photo-4.png',         // Overlay image
        '/my_depth_map-4.png',     // Overlay depth map
    ]);

    // 3. Create sprites for BACKGROUND layer (always visible with parallax)
    const backgroundSprite = new Sprite(loadedAssets['/my_photo-3.jpg']);
    const backgroundDepthSprite = new Sprite(loadedAssets['/my_depth_map-3.jpg']);

    // 4. Create sprites for OVERLAY layer (revealed on hover)
    const originalSprite = new Sprite(loadedAssets['/my_photo-4.png']);
    const depthSprite = new Sprite(loadedAssets['/my_depth_map-4.png']);

    // 5. Set up sprite properties for both layers
    // Background layer
    backgroundSprite.anchor.set(0.5);
    backgroundDepthSprite.anchor.set(0.5);

    // Overlay layer
    originalSprite.anchor.set(0.5);
    depthSprite.anchor.set(0.5);

    // Function to resize and center sprites
    function resizeSprites() {
        const screenAspect = app.screen.width / app.screen.height;
        const textureAspect = originalSprite.texture.width / originalSprite.texture.height;

        let scale = 1;
        if (screenAspect > textureAspect) {
            scale = app.screen.width / originalSprite.texture.width;
        } else {
            scale = app.screen.height / originalSprite.texture.height;
        }

        // Position and scale background layer
        backgroundSprite.x = app.screen.width / 2;
        backgroundSprite.y = app.screen.height / 2;
        backgroundSprite.scale.set(scale);
        backgroundDepthSprite.x = app.screen.width / 2;
        backgroundDepthSprite.y = app.screen.height / 2;
        backgroundDepthSprite.scale.set(scale);

        // Position and scale overlay layer
        originalSprite.x = app.screen.width / 2;
        originalSprite.y = app.screen.height / 2;
        originalSprite.scale.set(scale);
        depthSprite.x = app.screen.width / 2;
        depthSprite.y = app.screen.height / 2;
        depthSprite.scale.set(scale);
    }

    // Call it once to set initial size
    resizeSprites();
    // Listen for window resize to adjust
    window.addEventListener('resize', resizeSprites);

    // 6. Create displacement filters for both layers
    // Background parallax filter
    const backgroundDisplacementFilter = new DisplacementFilter(backgroundDepthSprite);
    backgroundSprite.filters = [backgroundDisplacementFilter];
    backgroundDisplacementFilter.scale.x = 40;
    backgroundDisplacementFilter.scale.y = 40;

    // Overlay parallax filter
    const displacementFilter = new DisplacementFilter(depthSprite);
    originalSprite.filters = [displacementFilter];
    displacementFilter.scale.x = 40;
    displacementFilter.scale.y = 40;

    // 7. Add sprites to the stage in layers
    // Layer 1: Background (always visible)
    app.stage.addChild(backgroundDepthSprite);
    app.stage.addChild(backgroundSprite);

    // Layer 2: Overlay (revealed on hover)
    app.stage.addChild(depthSprite);
    app.stage.addChild(originalSprite);

    // 8. Implement the mouse pan effect for parallax on BOTH layers
    app.stage.interactive = true; // Make the stage listen for events

    let mousePosition = { x: app.screen.width / 2, y: app.screen.height / 2 };
    let isMouseInside = false; // Track if mouse is inside canvas
    let isMouseMoving = false; // Track if mouse is actively moving
    let mouseMovementTimeout = null;

    app.stage.on('mousemove', (event) => {
        // Store mouse position
        mousePosition.x = event.global.x;
        mousePosition.y = event.global.y;
        isMouseInside = true;
        isMouseMoving = true;

        // Clear previous timeout
        if (mouseMovementTimeout) {
            clearTimeout(mouseMovementTimeout);
        }

        // Set timeout to stop painting after mouse stops moving
        mouseMovementTimeout = setTimeout(() => {
            isMouseMoving = false;
        }, 200); // 100ms after last movement, stop painting

        // Get mouse position as a normalized value from -0.5 to +0.5
        const mouseX = (event.global.x / app.screen.width) - 0.5;
        const mouseY = (event.global.y / app.screen.height) - 0.5;

        // Apply parallax to BOTH layers with the same effect
        backgroundDisplacementFilter.scale.x = -mouseX * 40;
        backgroundDisplacementFilter.scale.y = -mouseY * 40;

        displacementFilter.scale.x = -mouseX * 40;
        displacementFilter.scale.y = -mouseY * 40;
    });

    // Detect when mouse leaves the canvas
    app.stage.on('mouseout', () => {
        isMouseInside = false;
        isMouseMoving = false;
        if (mouseMovementTimeout) {
            clearTimeout(mouseMovementTimeout);
        }
    });

    // Detect when mouse enters the canvas
    app.stage.on('mouseover', () => {
        isMouseInside = true;
    });

    // 9. Create paint reveal mask with fade-out effect (only for overlay layer)
    const revealCanvas = document.createElement('canvas');
    revealCanvas.width = app.screen.width;
    revealCanvas.height = app.screen.height;
    const revealCtx = revealCanvas.getContext('2d', { willReadFrequently: true });

    // Start with fully transparent (important!)
    revealCtx.clearRect(0, 0, revealCanvas.width, revealCanvas.height);

    // Create texture from canvas
    const revealTexture = Texture.from(revealCanvas);
    const revealMaskSprite = new Sprite(revealTexture);

    // Position and scale the mask to match screen
    revealMaskSprite.x = 0;
    revealMaskSprite.y = 0;
    revealMaskSprite.width = app.screen.width;
    revealMaskSprite.height = app.screen.height;

    // Apply the reveal mask to the original sprite
    app.stage.addChild(revealMaskSprite);
    originalSprite.mask = revealMaskSprite;

    // Paint reveal parameters
    const brushRadius = 150; // Size of the reveal brush
    const fadeSpeed = 0.98; // How fast revealed areas fade (lower = faster fade to transparent)

    // 9. Create animated liquid displacement map for hover effect
    const liquidCanvas = document.createElement('canvas');
    liquidCanvas.width = 512;
    liquidCanvas.height = 512;
    const liquidCtx = liquidCanvas.getContext('2d');

    // Initialize with gray (neutral displacement)
    liquidCtx.fillStyle = 'rgb(128, 128, 128)';
    liquidCtx.fillRect(0, 0, 512, 512);

    // Create texture from canvas using PixiJS Texture
    const liquidTexture = Texture.from(liquidCanvas);
    const liquidSprite = new Sprite(liquidTexture);
    liquidSprite.anchor.set(0.5);

    // Create second displacement filter for liquid effect
    const liquidDisplacementFilter = new DisplacementFilter({
        sprite: liquidSprite,
        scale: 0
    });

    // Apply both filters to the original sprite: parallax + liquid
    originalSprite.filters = [displacementFilter, liquidDisplacementFilter];

    // Add liquid sprite to stage (invisible, just for displacement data)
    liquidSprite.x = app.screen.width / 2;
    liquidSprite.y = app.screen.height / 2;
    liquidSprite.scale.set(Math.max(app.screen.width, app.screen.height) / 512);
    app.stage.addChild(liquidSprite);
    liquidSprite.renderable = false;

    // Animation variables
    let time = 0;
    const ripples = [];

    // Create ripple on mouse move
    let lastRippleTime = 0;
    let lastMousePos = { x: mousePosition.x, y: mousePosition.y };

    app.stage.on('mousemove', (event) => {
        const currentTime = Date.now();
        // Create ripples more frequently for smoother effect
        if (currentTime - lastRippleTime > 30) {
            ripples.push({
                x: (event.global.x / app.screen.width) * 512,
                y: (event.global.y / app.screen.height) * 512,
                radius: 0,
                maxRadius: 180,
                strength: 1.5
            });
            lastRippleTime = currentTime;
        }
        lastMousePos.x = event.global.x;
        lastMousePos.y = event.global.y;
    });

    // Animation loop for paint reveal and liquid effect
    app.ticker.add((ticker) => {
        time += ticker.deltaTime * 0.05;

        // Fade out the reveal mask to TRANSPARENT (not black!)
        // We need to scale down the alpha channel to fade to transparent
        const imageData = revealCtx.getImageData(0, 0, revealCanvas.width, revealCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Multiply alpha channel by fadeSpeed to gradually fade to transparent
            data[i + 3] *= fadeSpeed;
        }

        revealCtx.putImageData(imageData, 0, 0);

        // Only paint the brush if mouse is inside the canvas AND actively moving
        if (isMouseInside && isMouseMoving) {
            // Create organic, liquid-like paint brush with animated distortion
            const numPoints = 32; // More points = smoother circle
            const distortionAmount = 15; // How much the brush edge wobbles

            revealCtx.beginPath();
            for (let i = 0; i <= numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;

                // Add animated noise to create organic liquid edge
                const noise1 = Math.sin(angle * 3 + time * 2) * distortionAmount;
                const noise2 = Math.cos(angle * 5 - time * 1.5) * (distortionAmount * 0.5);
                const noise3 = Math.sin(angle * 7 + time * 3) * (distortionAmount * 0.3);

                const radius = brushRadius + noise1 + noise2 + noise3;

                const x = mousePosition.x + Math.cos(angle) * radius;
                const y = mousePosition.y + Math.sin(angle) * radius;

                if (i === 0) {
                    revealCtx.moveTo(x, y);
                } else {
                    revealCtx.lineTo(x, y);
                }
            }
            revealCtx.closePath();

            // Create gradient for soft edges
            const gradient = revealCtx.createRadialGradient(
                mousePosition.x, mousePosition.y, brushRadius * 0.3,
                mousePosition.x, mousePosition.y, brushRadius * 1.2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            revealCtx.fillStyle = gradient;
            revealCtx.fill();
        }

        // Update reveal texture
        revealTexture.source.update();

        // Clear canvas
        liquidCtx.fillStyle = 'rgb(128, 128, 128)';
        liquidCtx.fillRect(0, 0, 512, 512);

        // Update and draw ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
            const ripple = ripples[i];
            ripple.radius += 4;
            ripple.strength *= 0.96;

            if (ripple.radius > ripple.maxRadius || ripple.strength < 0.01) {
                ripples.splice(i, 1);
                continue;
            }

            // Draw ripple with more dramatic distortion
            const gradient = liquidCtx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius
            );

            const intensity = ripple.strength * 80; // Increased from 50
            gradient.addColorStop(0, `rgb(${128 + intensity}, ${128}, ${128 - intensity})`);
            gradient.addColorStop(0.3, `rgb(${128 - intensity}, ${128 + intensity * 0.5}, ${128 + intensity})`);
            gradient.addColorStop(0.6, `rgb(${128 + intensity * 0.5}, ${128 - intensity}, ${128})`);
            gradient.addColorStop(1, 'rgb(128, 128, 128)');

            liquidCtx.fillStyle = gradient;
            liquidCtx.fillRect(0, 0, 512, 512);
        }

        // Add more pronounced ambient waves
        for (let y = 0; y < 512; y += 6) {
            for (let x = 0; x < 512; x += 6) {
                const wave = Math.sin(x * 0.03 + time * 2) * Math.cos(y * 0.03 + time * 2) * 15;
                const wave2 = Math.sin(x * 0.05 - time) * Math.cos(y * 0.05 + time) * 8;
                liquidCtx.fillStyle = `rgb(${128 + wave + wave2}, 128, ${128 - wave - wave2})`;
                liquidCtx.fillRect(x, y, 6, 6);
            }
        }

        // Update texture
        liquidTexture.source.update();

        // Animate displacement strength with more dramatic effect
        const targetScale = ripples.length > 0 ? 50 : 20;
        const currentScale = liquidDisplacementFilter.scale.x;
        const newScale = currentScale * 0.9 + targetScale * 0.1;
        liquidDisplacementFilter.scale.x = newScale;
        liquidDisplacementFilter.scale.y = newScale;
    });

})(); // End of the async IIFE