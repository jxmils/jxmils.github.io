import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Hundreds of static architectural details share materials. Draw them together
// so orbiting the room does not submit a separate GPU call for every brick.
export function batchStaticRoom(root, isExterior) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  let before = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    before += 1;
    if (object.name === 'MonitorScreen' || object.isSkinnedMesh || object.children.length
      || Array.isArray(object.material) || object.material.transparent
      || object.geometry.morphAttributes.position?.length) return;
    const geometry = object.geometry;
    const attributes = Object.entries(geometry.attributes)
      .map(([name, attr]) => `${name}:${attr.itemSize}:${attr.normalized}`)
      .sort().join('|');
    const key = [object.material.uuid, attributes, !!geometry.index,
      object.castShadow, object.receiveShadow, isExterior(object)].join('/');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(object);
  });
  let removed = 0;
  for (const objects of groups.values()) {
    if (objects.length < 3) continue;
    const geometries = objects.map((object) => {
      const geometry = object.geometry.clone();
      // Quantized GLB attributes must become floats before world transforms;
      // writing world coordinates back to normalized integers would clamp them.
      for (const [name, attribute] of Object.entries(geometry.attributes)) {
        if (attribute.array instanceof Float32Array) continue;
        const values=new Float32Array(attribute.count*attribute.itemSize);
        for(let i=0;i<attribute.count;i++)for(let c=0;c<attribute.itemSize;c++)
          values[i*attribute.itemSize+c]=attribute.getComponent(i,c);
        geometry.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize));
      }
      geometry.applyMatrix4(object.matrixWorld);
      return geometry;
    });
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((item) => item.dispose());
    if (!geometry) continue;
    geometry.computeBoundingSphere();
    const source = objects[0];
    const batch = new THREE.Mesh(geometry, source.material);
    batch.name = `StaticRoom_${source.material.name}`;
    batch.layers.mask = source.layers.mask;
    batch.castShadow = source.castShadow;
    batch.receiveShadow = source.receiveShadow;
    batch.userData.sourceNames = objects.map((object) => object.name);
    // Geometry is already in world coordinates; root is the identity GLTF scene.
    root.add(batch);
    objects.forEach((object) => object.removeFromParent());
    removed += objects.length - 1;
  }
  return { before, after: before - removed };
}
