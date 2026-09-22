// One scheduled frame at most. A settled room sleeps until input or resize.
export function createFrameLoop(step, request = requestAnimationFrame, cancel = cancelAnimationFrame) {
  let pending = null, previous = null, paused = false;
  function wake() {
    if (!paused && pending === null) pending = request(tick);
  }
  function tick(now) {
    pending = null;
    const dt = previous === null ? 1 / 60 : Math.min(.1, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (step(now, dt)) wake();
    if (pending === null) previous = null;
  }
  return {
    wake,
    pause() { paused = true; if (pending !== null) cancel(pending); pending = null; previous = null; },
    resume() { paused = false; previous = null; wake(); },
  };
}

// Bound fill-rate on Retina/4K screens without changing geometry or materials.
export function roomPixelRatio(width, height, deviceRatio, coarse = false) {
  const budget = coarse ? 1_800_000 : 3_200_000;
  return Math.min(deviceRatio || 1, coarse ? 1.5 : 1.75,
    Math.sqrt(budget / Math.max(1, width * height)));
}
