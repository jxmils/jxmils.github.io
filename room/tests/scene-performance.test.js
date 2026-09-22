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

test('distant exterior clusters stay separately cullable with all triangles retained',()=>{
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 for(const x of [1,2,3,31,32,33]) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(),material);
  mesh.position.x=x;mesh.layers.set(1);root.add(mesh);
 }
 const result=batchStaticRoom(root,()=>true);
 assert.deepEqual(result,{before:6,after:2});
 assert.equal(root.children.reduce((n,m)=>n+m.geometry.index.count,0),6*36);
 assert.ok(root.children.every(m=>m.layers.mask===2));
 const boxes=root.children.map(m=>new THREE.Box3().setFromObject(m));
 assert.ok(!boxes[0].intersectsBox(boxes[1]));
});

test('batch cleanup preserves geometry still used by interactive meshes',()=>{
 const root=new THREE.Group(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial();
 let disposed=false;geometry.addEventListener('dispose',()=>{disposed=true;});
 for(let i=0;i<3;i++) root.add(new THREE.Mesh(geometry,material));
 const monitor=new THREE.Mesh(geometry,material);monitor.name='MonitorScreen';root.add(monitor);
 batchStaticRoom(root,()=>false);
 assert.equal(disposed,false);
 assert.equal(root.getObjectByName('MonitorScreen').geometry,geometry);
});
