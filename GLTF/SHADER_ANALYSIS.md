# Shader Masking & Bounding Box Analysis

## Overview
The liquid hover reveal effect uses a **screen-space reveal mask** system. There is no traditional bounding box - instead, the system uses a 2D canvas texture that matches the screen resolution, which acts as a "mask" to reveal the car material.

---

## 1. Reveal Mask Canvas System

### Canvas Creation (Lines 516-529)
```javascript
const revealCanvas = document.createElement('canvas');
revealCanvas.width = window.innerWidth;
revealCanvas.height = window.innerHeight;
const revealCtx = revealCanvas.getContext('2d', { willReadFrequently: true });
```

**Key Points:**
- Canvas size matches **screen resolution** (not world space)
- Canvas acts as a **2D texture** that's sampled in the shader
- Each pixel in the canvas represents a screen pixel
- Alpha channel stores the "reveal amount" (0 = wireframe, 1 = revealed material)

### Canvas Updates (Lines 694-748)
The canvas is updated every frame in the animation loop:
1. **Fade existing mask**: All pixels fade by multiplying alpha by 0.98
2. **Draw new reveal circles**: When hovering, draws liquid-distorted circles at mouse position

---

## 2. Coordinate System Transformations

### A. World Space → Screen Space (JavaScript, Line 708)
```javascript
const screenPos = mouseWorldPosition.clone().project(camera);
const screenX = (screenPos.x * 0.5 + 0.5) * revealCanvas.width;
const screenY = (screenPos.y * -0.5 + 0.5) * revealCanvas.height;
```

**Transformation Steps:**
1. `mouseWorldPosition.project(camera)` - Projects 3D world point to **NDC (Normalized Device Coordinates)**
   - Result: `x, y, z` in range `[-1, 1]` (z is depth)
2. Convert NDC to canvas pixel coordinates:
   - `x`: `(screenPos.x * 0.5 + 0.5) * width` → Maps `[-1, 1]` to `[0, width]`
   - `y`: `(screenPos.y * -0.5 + 0.5) * height` → Maps `[-1, 1]` to `[0, height]` (flipped)

**Why flip Y?** Canvas coordinates have origin at top-left, while NDC has origin at bottom-left.

### B. Screen Space → UV Coordinates (Shader, Lines 353-356)
```glsl
vec3 screenPos = vScreenPosition.xyz / vScreenPosition.w;  // Perspective divide
vec2 screenUV = (screenPos.xy * 0.5 + 0.5);                  // NDC to [0,1]
screenUV.y = 1.0 - screenUV.y;                                // Flip Y
```

**Transformation Steps:**
1. `vScreenPosition` comes from vertex shader (clip space)
2. **Perspective divide**: `xyz / w` converts clip space to NDC `[-1, 1]`
3. **NDC to UV**: `(xy * 0.5 + 0.5)` maps `[-1, 1]` to `[0, 1]`
4. **Flip Y**: Canvas has top-left origin, shader expects bottom-left

### C. Vertex Shader Screen Position (Lines 295-297)
```glsl
vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
vec4 screenPos = projectionMatrix * mvPosition;
vScreenPosition = screenPos;
```

**Pipeline:**
- Model space → View space → Clip space → (perspective divide in fragment) → NDC → UV

---

## 3. Mask Drawing System

### Liquid-Distorted Circle (Lines 712-744)
When hovering over the car:
```javascript
const brushRadius = 150;  // Pixels
const numPoints = 32;
const distortionAmount = 15;
```

**Process:**
1. Creates a circle with **32 points** around the mouse position
2. Each point is **distorted** using sine/cosine waves:
   - `noise1 = sin(angle * 3 + time * 2) * 15`
   - `noise2 = cos(angle * 5 - time * 1.5) * 7.5`
   - `noise3 = sin(angle * 7 + time * 3) * 4.5`
3. Creates a **radial gradient**:
   - Center: `rgba(255, 255, 255, 1)` (fully revealed)
   - Edge: `rgba(255, 255, 255, 0)` (not revealed)
   - Gradient extends from `0.3 * radius` to `1.2 * radius`

**Result:** A pulsing, liquid-like reveal circle that follows the mouse.

---

## 4. Shader Mask Sampling (Fragment Shader, Lines 358-360)

```glsl
vec4 revealMask = texture2D(uRevealMask, screenUV);
float reveal = revealMask.a * uHoverIntensity;
```

**How it works:**
- Samples the reveal mask texture at the **current fragment's screen position**
- Uses the **alpha channel** as the reveal amount
- Multiplies by `uHoverIntensity` (0-1) for smooth fade in/out
- `reveal = 0` → Shows wireframe
- `reveal = 1` → Shows full material with reflections

---

## 5. Bounding Box Analysis

### ⚠️ **There is NO explicit bounding box for the mask!**

**Current Behavior:**
- The mask canvas covers the **entire screen** (`window.innerWidth × window.innerHeight`)
- Circles are drawn anywhere on the canvas based on mouse position
- The shader samples the mask at **every fragment's screen position**

