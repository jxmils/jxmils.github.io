import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { windowScissor } from '../src/window-render.js';
const camera = new PerspectiveCamera(60, 16/9, .1, 100);
camera.updateMatrixWorld(true);
test('exterior rendering covers window corners and skips an offscreen window', () => {
  const box=new Box3(new Vector3(-1,-1,-5.1),new Vector3(1,1,-5));
  const rect=windowScissor(box,camera,1280,720);
  assert.ok(rect.width*rect.height < 1280*720*.2);
  for(let i=0;i<8;i++) {
    const p=new Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).project(camera);
    const x=(p.x+1)*640,y=(p.y+1)*360;
    assert.ok(x>=rect.x && x<=rect.x+rect.width);
    assert.ok(y>=rect.y && y<=rect.y+rect.height);
  }
  assert.equal(windowScissor(new Box3(new Vector3(20,0,-5),new Vector3(22,2,-4)),camera,1280,720),null);
  assert.equal(windowScissor(new Box3(new Vector3(-1,-1,4),new Vector3(1,1,5)),camera,1280,720),null);
});
test('window crossing the eye plane safely falls back to full frame',()=>{
  assert.deepEqual(windowScissor(new Box3(new Vector3(-1,-1,-1),new Vector3(1,1,1)),camera,800,600),{x:0,y:0,width:800,height:600});
});

import { fitWindowCamera } from '../src/window-render.js';
test('cropped exterior keeps identical screen coordinates and depth without changing room camera', () => {
 const source=new PerspectiveCamera(56,1280/720,.05,900);
 source.position.set(2,3,4); source.lookAt(-3,1,-15); source.updateMatrixWorld(true);
 const original=source.projectionMatrix.clone();
 const rect={x:800,y:150,width:300,height:450};
 const crop=fitWindowCamera(new PerspectiveCamera(),source,rect,1280,720);
 for(const point of [new Vector3(-3,1,-15),new Vector3(1,4,-20)]) {
  const full=point.clone().project(source),part=point.clone().project(crop);
  assert.ok(Math.abs((full.x+1)*640-(rect.x+(part.x+1)*rect.width/2))<1e-9);
  assert.ok(Math.abs((full.y+1)*360-(rect.y+(part.y+1)*rect.height/2))<1e-9);
  assert.ok(Math.abs(full.z-part.z)<1e-12);
 }
 assert.deepEqual(source.projectionMatrix,original);
 assert.equal(source.view,null);
 assert.equal(crop.layers.mask,2);
});
