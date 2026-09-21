import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { finishInteriorMaterials } from '../src/interior-finish.js';

test('interior finishes never mutate an exterior material, even when originally shared',()=>{
 const root=new THREE.Group();
 const material=new THREE.MeshStandardMaterial({color:0x805522,roughness:.8});material.name='DeskWood';
 const outside=new THREE.Mesh(new THREE.BoxGeometry(),material);outside.name='ExteriorReference';
 const desk=new THREE.Mesh(new THREE.BoxGeometry(),material);desk.name='DeskTop';
 const shelf=new THREE.Mesh(new THREE.BoxGeometry(),material);shelf.name='Shelf';
 root.add(outside,desk,shelf);
 const before=material.toJSON();
 finishInteriorMaterials(root,o=>o===outside);
 assert.equal(outside.material,material);
 assert.deepEqual(material.toJSON(),before);
 assert.notEqual(desk.material,material);
 assert.equal(desk.material,shelf.material,'keep interior batching possible');
 assert.equal(desk.material.roughness,.58);
});
