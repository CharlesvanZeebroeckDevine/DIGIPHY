> **Role:** You are an expert Three.js and React Fiber developer.
>
> **Task:** Implement a strict **Three-Phase "Outro Sequence"** triggered after the user finishes the `@HorizontalScrollScene`.
>
> **Context:** Review `@App.jsx`, `@scenes`, and standard CSS files. We are introducing a new narrative section that happens strictly *after* the horizontal scroll section has physically left the user's view.
>
> **Requirements for the "Outro Sequence":**
>
> 1.  **Visual Clean-up (Pre-Trigger):**
>     * **VERY IMPORTANT:** The action to **Hide all UI elements and disable car shaders** must be the earliest trigger, activating as soon as the user begins scrolling *out* of the horizontal section, even if the section is still partially visible.
>
> 2.  **Cinematic Trigger & Pin:**
>     * **Start Constraint:** The camera movement begins **only when the DOM element for the Horizontal Scroll section is 100% outside of the viewport** (scrolled fully out of the top).
>     * **Pinning Constraint:** At this exact trigger point, the main scroll container must be **pinned** (locked in position, potentially for a fixed height, such as `300vh`) to prevent any subsequent content from scrolling into view.
>
> 3.  **Camera Logic:**
>     * Disable standard camera controls (`OrbitControls`).
>     * Interpolate the camera along a **Bezier curve** to the final `TargetPosition`.
>     * **Scroll-Driven:** The user's scroll input within the pinned region drives the camera's progress along the curve (scrolling completely down the pinned region equals 100% curve progress).
>
> 4.  **Final Unlock:**
>     * When the camera animation reaches 100%, the main scroll container must **unpin**, allowing the user to scroll to the next content section.
>
> **CRITICAL ARCHITECTURAL CONSTRAINTS:**
> * **No Regressions:** Do not modify the logic of the initial "Normal 3D Scene" or the "Horizontal Scroll" interaction.
> * **Decoupling:** Use appropriate techniques (e.g., GSAP ScrollTrigger with `pin: true` or custom logic) to **decouple** the camera animation from standard page scrolling during the pinned phase.
>
> **User Flow Recap:**
> 1.  Normal 3D Scene.
> 2.  Horizontal Scroll.
> 3.  User scrolls down  **UI/Cars already hidden**
> 4.  Horizontal section is gone **Page Pins / Camera Movement Starts** (Scroll drives Bezier).
> 5.  Camera Movement Ends **Page Unpins** (User scrolls to next section).

---


This detailed prompt is now highly specific and should give the AI the exact instructions needed to implement the complex timing and pinning logic correctly.