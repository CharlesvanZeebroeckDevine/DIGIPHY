import {
  Application,
  Sprite,
  Assets,
  DisplacementFilter,
  Texture,
} from "pixi.js";

const app = new Application();

(async () => {
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    resizeTo: window,
    background: "#000000",
  });

  const heroSection = document.getElementById("hero");
  heroSection.appendChild(app.canvas);

  const loadedAssets = await Assets.load([
    "/my_photo-3.jpg",
    "/my_depth_map-3.jpg",
    "/my_photo-4.png",
    "/my_depth_map-4.png",
  ]);

  const backgroundSprite = new Sprite(loadedAssets["/my_photo-3.jpg"]);
  const backgroundDepthSprite = new Sprite(loadedAssets["/my_depth_map-3.jpg"]);

  const originalSprite = new Sprite(loadedAssets["/my_photo-4.png"]);
  const depthSprite = new Sprite(loadedAssets["/my_depth_map-4.png"]);

  backgroundSprite.anchor.set(0.5);
  backgroundDepthSprite.anchor.set(0.5);

  originalSprite.anchor.set(0.5);
  depthSprite.anchor.set(0.5);

  function resizeSprites() {
    const screenAspect = app.screen.width / app.screen.height;
    const textureAspect =
      originalSprite.texture.width / originalSprite.texture.height;

    let scale = 1;
    if (screenAspect > textureAspect) {
      scale = app.screen.width / originalSprite.texture.width;
    } else {
      scale = app.screen.height / originalSprite.texture.height;
    }

    backgroundSprite.x = app.screen.width / 2;
    backgroundSprite.y = app.screen.height / 2;
    backgroundSprite.scale.set(scale);
    backgroundDepthSprite.x = app.screen.width / 2;
    backgroundDepthSprite.y = app.screen.height / 2;
    backgroundDepthSprite.scale.set(scale);

    originalSprite.x = app.screen.width / 2;
    originalSprite.y = app.screen.height / 2;
    originalSprite.scale.set(scale);
    depthSprite.x = app.screen.width / 2;
    depthSprite.y = app.screen.height / 2;
    depthSprite.scale.set(scale);
  }

  resizeSprites();
  window.addEventListener("resize", resizeSprites);

  const backgroundDisplacementFilter = new DisplacementFilter(
    backgroundDepthSprite,
  );
  backgroundSprite.filters = [backgroundDisplacementFilter];
  backgroundDisplacementFilter.scale.x = 40;
  backgroundDisplacementFilter.scale.y = 40;

  const displacementFilter = new DisplacementFilter(depthSprite);
  originalSprite.filters = [displacementFilter];
  displacementFilter.scale.x = 40;
  displacementFilter.scale.y = 40;

  app.stage.addChild(backgroundDepthSprite);
  app.stage.addChild(backgroundSprite);

  app.stage.addChild(depthSprite);
  app.stage.addChild(originalSprite);

  app.stage.interactive = true;

  let mousePosition = { x: app.screen.width / 2, y: app.screen.height / 2 };
  let isMouseInside = false;
  let isMouseMoving = false;
  let mouseMovementTimeout = null;

  app.stage.on("mousemove", (event) => {
    mousePosition.x = event.global.x;
    mousePosition.y = event.global.y;
    isMouseInside = true;
    isMouseMoving = true;

    if (mouseMovementTimeout) {
      clearTimeout(mouseMovementTimeout);
    }

    mouseMovementTimeout = setTimeout(() => {
      isMouseMoving = false;
    }, 200);

    const mouseX = event.global.x / app.screen.width - 0.5;
    const mouseY = event.global.y / app.screen.height - 0.5;

    backgroundDisplacementFilter.scale.x = -mouseX * 40;
    backgroundDisplacementFilter.scale.y = -mouseY * 40;

    displacementFilter.scale.x = -mouseX * 40;
    displacementFilter.scale.y = -mouseY * 40;
  });

  app.stage.on("mouseout", () => {
    isMouseInside = false;
    isMouseMoving = false;
    if (mouseMovementTimeout) {
      clearTimeout(mouseMovementTimeout);
    }
  });

  app.stage.on("mouseover", () => {
    isMouseInside = true;
  });

  const revealCanvas = document.createElement("canvas");
  revealCanvas.width = app.screen.width;
  revealCanvas.height = app.screen.height;
  const revealCtx = revealCanvas.getContext("2d", { willReadFrequently: true });

  revealCtx.clearRect(0, 0, revealCanvas.width, revealCanvas.height);

  const revealTexture = Texture.from(revealCanvas);
  const revealMaskSprite = new Sprite(revealTexture);

  revealMaskSprite.x = 0;
  revealMaskSprite.y = 0;
  revealMaskSprite.width = app.screen.width;
  revealMaskSprite.height = app.screen.height;

  app.stage.addChild(revealMaskSprite);
  originalSprite.mask = revealMaskSprite;

  const brushRadius = 150;
  const fadeSpeed = 0.98;

  const liquidCanvas = document.createElement("canvas");
  liquidCanvas.width = 512;
  liquidCanvas.height = 512;
  const liquidCtx = liquidCanvas.getContext("2d");

  liquidCtx.fillStyle = "rgb(128, 128, 128)";
  liquidCtx.fillRect(0, 0, 512, 512);

  const liquidTexture = Texture.from(liquidCanvas);
  const liquidSprite = new Sprite(liquidTexture);
  liquidSprite.anchor.set(0.5);

  const liquidDisplacementFilter = new DisplacementFilter({
    sprite: liquidSprite,
    scale: 0,
  });

  originalSprite.filters = [displacementFilter, liquidDisplacementFilter];

  liquidSprite.x = app.screen.width / 2;
  liquidSprite.y = app.screen.height / 2;
  liquidSprite.scale.set(Math.max(app.screen.width, app.screen.height) / 512);
  app.stage.addChild(liquidSprite);
  liquidSprite.renderable = false;

  let time = 0;
  const ripples = [];

  let lastRippleTime = 0;
  let lastMousePos = { x: mousePosition.x, y: mousePosition.y };

  app.stage.on("mousemove", (event) => {
    const currentTime = Date.now();
    if (currentTime - lastRippleTime > 30) {
      ripples.push({
        x: (event.global.x / app.screen.width) * 512,
        y: (event.global.y / app.screen.height) * 512,
        radius: 0,
        maxRadius: 180,
        strength: 1.5,
      });
      lastRippleTime = currentTime;
    }
    lastMousePos.x = event.global.x;
    lastMousePos.y = event.global.y;
  });

  app.ticker.add((ticker) => {
    time += ticker.deltaTime * 0.05;

    const imageData = revealCtx.getImageData(
      0,
      0,
      revealCanvas.width,
      revealCanvas.height,
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] *= fadeSpeed;
    }

    revealCtx.putImageData(imageData, 0, 0);

    if (isMouseInside && isMouseMoving) {
      const numPoints = 32;
      const distortionAmount = 15;

      revealCtx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;

        const noise1 = Math.sin(angle * 3 + time * 2) * distortionAmount;
        const noise2 =
          Math.cos(angle * 5 - time * 1.5) * (distortionAmount * 0.5);
        const noise3 =
          Math.sin(angle * 7 + time * 3) * (distortionAmount * 0.3);

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

      const gradient = revealCtx.createRadialGradient(
        mousePosition.x,
        mousePosition.y,
        brushRadius * 0.3,
        mousePosition.x,
        mousePosition.y,
        brushRadius * 1.2,
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      revealCtx.fillStyle = gradient;
      revealCtx.fill();
    }

    revealTexture.source.update();

    liquidCtx.fillStyle = "rgb(128, 128, 128)";
    liquidCtx.fillRect(0, 0, 512, 512);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      ripple.radius += 4;
      ripple.strength *= 0.96;

      if (ripple.radius > ripple.maxRadius || ripple.strength < 0.01) {
        ripples.splice(i, 1);
        continue;
      }

      const gradient = liquidCtx.createRadialGradient(
        ripple.x,
        ripple.y,
        0,
        ripple.x,
        ripple.y,
        ripple.radius,
      );

      const intensity = ripple.strength * 80;
      gradient.addColorStop(
        0,
        `rgb(${128 + intensity}, ${128}, ${128 - intensity})`,
      );
      gradient.addColorStop(
        0.3,
        `rgb(${128 - intensity}, ${128 + intensity * 0.5}, ${128 + intensity})`,
      );
      gradient.addColorStop(
        0.6,
        `rgb(${128 + intensity * 0.5}, ${128 - intensity}, ${128})`,
      );
      gradient.addColorStop(1, "rgb(128, 128, 128)");

      liquidCtx.fillStyle = gradient;
      liquidCtx.fillRect(0, 0, 512, 512);
    }

    for (let y = 0; y < 512; y += 6) {
      for (let x = 0; x < 512; x += 6) {
        const wave =
          Math.sin(x * 0.03 + time * 2) * Math.cos(y * 0.03 + time * 2) * 15;
        const wave2 = Math.sin(x * 0.05 - time) * Math.cos(y * 0.05 + time) * 8;
        liquidCtx.fillStyle = `rgb(${128 + wave + wave2}, 128, ${128 - wave - wave2})`;
        liquidCtx.fillRect(x, y, 6, 6);
      }
    }

    liquidTexture.source.update();

    const targetScale = ripples.length > 0 ? 50 : 20;
    const currentScale = liquidDisplacementFilter.scale.x;
    const newScale = currentScale * 0.9 + targetScale * 0.1;
    liquidDisplacementFilter.scale.x = newScale;
    liquidDisplacementFilter.scale.y = newScale;
  });
})();
