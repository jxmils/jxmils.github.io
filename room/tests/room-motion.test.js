import test from 'node:test';
import assert from 'node:assert/strict';
import { zoomDistance, motionProgress, responseAt } from '../src/room-motion.js';

test('wheel devices agree on physical scroll units and respect room limits', () => {
  assert.equal(zoomDistance(5, 3, 1, 3.5, 6.5), zoomDistance(5, 48, 0, 3.5, 6.5));
  assert.equal(zoomDistance(5, .16, 2, 3.5, 6.5), zoomDistance(5, 48, 0, 3.5, 6.5));
  let near = 5, far = 5;
  for (let i = 0; i < 100; i++) {
    near = zoomDistance(near, -1000, 0, 3.5, 6.5);
    far = zoomDistance(far, 1000, 0, 3.5, 6.5);
  }
  assert.equal(near, 3.5);
  assert.equal(far, 6.5);
  const inward = zoomDistance(5, -40, 0, 3.5, 6.5);
  assert.ok(Math.abs(zoomDistance(inward, 40, 0, 3.5, 6.5) - 5) < 1e-12);
});

test('camera flights never overshoot and settle after a background-tab pause', () => {
  assert.equal(motionProgress(50, 100, 1250), 0);
  assert.equal(motionProgress(100000, 100, 1250), 1);
  assert.equal(motionProgress(101, 100, 0), 1);
  let previous = 0;
  for (let t = 100; t <= 1350; t++) {
    const progress = motionProgress(t, 100, 1250);
    assert.ok(progress >= previous - 1e-12 && progress <= 1);
    previous = progress;
  }
  assert.ok(motionProgress(101, 100, 1250) < 1e-7, 'gentle departure');
  assert.ok(1 - motionProgress(1349, 100, 1250) < 1e-7, 'gentle arrival');
});

test('zoom and pan settle equally on 30, 60 and 120 Hz displays', () => {
  const settle = hz => {
    let position = 0;
    for (let i = 0; i < hz; i++) position += (1 - position) * responseAt(8, 1 / hz);
    return position;
  };
  assert.ok(Math.abs(settle(30) - settle(120)) < 1e-12);
  assert.ok(Math.abs(settle(60) - settle(120)) < 1e-12);
  assert.equal(responseAt(8, 0), 0);
});

// Cursor motion must keep its feel on different refresh rates, especially now
// that a single pointer movement can traverse the full study.
test('wide tracking accelerates softly and settles without overshooting', async () => {
  const { dampAxis } = await import('../src/room-motion.js');
  const settle = hz => {
    let state = { value: 0, velocity: 0 };
    for (let i = 0; i < hz; i++) {
      state = dampAxis(state.value, state.velocity, 1, 1 / hz);
      assert.ok(state.value >= 0 && state.value <= 1);
    }
    return state;
  };
  assert.ok(dampAxis(0, 0, 1, 1 / 60).value < .01, 'no initial jump');
  const slow = settle(30), fast = settle(120);
  assert.ok(Math.abs(slow.value - fast.value) < 1e-12);
  assert.ok(Math.abs(slow.velocity - fast.velocity) < 1e-12);
  assert.ok(fast.value > .995);
});

test('room tracking reaches both side walls and stays bounded at pointer edges', async () => {
  const { roomLookAngles } = await import('../src/room-motion.js');
  const left = roomLookAngles(-1, 0), right = roomLookAngles(1, 0);
  assert.ok(Math.abs((left.yaw - right.yaw) * 180 / Math.PI - 160) < 1e-10);
  assert.deepEqual(roomLookAngles(2, -2), roomLookAngles(1, -1));
  assert.equal(roomLookAngles(0, 0).pitch, 0);
  assert.ok(Math.abs(roomLookAngles(.1, 0).yaw) < .09, 'precision near the monitor');
});
