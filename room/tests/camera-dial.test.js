import test from 'node:test';
import assert from 'node:assert/strict';
import { dialPoint, bindCameraDial } from '../src/camera-dial.js';

test('dial stays on its semicircle and clamps both endpoints', () => {
 for(let i=-100;i<=100;i++) {
  const p=dialPoint(i/100);
  assert.ok(Math.abs((p.x-96)**2+(p.y-84)**2-74**2)<1e-8);
  assert.ok(p.y<=84);
 }
 assert.deepEqual(dialPoint(-9),{x:22,y:84});
 assert.deepEqual(dialPoint(9),{x:170,y:84});
 assert.deepEqual(dialPoint(0),{x:96,y:10});
});

test('drag input, arrow keys and Home share bounded state and accessible values', () => {
 const input=new EventTarget(); input.value='0';input.setAttribute=(k,v)=>{input[k]=v;};
 const ball={setAttribute(k,v){this[k]=v;}};const changes=[];
 const dial=bindCameraDial(input,ball,v=>changes.push(v));
 input.value='65';input.dispatchEvent(new Event('input'));
 assert.equal(changes.at(-1),.65);
 const key=k=>{const e=new Event('keydown',{cancelable:true});e.key=k;input.dispatchEvent(e);};
 key('ArrowRight');assert.equal(changes.at(-1),.7);
 dial.set(.98);key('ArrowRight');assert.equal(changes.at(-1),1);
 key('Home');assert.equal(changes.at(-1),0);assert.equal(input['aria-valuetext'],'Facing the desk');
 key('ArrowLeft');assert.equal(changes.at(-1),-.05);assert.equal(input['aria-valuetext'],'5 percent left');
});
