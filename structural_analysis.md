# Project Structural Analysis: DIGIPHY

## Overview
This project is a high-end 3D web experience built with **React**, **Vite**, **GSAP**, and **React Three Fiber (R3F)**. It features a sophisticated interplay between a persistent 3D background scene (`CarScene`) and a foreground scroll-based narrative (`App.jsx` layout).

## Architecture & Layout

### Entry Point & Core Layout
-   **`src/main.jsx`**: Standard React entry point, mounts `App`.
-   **`src/App.jsx`**: The central orchestrator. It manages:
    -   **Global State**: `activeModelIndex`, `transitionOpacity`, `uiVisible`, `cameraProgress`.
    -   **Scroll Logic**: Uses `Lenis` for smooth scrolling and `GSAP ScrollTrigger` to drive animations based on scroll position.
    -   **Component Layout**:
        1.  **Fixed Background**: Wraps `CarScene` in a fixed container. This scene stays persistent throughout the experience.
        2.  **Scroll Container**: A Z-indexed overlay containing semantic sections:
            -   `#car-selection`: Transparent section allowing interaction with the `CarScene` UI.
            -   `HorizontalScrollScene`: A distinct 3D visual section.
            -   `#car-usecases`: Triggers camera animations in the background scene.
            -   `TechFeatures` & `Contact`: Standard content sections.

## Component Hierarchy & Interconnections

### 1. CarScene (The "Soul" of the App)
Located in `src/scenes/CarScene/`, this is the primary 3D environment.

-   **`index.jsx`**: Sets up the R3F `Canvas`, handles model preloading, and renders the `Experience` and `CarSceneOverlay`.
-   **`Experience.jsx`**: The inner 3D world.
    -   **Inputs**: Receives `activeModelPath`, `transitionOpacity`, and `cameraProgress` from `App.jsx`.
    -   **Composition**:
        -   `CameraRig`: Controls camera movement/animation.
        -   `Environment`: HDRI lighting.
        -   `StudioScene`: Baked static environment.
        -   `CarModel`: The dynamic car meshes (BMW, Audi, Ford) with wireframe/opacity logic.
        -   `SeatingBuck`: Interior detail model.
        -   `PostProcessing`: `EffectComposer` stack (Bloom, Vignette, LUT).
-   **`config.js`**: Centralized configuration for physics, camera paths (Bezier curves), transition timings, and visual effects (Bloom/LUT settings).

### 2. HorizontalScrollScene
Located in `src/scenes/HorizontalScrollScene/`, this appears to be a separate "chapter" in the experience.

-   **`index.jsx`**: Has its own isolated `Canvas`.
    -   **Structure**: Uses a sticky container (`horizontal_scroll--sticky`) to keep the 3D canvas pinned while the user scrolls through the 400vh container.
    -   **Content**: Renders `AutoAlignmentScene` and potentially other sub-scenes.

### 3. State Flow & Synchronization
1.  **Scroll Driver**: User scrolls -> `Lenis` updates -> `GSAP ScrollTrigger` fires.
2.  **App State Update**: `App.jsx` updates `cameraProgress` or `uiVisible`.
3.  **Visual Update**:
    -   `CarScene` receives new props.
    -   `Experience.jsx` passes `cameraProgress` to `CameraRig` to scrub along the defined path (`USECASE_CAMERA_CONFIG`).
    -   `uiVisible` toggles the HTML overlay.

## Key Dependencies
-   **R3F / Drei**: Core 3D rendering and helpers.
-   **GSAP**: Complex animation sequencing and scroll-driven interactions.
-   **Lenis**: Smooth scroll behavior (critical for the feel of the app).
-   **Zustand/Context**: (Not explicitly seen in top-level, but likely used within complex sub-components or effectively replaced by `App.jsx` prop drilling for this scale).

## File Map
```
src/
├── App.jsx                  # Main Layout & Scroll Orchestrator
├── scenes/
│   ├── CarScene/           # Primary Persistent 3D World
│   │   ├── index.jsx       # Canvas Setup
│   │   ├── Experience.jsx  # 3D Scene Composition
│   │   ├── config.js       # Camera Paths, Physics, Visual Settings
│   │   └── ...             # Sub-components (CarModel, etc.)
│   ├── HorizontalScrollScene/
│   │   ├── index.jsx       # Secondary 3D Section
│   │   └── ...
│   └── ...                 # Other content sections
```
