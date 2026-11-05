import test from 'node:test';
import assert from 'node:assert/strict';
import { createPointerInput } from '../src/pointer-input.js';
import { createFrameLoop } from '../src/frame-loop.js';

test('a high-rate pointer burst applies only its latest sample on the next frame', () => {
  const input = createPointerInput(), applied = [];
  let callback, requests = 0;
  const loop = createFrameLoop(() => {
    input.consume((x,y) => applied.push([x,y]));
    return false;
  }, cb => { callback=cb; return ++requests; }, () => {});
  for(let i=0;i<1000;i++) { input.push(i, i*2); loop.wake(); }
  assert.equal(requests,1);
  assert.deepEqual(applied,[]);
  callback(16);
  assert.deepEqual(applied,[[999,1998]]);
  assert.equal(input.consume(()=>assert.fail('replayed old input')),false);
});

test('clicks, resets and leaving the room can discard an unpainted sample', () => {
  const input = createPointerInput();
  input.push(200,100); input.clear();
  assert.equal(input.consume(()=>assert.fail('stale input applied')),false);
  input.push(400,300);
  let position;
  input.consume((x,y)=>{position=[x,y];});
  assert.deepEqual(position,[400,300]);
});
