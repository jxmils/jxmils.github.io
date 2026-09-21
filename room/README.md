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
