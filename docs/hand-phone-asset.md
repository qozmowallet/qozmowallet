# Qozmo hand-held phone hero asset

- File: `public/images/hand-phone.png`
- Method: built-in ImageGen, transparent-background generation followed by one targeted anatomy correction.
- Purpose: original photographic cutout for the landing-page hero. Live HTML is layered over the screen; the image contains no rendered wallet values, logos, or interface text.
- Canvas: 1086 × 1448 pixels, RGBA PNG. Transparency is present and preserved; the source was copied byte-for-byte into the project.
- Approximate screen inner rectangle: left 171px, top 120px, width 504px, height 1040px; approximately 55px corner radius. The device is upright and front-facing, with negligible rotation/skew. Calibrate the HTML overlay visually in the browser.
- Approximate normalized screen rectangle: left 15.75%, top 8.29%, width 46.41%, height 71.82%.
- Display interior: generated display includes a transparent/softly translucent central region; the HTML screen layer should supply an opaque background across the full rounded screen rectangle. This has no effect on the hand or bezel.
- Do not separately transform the hand image and screen overlay. Apply the hero tilt/parallax to their shared wrapper so they stay aligned.

## Generation prompt

Use case: product-mockup.
Asset type: a transparent photographic cutout to be used as the right-hand hero artwork of a premium digital-wallet website. Only the physical hand and phone are required; live HTML UI will be composited on the screen later.

Primary request: create one realistic warm medium-brown adult RIGHT HAND naturally holding a premium modern graphite-black smartphone from its right side and back. The wrist enters from the bottom-right. The fingers wrap naturally around the back and left edge, with the little finger supporting the bottom. The thumb rests along the OUTSIDE right bezel, leaving the entire display unobstructed. Authentic anatomy, realistic joints and nails, natural skin texture. No sleeve, no jewelry.

Composition: portrait canvas with approximately 3:4 aspect ratio. The smartphone is STRICTLY UPRIGHT, straight vertical and perfectly front-facing with parallel vertical edges and parallel horizontal edges. ZERO roll, ZERO perspective skew, ZERO foreshortening. The whole phone and all fingertips remain within the image. The phone occupies about 48% of the canvas width and 78% of its height, with its center at 40% of the canvas width, its top at 6% of the canvas height and its bottom at 84%. The hand and wrist continue toward the bottom-right corner; only the wrist may exit the canvas edge. Keep clear transparent space around the top and left of the object. This is a clean frontend-compositing mockup, so the display must be a straight-on rectangle.

Device: subtle dark graphite metal sides, thin black bezels, smooth rounded corners. The display is COMPLETELY BLANK, flat opaque white, extending almost to the bezel. NO notch, NO camera hole, NO status bar, NO symbols, NO text, NO interface, NO branding and NO watermark anywhere. The display is a clean uninterrupted tall rounded rectangle, fully visible and unobstructed by fingers. Avoid strong screen reflections or glare.

Style: high-end photorealistic studio product photography, sharp natural skin microtexture and subtle glass/metal reflections, soft diffused key light from upper left, gentle neutral shadows on the hand and device. Warm natural skin, neutral graphite phone, white blank screen. Genuine transparent alpha background, not white or checkerboard painted into the image. No floor, no backdrop, no additional objects.

## Targeted refinement prompt

Use case: precise-object-edit.
Edit target: the attached transparent hand-and-phone cutout. Keep the 1086×1448 canvas, device geometry, device position, hand pose, graphite materials, lighting, and transparent background exactly unchanged.

Correct the hand anatomy ONLY: the current hand has an EXTRA rounded fingertip with a nail directly underneath the phone near x310,y1220. REMOVE that single extra fingertip entirely and replace that small region with the natural continuous base of the palm, with the outside silhouette smoothly connecting into the existing wrist. Retain the four curled fingers along the left edge and the thumb along the right edge, for exactly five digits in total. Do not add a finger underneath the phone. Do not move or alter the phone or its straight-on blank screen. Keep every other pixel and all existing blank-screen geometry as close as possible to the input. Maintain a genuine transparent alpha background; no solid backdrop, no checkerboard, no text, no UI, no logos.

