import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { batchStaticRoom } from '../src/scene-performance.js';
test('quantized meshes retain world-space bounds when batched, and monitor stays interactive',()=>{
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 for(let i=0;i<3;i++){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Int16Array([-32767,0,0,32767,0,0,0,32767,0]),3,true));
  const mesh=new THREE.Mesh(geometry,material);mesh.position.x=10+i*3;root.add(mesh);
 }
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(),material);screen.name='MonitorScreen';root.add(screen);
 const result=batchStaticRoom(root,()=>false);
 assert.deepEqual(result,{before:4,after:2});
 assert.equal(root.getObjectByName('MonitorScreen'),screen);
 const batch=root.children.find(o=>o!==screen);
 batch.geometry.computeBoundingBox();
 assert.equal(batch.geometry.boundingBox.min.x,9);
 assert.equal(batch.geometry.boundingBox.max.x,17);
 assert.ok(batch.geometry.attributes.position.array instanceof Float32Array);
});
