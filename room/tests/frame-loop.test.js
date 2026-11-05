import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameLoop, roomPixelRatio } from '../src/frame-loop.js';
import { followInput } from '../src/room-motion.js';

test('bursts of input share one frame, settling sleeps and a new input wakes it', () => {
  let id = 0, ticks = 0, moving = true;
  const pending = new Map(), times = [];
  const loop = createFrameLoop((now, dt) => { ticks++; times.push(dt); return moving; },
    cb => { pending.set(++id, cb); return id; }, key => pending.delete(key));
  const run = now => { const [key, cb] = pending.entries().next().value; pending.delete(key); cb(now); };
  for (let i = 0; i < 100; i++) loop.wake();
  assert.equal(pending.size, 1);
  run(0); assert.equal(pending.size, 1);
  moving = false; run(16); assert.equal(pending.size, 0);
  loop.wake(); run(60000); assert.ok(times.at(-1) < .02, 'no jump after idle');
  loop.wake(); loop.pause(); assert.equal(pending.size, 0);
  loop.wake(); assert.equal(pending.size, 0);
  loop.resume(); run(90000); assert.equal(ticks, 4);
});

test('invalidation during a frame is retained, without duplicate callbacks', () => {
  const pending = new Map(); let id = 0, again = true, loop;
  loop = createFrameLoop(() => { if (again) { loop.wake(); loop.wake(); } return false; },
    cb => { pending.set(++id, cb); return id; }, key => pending.delete(key));
  loop.wake(); const cb = pending.get(1); pending.delete(1); cb(0);
  assert.equal(pending.size, 1);
  again = false; const last = pending.get(2); pending.delete(2); last(16);
  assert.equal(pending.size, 0);
});

test('pixel budgets bound Retina work while respecting native low-DPI screens', () => {
  for (const coarse of [false, true]) {
    for (const [w,h] of [[390,844],[1280,720],[3840,2160]]) {
      const ratio = roomPixelRatio(w,h,3,coarse);
      assert.ok(w*h*ratio*ratio <= (coarse ? 1800000 : 3200000) + 1e-6);
      assert.ok(ratio <= (coarse ? 1.5 : 1.75));
    }
  }
  assert.equal(roomPixelRatio(1280,720,1),1);
});

test('cursor resting zone is smooth, symmetric and still reaches both edges', () => {
  assert.equal(followInput(.02),0);
  assert.equal(followInput(-.02),0);
  assert.ok(followInput(.02501) < 1e-7);
  assert.equal(followInput(1),1);
  assert.equal(followInput(-4),-1);
  let previous=0;
  for (let i=0;i<=1000;i++) {
    const value=followInput(i/1000);
    assert.ok(value>=previous && value<=1);
    assert.ok(Math.abs(value+followInput(-i/1000))<1e-12);
    previous=value;
  }
});

test('a slower foreground display retains elapsed motion time', () => {
  let callback, elapsed;
  const loop=createFrameLoop((now,dt)=>{elapsed=dt;return true;},cb=>{callback=cb;return 1;},()=>{});
  loop.wake();callback(0);callback(1000/15);
  assert.ok(Math.abs(elapsed-1/15)<1e-12);
  loop.pause();
});

import { createMotionQuality } from '../src/frame-loop.js';
test('motion quality ignores short stalls, adapts to sustained slow frames and restores sharp idle view',()=>{
 const fast=createMotionQuality();
 for(let i=0;i<300;i++) assert.equal(fast.sample(1/60,true),1);
 assert.equal(fast.sample(.1,true),1);
 const slow=createMotionQuality();
 let scale=1;
 for(let i=0;i<180;i++) scale=slow.sample(1/30,true);
 assert.equal(scale,.65);
 assert.equal(slow.sample(1/60,false),.65);
 assert.equal(slow.settling,true);
 for(let i=0;i<18;i++) scale=slow.sample(1/60,false);
 assert.equal(scale,1);
 assert.equal(slow.settling,false);
 assert.equal(slow.sample(1/60,true),.65);
});

 test('motion quality responds within a short gesture, not only after it ends', () => {
   const quality = createMotionQuality(); let scale = 1;
   for (let i = 0; i < 30; i++) scale = quality.sample(1/30, true);
   assert.ok(scale < 1);
   for (let i = 0; i < 18; i++) scale = quality.sample(1/60, false);
   assert.equal(scale, 1);
 });

test('brief pauses keep the motion buffer stable; real rest restores once and sleeps', () => {
  const quality = createMotionQuality();
  let scale;
  for (let i=0; i<180; i++) scale = quality.sample(1/30, true);
  for (let burst=0; burst<10; burst++) {
    for (let i=0; i<6; i++) assert.equal(quality.sample(1/60, false), scale);
    assert.equal(quality.sample(1/60, true), scale);
  }
  let callback = null, ticks = 0, restores = 0;
  const loop = createFrameLoop((now, dt) => {
    ticks++;
    const next = quality.sample(dt, false);
    if (next !== scale) { restores++; scale = next; }
    return quality.settling;
  }, cb => { callback = cb; return ticks; }, () => { callback = null; });
  loop.wake();
  for (let i=0; i<30 && callback; i++) {
    const next = callback; callback = null; next(i*1000/60);
  }
  assert.equal(scale, 1);
  assert.equal(restores, 1);
  assert.ok(ticks <= 14);
  assert.equal(callback, null, 'idle grace period must not leave a permanent RAF loop');
});
