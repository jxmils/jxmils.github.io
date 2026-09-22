// Input normalization and easing are shared by mouse, trackpad and buttons.
export function zoomDistance(distance, delta, deltaMode, min, max) {
  const units = deltaMode === 1 ? 16 : deltaMode === 2 ? 300 : 1;
  const pixels = Math.max(-140, Math.min(140, delta * units));
  return Math.max(min, Math.min(max, distance * Math.exp(pixels * 0.001)));
}

export function motionProgress(now, start, duration) {
  const t = Math.max(0, Math.min(1, (now - start) / Math.max(1, duration)));
  // Zero velocity AND acceleration at each end: no sudden start or stop.
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function responseAt(rate, dt) {
  return 1 - Math.exp(-rate * Math.max(0, dt));
}

// Analytic critically damped response: smooth acceleration without a bouncy
// spring, and the same settling time at different display refresh rates.
export function dampAxis(value, velocity, target, dt, frequency = 8) {
  const elapsed = Math.max(0, dt);
  const change = value - target;
  const decay = Math.exp(-frequency * elapsed);
  const travel = (velocity + frequency * change) * elapsed;
  return {
    value: target + (change + travel) * decay,
    velocity: (velocity - frequency * travel) * decay,
  };
}

export function roomLookAngles(x, y) {
  const horizontal = Math.max(-1, Math.min(1, x));
  const vertical = Math.max(-1, Math.min(1, y));
  return {
    // Precise around the computer; a complete side-wall sweep at the edges.
    yaw: -(horizontal * 0.55 + horizontal ** 3 * 0.45) * Math.PI * 80 / 180,
    pitch: vertical * (vertical >= 0 ? 0.40 : 0.68),
  };
}

// Ignore tiny resting-hand motion, blending smoothly out of the center.
// Unlike a hard threshold, the response has zero slope at the dead-zone edge.
export function followInput(value, deadZone = .025) {
  const magnitude = Math.min(1, Math.abs(value));
  if (magnitude <= deadZone) return 0;
  const t = (magnitude - deadZone) / (1 - deadZone);
  return Math.sign(value) * 1.04 * t * t / (t + .04);
}