**Implications:**
1. ✅ **Works correctly** - Each pixel on screen can be revealed independently
2. ⚠️ **No spatial bounds** - Circles can be drawn off-screen (though they won't be visible)
3. ⚠️ **Performance** - Mask is full-screen, but canvas operations are relatively cheap

### Potential Issues:

#### Issue 1: Off-Screen Drawing
If `mouseWorldPosition` projects outside `[-1, 1]` NDC range, circles are drawn off-canvas:
```javascript
// screenX could be negative or > width
// screenY could be negative or > height
```
**Current fix:** None - circles just don't appear (which is fine)

#### Issue 2: Canvas Resize
When window resizes (Lines 639-651):
- Canvas is resized to new dimensions
- Canvas is cleared (filled with transparent black)
- **Problem:** Existing reveal circles are lost immediately
- **Solution:** Canvas is cleared, which is intentional for a clean reset

#### Issue 3: Coordinate Mismatch
If camera moves/rotates, the same world position projects to different screen positions:
- ✅ **Handled correctly** - `mouseWorldPosition.project(camera)` recalculates every frame
- The mask drawing uses the **current** camera projection

---

## 6. Material Blending (Fragment Shader, Lines 506-510)

```glsl
// Blend between wireframe and original (with reflections) based on reveal
finalColor = mix(wireframeColor, finalColor, reveal);

// Final opacity: wireframe when not revealed, original when revealed
float finalOpacity = mix(wireframeAlpha, 1.0, reveal);
```

**Blending Logic:**
- `reveal = 0`: Shows wireframe (white, low opacity)
- `reveal = 1`: Shows full material with reflections
- `0 < reveal < 1`: Smooth interpolation between states

---

## 7. Performance Considerations

### Canvas Operations (Every Frame):
1. **Get image data**: `getImageData(0, 0, width, height)` - **Expensive** (full-screen read)
2. **Fade pixels**: Loop through all pixels, multiply alpha by 0.98
3. **Put image data**: `putImageData(imageData, 0, 0)` - **Expensive** (full-screen write)
4. **Draw circle**: Canvas 2D drawing - **Cheap** (only when hovering)

### Optimization Opportunities:
1. **Use smaller canvas** - If reveal effect only needs to cover car, use smaller texture
2. **Dirty rectangle tracking** - Only update regions that changed
3. **WebGL-based mask** - Use render-to-texture instead of canvas 2D
4. **Reduce fade operations** - Only fade pixels that have alpha > 0

---

## 8. Summary

### What Works Well:
✅ Screen-space masking allows per-pixel reveal control  
✅ Coordinate transformations are correct (world → screen → UV)  
✅ Liquid distortion creates nice visual effect  
✅ Smooth fade-out prevents harsh transitions  

### Implemented Improvements:
✅ **Expanded trigger area** - Brush is drawn when within 150px of car (not just on direct hit)
   - Raycasts to ground plane to track cursor position
   - Checks 8 points around cursor at brush radius
   - Brush center stays on cursor, triggering when it would touch the car

✅ **Fixed raycast validation bug** - Prevents brush from appearing at origin (0,0,0)
   - Now properly checks if `intersectPlane()` returns a valid result
   - Sets `isHoveringLamborghini = false` when raycast fails
   - Fixes issue where brush appeared at car center when cursor was far away

✅ **Fixed reveal fade behavior** - Existing circles now fade smoothly over time
   - Removed `uHoverIntensity` multiplication from shader
   - Reveal amount now based purely on mask alpha channel
   - Mask fades naturally at 0.98 per frame (2% fade per frame)
   - No instant disappearance when cursor leaves car

✅ **Fixed mask alignment/offset** - Camera matrices now updated before projection
   - Added `camera.updateMatrixWorld()` and `camera.updateProjectionMatrix()` before mask drawing
   - Ensures camera transforms are fully updated when projecting 3D to screen coordinates
   - Prevents offset caused by using stale camera matrices
   - Aligns canvas drawing with shader rendering

✅ **Fixed brush radius inconsistency** - Made brush size consistent across all systems
   - Created `BRUSH_RADIUS` constant (75px) used in both hover detection and drawing
   - Created `BRUSH_CHECK_MULTIPLIER` constant (1.5x) for expanded hit detection
   - Fixed mismatch where detection used 75px but drawing used 150px
   - Ensures brush appearance matches trigger area

### Potential Future Improvements:
1. **Add bounding box** - Only draw circles within car's screen bounds
2. **Optimize canvas operations** - Use dirty rectangles or WebGL render target
3. **Persistent mask** - Don't clear canvas on resize, scale existing content
4. **Multi-touch support** - Allow multiple reveal circles simultaneously

### Key Insight:
The "bounding box" is implicitly the **entire screen**. The mask is a full-screen texture that's sampled per-fragment. There's no explicit spatial bounds checking - the system relies on the fact that off-screen coordinates simply don't affect visible pixels.

