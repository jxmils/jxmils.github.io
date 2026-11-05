import { Group } from 'three';

// Three's compileAsync filters lights by camera layer, but traverses ALL
// meshes. Give it only the objects rendered in this pass, with the real scene
// supplying lighting/environment. Shallow clones share materials and geometry
// and leave the live hierarchy, transforms, and interaction targets untouched.
export function layerCompileGroup(scene, camera) {
  const group = new Group();
  scene.traverse(object => {
    if ((object.isMesh || object.isLine || object.isPoints || object.isSprite)
      && object.layers.test(camera.layers)) group.add(object.clone(false));
  });
  return group;
}

export async function compileRoomLayers(renderer, scene, camera) {
  const mask = camera.layers.mask;
  try {
    for (const layer of [1, 0]) {
      camera.layers.set(layer);
      await renderer.compileAsync(layerCompileGroup(scene, camera), camera, scene);
    }
  } finally { camera.layers.mask = mask; }
}
