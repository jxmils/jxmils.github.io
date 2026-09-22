export function dialPoint(value) {
  const x = Math.max(-1, Math.min(1, value));
  return { x: 120 + 98 * x, y: 18 + 34 * x * x };
}

export function bindCameraDial(input, ball, onChange) {
  function set(value) {
    value = Math.max(-1, Math.min(1, value));
    input.value = String(Math.round(value * 100));
    const point = dialPoint(value);
    ball.setAttribute('cx', point.x);
    ball.setAttribute('cy', point.y);
    input.setAttribute('aria-valuetext', Math.abs(value) < .01 ? 'Facing the desk'
      : `${Math.round(Math.abs(value) * 100)} percent ${value < 0 ? 'left' : 'right'}`);
  }
  input.addEventListener('input', () => { const value = Number(input.value) / 100; set(value); onChange(value); });
  input.addEventListener('keydown', event => {
    const steps = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 };
    if (!(event.key in steps) && event.key !== 'Home') return;
    event.preventDefault(); event.stopPropagation();
    const value = event.key === 'Home' ? 0 : (Number(input.value) + steps[event.key]) / 100;
    set(value); onChange(Number(input.value) / 100);
  });
  set(0);
  return { set };
}
