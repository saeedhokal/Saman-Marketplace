---
name: Nighttime visual fidelity
description: Visual requirements and image-generation constraints for matching the nighttime reference.
---
Nighttime reference fidelity depends on real manufacturer marks, localized variable-brightness amber edges, dimensional charcoal surfaces, and a skyline/car composition, not just dark theme tokens.

**Why:** The initial flat dark treatment was explicitly rejected as insufficiently close to the reference.

**How to apply:** Compare actual rendered panels and imagery against the reference; preserve asymmetry in highlights rather than outlining every edge uniformly.

Generated image dimensions must be inspected before choosing hero sizing; asking for a panoramic image can still produce a square file.

**Why:** Repeated generations returned square canvases, and forcing them into shallow banners distorted cars or cropped away the skyline.

**How to apply:** Verify aspect ratio and focal composition; crop without distortion rather than stretching an image to fit.