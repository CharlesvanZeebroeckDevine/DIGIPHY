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

### Week 6

I (Wander) implemented Montserrat as the primary typeface and created a DefaultStyles.css to centralize our design tokens (spacing, font sizes, and color variables). This was a crucial step to ensure that as the project scaled, the UI remained cohesive. I also began populating the horizontal scroll sections with actual scenes, moving away from the placeholder test environment.

I (Charles) focused on the Camera Transition System and the Loader. We needed a way to guide the user's eye between different 3D scenes seamlessly. I also began the first styling pass for the contact section and integrated the initial JSON structures to handle project data dynamically.

UI Components & Navigation

We implemented a secondary button component that utilizes the same "liquid reveal" hover effect as our primary button but optimized for the darker CarScene background. I (Charles) also built out the Navigation system and the Footer structure, adding a hover transition to the footer title for a more premium feel.

On the development side, we resolved several merge conflicts between the contactDev and dev branches to ensure the new contact form styling didn't break the main scroll logic. We also addressed a "smooth scroll" bug with Lenis where auto-alignment and gradient transitions were occasionally stuttering.

3D Asset Integration & TechFeatures
I (Wander) integrated several 3D models, including a VR headset and a button for the CE certification model. I adjusted the TechFeatures layout to allow these 3D assets to be manipulated and viewed within their specific UI context. This required a mix of CSS styling and R3F positioning to make sure the text and models didn't overlap on smaller screens.


### Week 7
In the final week, we focused on the "wow" factor—animations and sound.

We also refined the Loading Screen. Instead of a simple fade, we changed the animation to be more engaging and added logic to prevent user scrolling while the loading screen is visible, ensuring the initial camera transition isn't interrupted.

Camera transitions implemented for the UseCases section.

UX Polish & Sound Preparation
With the majority of features in place, we moved into a "quality of life" phase, focusing on the small details that make a web experience feel professional.

I (Wander) worked on the scroll logic robustness. I added a fix to reset the scroll position on page refresh, preventing the browser from "remembering" a middle-of-the-page position which would break our GSAP timelines. We also fixed a case-sensitivity mismatch in our file imports that was causing deployment issues on Vercel. 
I also added a Shader Reveal Transition to the TechFeatures section, creating a more organic way to introduce hardware details. I also integrated GSAP animations to the tech features UI to make the data entry points feel more dynamic.
I also implemented a Mute Button that remains visible throughout the experience (except in the footer). I added logic so the button's color dynamically changes based on the background brightness to ensure accessibility. This was a prerequisite for adding sound, as we needed a way for users to opt-out.


The final major addition was Audio. I (Charles) integrated the sound system, ensuring that the mute button correctly toggles the spatial audio and background tracks. We spent the final few days on "Final Fixes"—polishing the end sections of the horizontal scroll, fixing radio button labels in the contact form, and ensuring all animations across the site were timed perfectly.

GSAP ScrollTrigger Documentation: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
Web Audio Api : https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
R3F : https://r3f.docs.pmnd.rs/getting-started/introduction
ThreeJS: https://threejs.org/manual/
WEBGL : https://registry.khronos.org/webgl/specs/latest/2.0/
GSAP : https://gsap.com/docs/v3/
Lenis : https://github.com/darkroomengineering/lenis
PostProcessing in R3F : https://react-postprocessing.docs.pmnd.rs/introduction
Fragment shaders : https://thebookofshaders.com/