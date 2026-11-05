import test from 'node:test';
import assert from 'node:assert/strict';
import { bindCameraDial } from '../src/camera-dial.js';

test('native range input and programmatic reset share bounded, accessible state', () => {
  const input = new EventTarget();
  input.value = '0'; input.setAttribute = (k, v) => { input[k] = v; };
  const changes = [];
  const dial = bindCameraDial(input, v => changes.push(v));
  input.value = '65'; input.dispatchEvent(new Event('input'));
  assert.equal(changes.at(-1), .65);
  assert.equal(input['aria-valuetext'], '65 percent right');
  dial.set(-4); assert.equal(input.value, '-100');
  dial.set(4); assert.equal(input.value, '100');
  dial.set(0); assert.equal(input['aria-valuetext'], 'Facing the desk');
  // No custom keydown handler: native Home/End/arrows retain their semantics.
  const key = new Event('keydown', { cancelable: true }); key.key = 'Home';
  input.dispatchEvent(key); assert.equal(key.defaultPrevented, false);
});
