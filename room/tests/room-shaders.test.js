import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, PerspectiveCamera, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { layerCompileGroup, compileRoomLayers } from '../src/room-shaders.js';

test('compile subsets preserve the live scene and shared resources', () => {
  const scene = new Scene(), camera = new PerspectiveCamera();
  const inside = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  const outside = inside.clone(); outside.layers.set(1);
  scene.add(inside, outside);
  const subset = layerCompileGroup(scene, camera);
  assert.equal(subset.children.length, 1);
  assert.equal(subset.children[0].geometry, inside.geometry);
  assert.equal(subset.children[0].material, inside.material);
  assert.equal(inside.parent, scene); assert.equal(outside.parent, scene);
});

test('each pass uses its own objects and original scene lighting; camera restores on failure', async () => {
  const scene = new Scene(), camera = new PerspectiveCamera(); camera.layers.enable(1);
  for (const layer of [0, 1]) { const mesh = new Mesh(); mesh.layers.set(layer); scene.add(mesh); }
  const calls = [];
  await compileRoomLayers({ compileAsync: async (subset, cam, target) => {
    assert.equal(target, scene); assert.equal(subset.children.length, 1);
    assert.equal(subset.children[0].layers.mask, cam.layers.mask); calls.push(cam.layers.mask);
  } }, scene, camera);
  assert.deepEqual(calls, [2, 1]); assert.equal(camera.layers.mask, 3);
  await assert.rejects(compileRoomLayers({ compileAsync: async () => { throw Error('GPU lost'); } }, scene, camera));
  assert.equal(camera.layers.mask, 3);
});
