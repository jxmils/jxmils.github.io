import './styles.css';
import './portfolio.css';
// Keep profile access and recovery available even if WebGL cannot initialize.
import('./main.js').catch((error) => {
  console.error('Room initialization failed:', error);
  document.querySelector('#loading-message').textContent='The interactive room is unavailable on this device. You can still read my profile.';
  document.querySelector('#loading-progress').hidden=true;
  document.querySelector('#room-canvas').setAttribute('aria-busy','false');
  const retry=document.querySelector('#retry-room');
  retry.hidden=false; retry.onclick=()=>location.reload();
});
