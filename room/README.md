# Jason Miller’s interactive portfolio

This is the source of the live site at https://www.jasonpaulmiller.com/.
The older React application at the repository root is retained as a reference.

## Develop and build

Requires Node.js 22 or newer.

```sh
cd room
npm ci
npm test
npm run dev
npm run build
```

`dist/` is the complete static website. `profile.html` is a readable portfolio without the 3D room. Edit `content/portfolio.json` for both portfolio views.

The optimized Blender scene is checked in at `src/assets/room.glb`. It includes the transparent oak and stacked U.S./Mexico flag gallery. The original Blender project is maintained separately in `website_blender`; its unoptimized export exceeds GitHub’s individual-file limit and is intentionally excluded. If exporting a new scene, place it at `public/models/room.glb` and run `npm run prepare:room` before building.

## Publish

GitHub Pages publishes the `gh-pages` branch, with `www.jasonpaulmiller.com` retained in its `CNAME`. Publish the contents of `room/dist/` to that branch, preserving `CNAME` and adding `.nojekyll`. Commit and push normally; do not force-push. The source commit for each release is recorded in `deployment.json` on the published branch.

## Performance and controls

The build creates a lossless gzip copy of the scene (18.5 MB instead of 43.3 MB
for the current asset). Browsers with native `DecompressionStream` fetch that
copy; older browsers fetch the original GLB. Both files must be published from
`dist/`. `npm run dev` and `npm run build` regenerate the compressed copy.

Shader warmup compiles only each render layer's objects against its lighting.
Spatial material batches keep offscreen interior details independently cullable.
The scene's geometry, textures, lights and camera framing are preserved. On
sustained slow frames, the existing motion-resolution controller now responds
within a short gesture and can reduce pixel work further, restoring the original
resolution as soon as motion settles. This can soften the image while moving on
slower devices; it does not simplify the scene or alter its resting appearance.

The room follows the mouse pointer with a quiet center and gentle vertical
movement. Touchscreens use a single-finger drag. There is no bottom toolbar.
Scroll to zoom; keyboard arrows look around, R resets, and Enter opens the
computer when the canvas has focus. Passive pointer-following is disabled for
reduced-motion preferences, with keyboard and touch navigation still available.
Header buttons retain clear focus/pressed states. The computer/profile content
and camera framing are unchanged.

Pointer updates are coalesced to the latest sample once per animation frame,
using cached canvas bounds. The look response is critically damped and reaches
90% of a fixed target in about 243 ms, versus about 486 ms previously; these are
response-model timings, not a measured rendering-speed claim. Brief pauses keep
the current motion resolution for 200 ms before restoring full sharpness,
avoiding drawing-buffer resize churn during small repeated movements. Hover
highlights alone no longer lower the camera resolution.
