// Keep the browser's native range input: dragging, touch, arrow keys,
// Home/End, focus and accessibility all use the same visible control.
export function bindCameraDial(input, onChange) {
  function set(value) {
    value = Math.max(-1, Math.min(1, value));
    input.value = String(Math.round(value * 100));
    input.setAttribute('aria-valuetext', Math.abs(value) < .01 ? 'Facing the desk'
      : `${Math.round(Math.abs(value) * 100)} percent ${value < 0 ? 'left' : 'right'}`);
  }
  input.addEventListener('input', () => {
    set(Number(input.value) / 100);
    onChange(Number(input.value) / 100);
  });
  set(0);
  return { set };
}
