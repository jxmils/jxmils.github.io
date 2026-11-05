// Pointer devices can report far more often than the display can paint. Keep
// only the latest sample; consume it immediately before advancing the camera.
export function createPointerInput() {
  let pending = false, x = 0, y = 0;
  return {
    push(clientX, clientY) { x = clientX; y = clientY; pending = true; },
    consume(apply) {
      if (!pending) return false;
      pending = false;
      apply(x, y);
      return true;
    },
    clear() { pending = false; },
  };
}
