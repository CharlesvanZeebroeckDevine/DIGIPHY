# Coding Exploration

## Week 1

During week 1, I (Wander) tried to see if a fake 3D parallax panning effect was possible to do for a hero image. I investigated PixiJS, a 2D WebGL renderer that works great to do the thing we might want to do with the hero section. 

I also tried to add some logic and made folders for different tests, so we can document everything smoothly. For our pitch we wanted to show a little demo of what I made for the hero section, so we deployed this folder to Vercel (https://digiphy-zeta.vercel.app/). This way we can easily show what we have done to the client, so they are already able to interact with it.

Next on the list is investigating React Three Fiber, Next.js, Lenis for scroll animations and Babylon.js to see what our possibilities are. 

Resources: 
- PixiJS docs: https://pixijs.com/8.x/guides/getting-started/intro
- Depth map exploration: https://www.youtube.com/watch?v=1JrDPvg6gOM&t=453s 
- Creating layers for a multi-layer parallax effect (https://www.youtube.com/watch?v=1CzSShJdGhg&t=1s)

## Week 2

We're starting the dev research by trying to make a Next.js project with React Three Fiber on top. 

## Week 3

I (Charles), implemented the 2D webgl effect that Wander created during week 1 in a 3D react-three-fiber and drei environment. I started by creating this effect in a basic Three.js environment and then ported it to react-three-fiber and drei for better post processing to apply later. 

## Week 4

### Sidescroll 

I (Wander) am trying to implement the abstract sidescroll section. I started by creating a basic scroll section with images. The plan is to implement the 3D models later.

video src="./assets-process/sidescroll/sidescroll-1.mp4"

With the first approach I had some troubles making the horizontal scroll section smooth. So I decided to use gsap scrolltriggers combined with Lenis to make a smooth feeling when scrolling the website. 

video src="./assets-process/sidescroll/sidescroll-2.mp4" 

I (Charles) am trying to enhance the hero interaction by adding post proecessing treatments to the hero section. I added bloom, vignette, and tone mapping. I also tried to add SSAO and depth of field, but I couldn't get it to work. I think depth of field can be a good idea to make the hero section more visually interesting. 

We transformed unoptimized R3F scene into a high-performance product showcase.

Refined the GPU fluid simulation to reveal a solid car model over a wireframe base.

Implemented a "Stage Reset" transition (Fade Out -> 3s Wait -> Fade In).
Added post-processing, soft shadows.
Achieved 60FPS on high-DPI devices through optimization.

Replaced raycasting against 300k+ vertex car models with a simple 12-triangle invisible box.

Kept all car models visible={true} but transparent (uOpacity: 0) and disabled their shadows when inactive.

Adaptive Rendering:
Technique: Used drei's <AdaptiveDpr /> to lower resolution during movement and <AdaptiveEvents /> to throttle interactions.

Replaced expensive dynamic shadows with static <ContactShadows /> and <BakeShadows />.

Documentation & References
R3F / Drei: https://docs.pmnd.rs/

Standard Three.js shader chunks (<color_fragment>) for safe injection of custom shader code. https://threejs.org/docs/?q=Fragme#ShaderMaterial

## Week 5 

### Realistic Reflective Floor
Component: @react-three/drei's MeshReflectorMaterial.
Visual Tuning:
Frosted Look: Achieved by setting roughness: 1.0 and mixBlur: 1.0. This was a critical fix to ensure the blur was visible.
Car Reflections: Removed the ignore={carsGroup} prop to ensure cars are reflected in the floor, adding to the "grounded" feel.
Optimization: Lowered resolution to 512 to balance the cost of reflecting the complex car models.

### Light and realism
HDRI Integration: Implemented Environment with a custom 
.hdr
 map (brown_photostudio_02_1k) for realistic reflections and ambient light.
Window Glow Effect:
Initial approach: RectAreaLight (expensive, hard to position).
Final solution: 
WindowGlowModel
 component. Loads Window.glb directly and applies a high-intensity MeshBasicMaterial (intensity: 34).

Removed expensive dynamic cast shadows.
Implemented ContactShadows (frames={1}) for highly optimized, soft grounding shadows.

### Post-Processing Pipeline
Stack: @react-three/postprocessing.

- Bloom: Creates the glow around the window and highlights.
- ToneMapping: Used Reinhard mode for cinematic color handling.
- SSAO (Screen Space Ambient Occlusion): Added N8AO for depth, but disabled forperformance needs.
- Optimization: Disabled multisampling (multisampling={0}) on the EffectComposer to prevent massive FPS drops.

### Config.js 
Moved all magic numbers out of components and into a single config.js

### Optimization: 

Instead of simulating real glass physics or volumetric fog, we used Emissive Materials + Bloom.
Instead of raytracing reflections, we used Planar Reflections with low resolution.
Instead of dynamic lights, we used HDRI + ContactShadows.
