# Qozmo light-theme identity

The site now uses the user-supplied right-facing stag emblem across the shared brand component. The black background was removed and the white silhouette adapted to charcoal, with a muted mauve–rose ribbon for legibility on light surfaces. The generated PNG retains transparency. Wordmarks remain live text.

The built-in image generation tool produced the edit. The web assets and favicon sizes are derived from that result; no new logo geometry was drawn in code.

## Image edit prompt

```text
Use case: precise-object-edit / background-extraction.
Asset type: Qozmo wallet website logo, light-theme edition.
Input image: the provided stag emblem PNG is the exact edit target, not merely inspiration.
Primary request: convert this same logo into a clean light-theme version with a genuinely transparent background. Remove the black background completely. Change the white stag head, neck and antlers to deep charcoal with a subtle warm mauve cast so the complete silhouette is strongly legible on a white or ivory website. Retain the lower flowing crescent ribbon in refined muted mauve-to-dusty-rose gradient, slightly deeper than the pale original for contrast on white.
Invariants: preserve the exact right-facing stag silhouette, curved pointed antlers, eye, ear, nose, elegant S-shaped neck, crescent ribbon shape, proportions and negative-space cuts. Do not redesign the animal or add elements. The eye and dividing cutouts should be true transparent negative space.
Composition: one emblem only, centered, upright, generously large within a tightly bounded square with about 8% clear padding. Crisp smooth vector-like edges and restrained gradients, suitable for a small navbar mark.
No text, no wordmark, no border, no badge, no shadow, no glow, no white or black rectangular canvas. Output real alpha transparency.
```

## Assets

- `public/brand/qozmo-stag-light.png`: transparent website emblem.
- `public/brand/qozmo-icon-32.png` and `qozmo-icon-192.png`: browser icons with a light background.
- `public/brand/apple-touch-icon.png`: touch icon.
- `public/icon.svg`: compatible SVG favicon containing the same emblem.
- `public/og-image.png`: social preview using the updated emblem.

The component is shared by the landing navigation and footer, phone interface, feature illustration, dashboard sidebar, DeFi illustration, and legacy wallet preview.
