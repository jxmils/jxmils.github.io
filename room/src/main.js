import roomUrl from './assets/room.glb?url';
import { MeshoptDecoder } from 'meshoptimizer/decoder';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { batchStaticRoom } from './scene-performance.js';
import { zoomDistance, motionProgress, responseAt, dampAxis, roomLookAngles } from './room-motion.js';

const canvas = document.querySelector('#room-canvas');
const desktop = document.querySelector('#desktop');
const enterDesktopButton = document.querySelector('#enter-desktop');
const dockItems = document.querySelectorAll('.dock-item[data-window]');

// ---------------------------------------------------------------------------
// Look dials. Everything that controls the "cozy diorama" mood lives here so
// the rig can be retuned without hunting through the scene setup below.
// ---------------------------------------------------------------------------
const LOOK = {
  exposure: 1.08,
  background: 0x080b12,
  envIntensity: 0.5,
  key: { color: 0xffdfb8, intensity: 1.15 },
  bounce: { color: 0xd3b291, intensity: 0.18 },
  coolRim: { color: 0x6d8bd6, intensity: 0.35 },
  frontFill: { color: 0xe2d4bf, intensity: 0.5 },
  ambient: { color: 0xa2acbb, intensity: 0.18 },
  hemi: { sky: 0xc2c8d1, ground: 0x79654d, intensity: 0.48 },
  deskSpot: { color: 0xffc185, intensity: 2.1, angle: 1.05, penumbra: 1.0 },
  pictureLight: { color: 0xffc98a, intensity: 0.38, distance: 1.7 },
  screen: { color: 0xcfe0ff, emissive: 0.8, glowIntensity: 0.24, glowDistance: 1.4 },
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = LOOK.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = null;
renderer.setClearColor(LOOK.background);
renderer.autoClear = false;

// Far plane has to clear the sky backdrop, which sits ~250 units out beyond
// the building. At the old 100 the whole exterior was clipped away.
let camera = new THREE.PerspectiveCamera(42, 1, 0.1, 900);
camera.position.set(5.0, 4.4, 2.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.25, -1.0, 1.25);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
// Slower than default: at this scale the stock speeds overshoot and it is easy
// to lose the room entirely.
controls.rotateSpeed = 0.18;
controls.zoomSpeed = 0.38;
controls.enablePan = true;
controls.panSpeed = 0.23;
controls.enabled = false;
controls.screenSpacePanning = true;
controls.minPolarAngle = Math.PI * 0.16;
controls.maxPolarAngle = Math.PI * 0.62;
controls.minDistance = 3.5;
controls.maxDistance = 6.5;

// A warm vertical gradient standing in for an image-based environment: amber
// ceiling bounce over a dark floor. Cheap, and it keeps roughness reading as
// material rather than as flat grey.
function makeWarmEnvironment() {
  const source = document.createElement('canvas');
  source.width = 16;
  source.height = 64;
  const ctx = source.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, source.height);
  gradient.addColorStop(0.0, '#5a3d26');
  gradient.addColorStop(0.45, '#2b2019');
  gradient.addColorStop(1.0, '#100b08');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, source.width, source.height);

  const texture = new THREE.CanvasTexture(source);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(texture).texture;
  pmrem.dispose();
  texture.dispose();
  return envMap;
}

scene.environment = makeWarmEnvironment();
scene.environmentIntensity = LOOK.envIntensity;

// Single shadow-casting key, standing in for the window sun. Repositioned to
// the exported WindowSun once the GLB lands.
const keyLight = new THREE.DirectionalLight(LOOK.key.color, LOOK.key.intensity);
keyLight.position.set(3.5, 4.6, 3.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.bias = -0.0006;
keyLight.shadow.radius = 4;
keyLight.shadow.normalBias = 0.006;
scene.add(keyLight);
scene.add(keyLight.target);

// Warm light kicking back off the floor, and a cool counter-rim so the shadow
// side reads as shadow instead of as black.
const bounceLight = new THREE.DirectionalLight(LOOK.bounce.color, LOOK.bounce.intensity);
bounceLight.position.set(1.0, -2.5, 1.5);
scene.add(bounceLight);

const coolRim = new THREE.DirectionalLight(LOOK.coolRim.color, LOOK.coolRim.intensity);
coolRim.position.set(-3.6, 2.4, 2.0);
scene.add(coolRim);

// Cycles bounces light onto the back wall for free; three.js does not, so the
// wall facing the camera needs an explicit soft fill or it reads near-black.
const frontFill = new THREE.DirectionalLight(LOOK.frontFill.color, LOOK.frontFill.intensity);
frontFill.position.set(2.0, 3.0, -6.0);
scene.add(frontFill);

scene.add(new THREE.AmbientLight(LOOK.ambient.color, LOOK.ambient.intensity));
scene.add(new THREE.HemisphereLight(LOOK.hemi.sky, LOOK.hemi.ground, LOOK.hemi.intensity));

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let monitorScreen = null;
let monitorBaseMaterial = null;
let roomModel = null;
let horizontalFov = null;
let homePose = null;
let flight = null;
let roomReady = false;
let needsRender = true;
let returnPose = null;
let openingComputer = false;
const pendingPan = new THREE.Vector3();
let returnFocus = null;
let dragMode = 'follow';
const cursorGoal = new THREE.Vector2();
const cursorOffset = new THREE.Vector2();
const cursorVelocity = new THREE.Vector2();
let lastHoverPointer = null;
let pointerDownHit = false;
const activePointers = new Set();
let multiTouchGesture = false;
const loading = document.querySelector('#room-loading');
const loadingMessage = document.querySelector('#loading-message');
const progress = document.querySelector('#loading-progress');
const status = document.querySelector('#room-status');
const monitorHint = document.querySelector('#monitor-hint');
const hint = document.querySelector('#gesture-hint');
const help = document.querySelector('#navigation-help');
const helpButton = document.querySelector('#show-help');
const roomUI = [...document.querySelectorAll('.room-ui')];
const coarsePointer = window.matchMedia('(pointer: coarse)');
function invalidate() { needsRender = true; }
controls.addEventListener('change', invalidate);
let isHoveringMonitor = false;
let zoomGoal = null;
let dragOrigin = null;
let pointerTravel = 0;
let lastFrameTime = performance.now();
let lastCanvasWidth = 0;
let lastCanvasHeight = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
controls.enableDamping = !reducedMotion.matches;

function setSize() {
  const { clientWidth, clientHeight } = canvas;
  if (clientWidth === lastCanvasWidth && clientHeight === lastCanvasHeight) return;
  lastCanvasWidth = clientWidth;
  lastCanvasHeight = clientHeight;
  renderer.setSize(clientWidth, clientHeight, false);
  invalidate();
  camera.aspect = clientWidth / clientHeight;
  // Blender fits its lens horizontally, but three.js fov is vertical. Keeping
  // the horizontal angle fixed is what makes the browser frame the room the
  // same way the Blender render does -- and stops the view zooming in when the
  // window is narrow.
  if (horizontalFov) {
    const halfH = THREE.MathUtils.degToRad(horizontalFov) / 2;
    // Keep the shelf and desktop inside the frame on wide browser windows.
    camera.fov = Math.min(78, Math.max(56, THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(halfH) / Math.max(camera.aspect, 0.0001)),
    )));
  }
  camera.updateProjectionMatrix();
}

function setRoomUI(active) {
  roomUI.forEach((el) => { el.inert = !active; el.setAttribute('aria-hidden', String(!active)); });
  canvas.inert = !active;
  document.body.classList.toggle('computer-open', !active);
}

function openDesktop() {
  openingComputer = false;
  controls.enabled = false;
  zoomGoal = null;
  desktop.inert = false;
  desktop.classList.add('visible');
  desktop.setAttribute('aria-hidden', 'false');
  setRoomUI(false);
  enterDesktopButton.textContent = 'Open computer ↗';
  enterDesktopButton.disabled = false;
  requestAnimationFrame(() => {
    if (desktop.classList.contains('visible')) document.querySelector('#close-computer').focus({ preventScroll: true });
  });
  status.textContent = 'Computer open. Press Escape to return to your view.';
}

desktop.addEventListener('transitionend', (event) => {
  if (event.target === desktop && event.propertyName === 'opacity'
    && desktop.classList.contains('visible') && !desktop.contains(document.activeElement)) {
    document.querySelector('#close-computer').focus({ preventScroll: true });
  }
});

function closeDesktop() {
  openingComputer = false;
  desktop.inert = true;
  desktop.classList.remove('visible');
  desktop.setAttribute('aria-hidden', 'true');
  setRoomUI(true);
  enterDesktopButton.textContent = 'Open computer ↗';
  enterDesktopButton.disabled = false;
  const destination = returnPose ?? homePose;
  if (destination) flyTo(destination.position, destination.target, 1100, () => {
    (returnFocus?.isConnected ? returnFocus : enterDesktopButton).focus({ preventScroll: true });
    status.textContent = 'Back in the room.';
  });
}

// Flush residual OrbitControls damping without moving the requested pose.
// Otherwise a reset/return inherits the previous drag and jumps on arrival.
function settleControls() {
  const position = camera.position.clone();
  const target = controls.target.clone();
  controls.enableDamping = false;
  controls.update();
  camera.position.copy(position);
  controls.target.copy(target);
  controls.update();
  controls.enableDamping = !reducedMotion.matches;
  camera.position.copy(position);
  controls.target.copy(target);
  camera.lookAt(target);
}

function setPointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function findMonitorScreen(root) {
  let screen = null;
  root.traverse((object) => {
    if (!screen && object.isMesh && object.name === 'MonitorScreen') {
      screen = object;
    }
  });
  return screen;
}

function useExportedCamera(root) {
  const exportedCamera = root.getObjectByName('Camera');
  if (!exportedCamera?.isCamera) return;

  exportedCamera.getWorldPosition(camera.position);
  exportedCamera.getWorldQuaternion(camera.quaternion);
  camera.fov = exportedCamera.fov || camera.fov;
  const exportedAspect = exportedCamera.aspect || 16 / 9;
  const halfV = THREE.MathUtils.degToRad(camera.fov) / 2;
  horizontalFov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfV) * exportedAspect));
  camera.near = 0.05;
  camera.far = 900;
  camera.updateProjectionMatrix();
  lastCanvasWidth = 0;
  setSize();

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  controls.target.copy(camera.position).add(forward.multiplyScalar(5));
  controls.update();
}

// Look around from the seated eye position, rather than orbiting around the
// desk. Wide horizontal coverage does not push the camera through furniture.
function cursorViewPose() {
  const { yaw, pitch } = roomLookAngles(cursorOffset.x, cursorOffset.y);
  const forward = controls.target.clone().sub(camera.position);
  const distance = forward.length();
  forward.normalize();
  const baseHeading = Math.atan2(forward.x, forward.z);
  // The scene is a three-wall room. Keep the entire horizontal view inside
  // its two front corners, even on a wide display, rather than reveal the set edge.
  const halfView = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
  const minHeading = Math.atan2(-3.94 - camera.position.x, -2.94 - camera.position.z) + halfView + 0.055;
  const maxHeading = Math.atan2(3.94 - camera.position.x, -2.94 - camera.position.z) - halfView - 0.055;
  const centreHeading = THREE.MathUtils.clamp(baseHeading, minHeading, maxHeading);
  const available = yaw < 0 ? centreHeading - minHeading : maxHeading - centreHeading;
  const fullSweep = THREE.MathUtils.degToRad(80);
  // Map the entire cursor travel into the available view: no abrupt hard stop
  // or unresponsive band of screen near the narrower side of the room.
  const heading = centreHeading + yaw * Math.min(fullSweep, available) / fullSweep;
  const elevation = THREE.MathUtils.clamp(Math.asin(forward.y) + pitch, -1.1, 0.9);
  const direction = new THREE.Vector3(
    Math.sin(heading) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(heading) * Math.cos(elevation),
  );
  return {
    position: camera.position.clone(),
    target: camera.position.clone().addScaledVector(direction, distance),
  };
}

function withCursorView(action) {
  const position = camera.position.clone();
  const quaternion = camera.quaternion.clone();
  const view = cursorViewPose();
  camera.position.copy(view.position);
  camera.lookAt(view.target);
  camera.updateMatrixWorld(true);
  try { return action(); }
  finally {
    camera.position.copy(position);
    camera.quaternion.copy(quaternion);
    camera.updateMatrixWorld(true);
  }
}

function settleCursorView() {
  if (cursorOffset.lengthSq() > 0) {
    const view = cursorViewPose();
    camera.position.copy(view.position);
    controls.target.copy(view.target);
    camera.lookAt(view.target);
  }
  cursorGoal.set(0, 0);
  cursorOffset.set(0, 0);
  cursorVelocity.set(0, 0);
}

function setMonitorHover(active) {
  if (!monitorScreen || active === isHoveringMonitor) return;
  isHoveringMonitor = active;
  document.body.classList.toggle('monitor-hover', active);
  monitorHint.classList.toggle('visible', active && !coarsePointer.matches);
  invalidate();
}

function updateMonitorHit(event) {
  if (!monitorScreen || !controls.enabled || flight) return false;
  setPointer(event);
  const hit = withCursorView(() => {
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(monitorScreen, true).length > 0;
  });
  setMonitorHover(hit);
  if (hit) {
    monitorHint.style.left = `${Math.min(event.clientX + 18, window.innerWidth - 165)}px`;
    monitorHint.style.top = `${Math.max(12, event.clientY - 44)}px`;
  }
  return hit;
}

// All camera motion is advanced by the same render loop. Continuously aiming
// at the interpolated target avoids the old end-of-flight orientation snap.
function flyTo(position, target, duration = 1100, onArrive) {
  if (!roomReady) return;
  settleCursorView();
  if (!flight) settleControls();
  controls.enabled = false;
  enterDesktopButton.disabled = true;
  zoomGoal = null;
  pendingPan.set(0, 0, 0);
  setMonitorHover(false);
  flight = {
    start: performance.now(), duration: reducedMotion.matches ? 1 : duration,
    fromPosition: camera.position.clone(), fromTarget: controls.target.clone(),
    position: position.clone(), target: target.clone(), onArrive,
  };
  invalidate();
}

function advanceFlight(now) {
  const active = flight;
  const eased = motionProgress(now, active.start, active.duration);
  camera.position.lerpVectors(active.fromPosition, active.position, eased);
  controls.target.lerpVectors(active.fromTarget, active.target, eased);
  camera.lookAt(controls.target);
  invalidate();
  if (eased >= 1) {
    flight = null;
    controls.enabled = !desktop.classList.contains('visible');
    enterDesktopButton.disabled = false;
    active.onArrive?.();
  }
}

function rememberHome() {
  const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  controls.minAzimuthAngle = spherical.theta - 0.75;
  controls.maxAzimuthAngle = spherical.theta + 0.75;
  controls.minPolarAngle = Math.max(0.4, spherical.phi - 0.3);
  controls.maxPolarAngle = Math.min(1.62, spherical.phi + 0.2);
  homePose = {
    position: camera.position.clone(),
    target: controls.target.clone(),
  };
}

function goHome(duration = 1150) {
  if (!homePose || desktop.classList.contains('visible')) return;
  openingComputer = false;
  enterDesktopButton.disabled = false;
  enterDesktopButton.textContent = 'Open computer ↗';
  flyTo(homePose.position, homePose.target, duration, () => {
    status.textContent = 'Original view restored.';
  });
}

function focusMonitor() {
  if (!roomReady || flight || !monitorScreen || enterDesktopButton.disabled
    || desktop.classList.contains('visible')) return;
  if (!flight) settleControls();
  returnPose = { position: camera.position.clone(), target: controls.target.clone() };
  returnFocus = document.activeElement;
  enterDesktopButton.disabled = true;
  openingComputer = true;
  enterDesktopButton.textContent = 'Opening…';
  help.hidden = true;
  helpButton.setAttribute('aria-expanded', 'false');
  const bounds = new THREE.Box3().setFromObject(monitorScreen);
  const centre = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const back = camera.position.clone().sub(centre).normalize();
  const position = centre.clone().addScaledVector(back, Math.max(size.x, size.y) * 1.15);
  flyTo(position, centre, 1250, openDesktop);
}

// Everything outside the window is huge and far away. Measuring the scene as a
// whole would drag the room's centre out through the wall and stretch the
// shadow frustum across a hundred metres of empty ground, so the exterior is
// excluded from any bounds used for placing lights.
const EXTERIOR_PREFIXES = ['ExteriorGround', 'ExteriorSky', 'ExteriorGrass', 'ExteriorGarden', 'ExteriorSquareFence', 'ExteriorOxford', 'RadcamOutside', 'RadcamGuard', 'College'];

function hasAncestorNamed(object, prefix) {
  let node = object;
  while (node) {
    if (node.name?.startsWith(prefix)) return true;
    node = node.parent;
  }
  return false;
}

function isExterior(object) {
  return EXTERIOR_PREFIXES.some((prefix) => hasAncestorNamed(object, prefix));
}

function interiorBounds(root) {
  const bounds = new THREE.Box3();
  root.traverse((object) => {
    // Keep the lighting anchor fixed when interior trim is added. In particular,
    // the exterior flood direction must retain the original room center.
    if (object.isMesh && !isExterior(object) && !hasAncestorNamed(object, 'Arch')) {
      bounds.expandByObject(object);
    }
  });
  return bounds.isEmpty() ? new THREE.Box3().setFromObject(root) : bounds;
}

// Framed wall pieces that each get their own picture light.
const FRAMED_PIECES = [
  'PosterFrame',
  'PosterFrameImagination',
  'FaradayPortraitFrame',
  'TopologyWallPrintFrame',
  'OriginQuotePrintFrame',
  'BuildMeasureFrame',
  'OpenSystemsFrame',
];

// Aim the key light using the sun the Blender scene already exports, so the
// web view and the Blender renders agree on where the window is.
function alignKeyToExportedSun(root, roomCenter) {
  const sun = root.getObjectByName('WindowSun');
  if (!sun) return;
  sun.getWorldPosition(keyLight.position);
  keyLight.position.sub(roomCenter).setLength(9).add(roomCenter);
  keyLight.target.position.copy(roomCenter);
  keyLight.target.updateMatrixWorld();
}

// Size the shadow frustum to the room so the map is spent on the room rather
// than on empty space.
function fitShadowCamera(light, box) {
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const shadowCamera = light.shadow.camera;
  const radius = sphere.radius * 1.05;
  shadowCamera.left = -radius;
  shadowCamera.right = radius;
  shadowCamera.top = radius;
  shadowCamera.bottom = -radius;
  shadowCamera.near = 0.5;
  shadowCamera.far = radius * 4;
  shadowCamera.updateProjectionMatrix();
}

// Restrained picture washes on the three personal portraits. These lights stay
// on the interior render layer; exterior lighting is an independent pass.
function addPictureLights(root) {
  ['PosterFrame', 'PosterFrameImagination', 'FaradayPortraitFrame'].forEach((name) => {
    const frame = root.getObjectByName(name);
    if (!frame) return;
    const bounds = new THREE.Box3().setFromObject(frame);
    const center = bounds.getCenter(new THREE.Vector3());
    const lamp = new THREE.SpotLight(
      LOOK.pictureLight.color, LOOK.pictureLight.intensity,
      LOOK.pictureLight.distance, 1.08, 1, 2,
    );
    lamp.position.set(center.x, bounds.max.y + 0.09, center.z - 0.3);
    lamp.target.position.copy(center);
    scene.add(lamp, lamp.target);
  });
}

// Restrained architectural light supports emissive reading-room glazing.
// Exterior lights stay on their own layer, independent of the study.
function addExteriorPracticals(root, roomCenter) {
  const bounds = new THREE.Box3();
  let found = false;
  root.traverse((object) => {
    if (object.isMesh && hasAncestorNamed(object, 'RadcamOutside')) {
      bounds.expandByObject(object);
      found = true;
    }
  });
  if (!found) return;

  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const toRoom = new THREE.Vector3(
    roomCenter.x - center.x,
    0,
    roomCenter.z - center.z,
  );
  if (toRoom.lengthSq() < 1e-6) return;
  toRoom.setLength(size.y * 1.15);

  // Moonlight comes from above and across the facade. Warmth belongs to the
  // reading-room windows, without a frontal spotlight or a pool on the lawn.
  const moon = new THREE.DirectionalLight(0xd1d6df, 3.0);
  moon.position.copy(center).add(new THREE.Vector3(45, 65, 8));
  moon.target.position.copy(center);
  moon.layers.set(1);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.layers.set(1);
  const extent = size.y * 0.8;
  Object.assign(moon.shadow.camera, {
    left: -extent, right: extent, top: extent, bottom: -extent,
    near: 1, far: 140,
  });
  moon.shadow.camera.updateProjectionMatrix();
  moon.shadow.normalBias = 0.025;
  moon.shadow.bias = -0.00008;
  moon.shadow.radius = 3;
  scene.add(moon, moon.target);
  const nightAmbient = new THREE.AmbientLight(0x9cafca, 0.32);
  nightAmbient.layers.set(1);
  scene.add(nightAmbient);

  // Nearby window practicals reveal the stone jambs. Bound the number of
  // realtime lights to the six brightest openings facing the study.
  const panes = [];
  root.traverse((object) => {
    if (!object.isMesh || !/^RadcamOutsideWindowPane_[023]_/.test(object.name)) return;
    const paneCenter = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
    const outward = new THREE.Vector3(paneCenter.x-center.x, 0, paneCenter.z-center.z).normalize();
    if (outward.dot(toRoom.clone().normalize()) < 0.65) return;
    panes.push({ paneCenter, outward, name: object.name });
  });
  panes.sort((a,b) => a.paneCenter.distanceToSquared(roomCenter)-b.paneCenter.distanceToSquared(roomCenter));
  panes.slice(0,6).forEach(({paneCenter,outward}) => {
    const spill = new THREE.PointLight(0xffc47c, 4, 2.4, 2);
    spill.position.copy(paneCenter).addScaledVector(outward, .18);
    spill.layers.set(1);
    scene.add(spill);
  });
}

// glTF does not carry area lights. A continuous concealed strip gives the
// artwork an even warm wash; a dim broad emitter approximates desktop bounce.
// Keep these lights exclusively on the interior render layer.
function addLibraryPracticals(root) {
  RectAreaLightUniformsLib.init();
  const area = (name, color, intensity, width, height, position, target) => {
    const light = new THREE.RectAreaLight(color, intensity, width, height);
    light.name = name;
    light.position.copy(position);
    light.lookAt(target);
    light.layers.set(0);
    scene.add(light);
  };
  const shelf = root.getObjectByName('LibraryWarmStrip');
  if (shelf) {
    const bounds = new THREE.Box3().setFromObject(shelf);
    const center = bounds.getCenter(new THREE.Vector3());
    area('InteriorShelfWash', 0xffc78f, 9.0, bounds.max.x - bounds.min.x, 0.12,
      center.clone().add(new THREE.Vector3(0, -0.065, -0.13)),
      center.clone().add(new THREE.Vector3(0, -0.9, 0.20)));
    // Preserve the warm glow along the wooden lip without the former hot spots.
    for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const glow = new THREE.PointLight(0xffc78f, 0.48, 2.0, 2);
      glow.position.set(THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, t),
        center.y - 0.14, center.z - 0.30);
      glow.layers.set(0);
      scene.add(glow);
    }
  }
  const desk = root.getObjectByName('DeskTop');
  if (desk) {
    const bounds = new THREE.Box3().setFromObject(desk);
    const center = bounds.getCenter(new THREE.Vector3());
    area('InteriorDesktopBounce', 0xffd7af, 0.22, 2.2, 0.55,
      new THREE.Vector3(center.x, bounds.max.y + 0.14, center.z - 0.15),
      new THREE.Vector3(center.x, bounds.max.y + 1.1, center.z + 0.8));
  }
  const riser = root.getObjectByName('MonitorRiser');
  if (riser) {
    const bounds = new THREE.Box3().setFromObject(riser);
    const center = bounds.getCenter(new THREE.Vector3());
    area('InteriorRiserStrip', 0xffc78f, 1.7, (bounds.max.x - bounds.min.x) * 0.86, 0.045,
      new THREE.Vector3(center.x, bounds.min.y - 0.01, bounds.min.z + 0.02),
      new THREE.Vector3(center.x, bounds.min.y - 0.16, bounds.min.z - 0.30));
  }
  const ceiling = root.getObjectByName('ArchCeilingField');
  if (ceiling) {
    const ceilingBounds = new THREE.Box3().setFromObject(ceiling);
    for (const x of [-2.35, 1.65]) {
      const bounce = new THREE.PointLight(0xffc98a, 0.045, 1.7, 2);
      bounce.position.set(x, ceilingBounds.min.y - 0.3, 2.72);
      scene.add(bounce);
    }
  }
}

// Pool of warm light over the desk, plus the cool spill off the monitor.
function addDeskPracticals(root) {
  const desk = root.getObjectByName('DeskTop');
  const shade = root.getObjectByName('DeskLampGlow');
  if (desk && shade) {
    const bounds = new THREE.Box3().setFromObject(desk);
    const center = bounds.getCenter(new THREE.Vector3());
    const spot = new THREE.SpotLight(
      LOOK.deskSpot.color,
      LOOK.deskSpot.intensity,
      6.0,
      LOOK.deskSpot.angle,
      LOOK.deskSpot.penumbra,
      2,
    );
    const shadeBounds = new THREE.Box3().setFromObject(shade);
    const shadeCenter = shadeBounds.getCenter(new THREE.Vector3());
    spot.position.set(shadeCenter.x, shadeBounds.min.y - 0.015, shadeCenter.z);
    spot.target.position.set(shadeCenter.x - 0.3, bounds.max.y, shadeCenter.z - 0.25);
    spot.castShadow = false;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0008;
    spot.shadow.normalBias = 0.02;
    scene.add(spot);
    scene.add(spot.target);
  }

  const moon = root.getObjectByName('HomeLabMoon');
  if (moon) {
    const moonCenter = new THREE.Box3().setFromObject(moon).getCenter(new THREE.Vector3());
    const glow = new THREE.PointLight(0xffc98a, 0.75, 1.9, 2);
    glow.position.copy(moonCenter).add(new THREE.Vector3(0.18, 0.03, 0));
    scene.add(glow);
  }

  if (!monitorScreen) return;
  const screenBounds = new THREE.Box3().setFromObject(monitorScreen);
  const screenCenter = screenBounds.getCenter(new THREE.Vector3());
  const toRoom = new THREE.Vector3();
  camera.getWorldDirection(toRoom);
  const glow = new THREE.PointLight(
    LOOK.screen.color,
    LOOK.screen.glowIntensity,
    LOOK.screen.glowDistance,
    2,
  );
  glow.position.copy(screenCenter).addScaledVector(toRoom, -0.45);
  scene.add(glow);
}

new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
  roomUrl,
  (gltf) => {
    roomModel = gltf.scene;
    roomModel.traverse((object) => {
      if (object.isLight) {
        object.visible = false;
      }
      if (object.isMesh) {
        // Thin window glazing must composite the already-rendered exterior;
        // screen-space transmission cannot sample a different render layer.
        if (object.name === 'WindowGlass') {
          object.material = new THREE.MeshBasicMaterial({
            color: 0xbfd3e1, transparent: true, opacity: 0.025,
            depthWrite: false, side: THREE.DoubleSide,
          });
          object.castShadow = false;
        }
        const exterior = isExterior(object);
        object.castShadow = !object.name.startsWith('ExteriorSky')
          && object.name !== 'WindowGlass' && object.name !== 'OakTreeArt';
        object.receiveShadow = !object.name.startsWith('ExteriorSky');
        if (exterior) {
          object.layers.set(1);
          // Keep the lawn nocturnal beneath the broad moonlight. Clone only
          // these outdoor materials so indoor plants retain their finish.
          if (object.name.startsWith('ExteriorGround') || object.name.startsWith('ExteriorGrass')) {
            const shadeLawn = (material) => {
              const copy = material.clone();
              copy.color.multiplyScalar(0.38);
              return copy;
            };
            object.material = Array.isArray(object.material)
              ? object.material.map(shadeLawn) : shadeLawn(object.material);
          }
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            material.envMapIntensity = 0.3;
            // Blender's procedural stone bump is not a tangent-space normal
            // texture; retain the CAD normals for the architectural lighting.
            if (/^RadcamStone/.test(material.name)) material.normalMap = null;
            if (material.name === 'ExteriorSkyMat') material.emissiveIntensity = 3;
          });
        }
      }
    });
    scene.add(roomModel);
    useExportedCamera(roomModel);
    camera.layers.enable(1);
    rememberHome();
    monitorScreen = findMonitorScreen(roomModel);
    if (monitorScreen?.material) {
      monitorBaseMaterial = monitorScreen.material;
      monitorScreen.material = monitorBaseMaterial.clone();
      // The screen is the focal point, so it stays lit rather than only
      // glowing on hover.
      monitorScreen.material.emissiveIntensity = LOOK.screen.emissive;
      monitorScreen.castShadow = false;
    }

    const roomBounds = interiorBounds(roomModel);
    const roomCenter = roomBounds.getCenter(new THREE.Vector3());
    alignKeyToExportedSun(roomModel, roomCenter);
    fitShadowCamera(keyLight, roomBounds);
    addPictureLights(roomModel);
    addDeskPracticals(roomModel);
    addLibraryPracticals(roomModel);
    addExteriorPracticals(roomModel, roomCenter);
    if (roomModel.getObjectByName('ArchLeftWallCornice')) {
      for (const z of [-1.84, 0.05, 1.94]) {
        const wash = new THREE.PointLight(0xffc58a, 0.85, 2.5, 2);
        wash.position.set(3.58, 2.67, z);
        scene.add(wash);
      }
    }
    if (roomModel.getObjectByName('ArchOdysseusPlinth')) {
      const sculptureCenter = new THREE.Box3()
        .setFromObject(roomModel.getObjectByName('ArchOdysseusPlinth'))
        .getCenter(new THREE.Vector3());
      const sculptureLight = new THREE.SpotLight(0xffdfb0, 3, 3.8, 0.45, 0.65, 2);
      sculptureLight.position.set(sculptureCenter.x + 0.56, 2.73, sculptureCenter.z - 0.01);
      sculptureLight.target.position.set(sculptureCenter.x, 1.55, sculptureCenter.z);
      sculptureLight.castShadow = true;
      sculptureLight.shadow.mapSize.set(1024, 1024);
      sculptureLight.shadow.camera.near = 0.15;
      sculptureLight.shadow.camera.far = 3.8;
      sculptureLight.shadow.bias = -0.0001;
      sculptureLight.shadow.normalBias = 0.005;
      scene.add(sculptureLight, sculptureLight.target);
      const shelfWash = new THREE.PointLight(0xffc78c, 0.55, 2.3, 2);
      shelfWash.position.set(-3.46, 2.80, -0.88);
      scene.add(shelfWash);
    }

    const geometryBudget = batchStaticRoom(roomModel, isExterior);
    if (import.meta.env.DEV) console.info(`Static room meshes: ${geometryBudget.before} -> ${geometryBudget.after}`);
    renderer.shadowMap.needsUpdate = true;
    roomReady = true;
    controls.enabled = true;
    canvas.setAttribute('aria-busy', 'false');
    document.querySelectorAll('.room-controls button, #enter-desktop').forEach((button) => { button.disabled = false; });
    progress.value = 100;
    loading.classList.add('loaded');
    document.body.classList.add('room-ready');
    setDragMode(dragMode);
    status.textContent = 'The room is ready. Explore the room, or open the computer.';
    invalidate();
  },
  (event) => {
    if (event.lengthComputable && event.total) {
      const percent = Math.min(99, Math.round(event.loaded / event.total * 100));
      progress.value = percent;
      loadingMessage.textContent = percent === 99 ? 'Adding the finishing touches…' : `Preparing your view · ${percent}%`;
    }
  },
  (err) => {
    console.error('GLB load/callback failed:', err);
    canvas.setAttribute('aria-busy', 'false');
    loadingMessage.textContent = 'The room couldn’t load. Try again, or read my profile below.';
    progress.hidden = true;
    document.querySelector('#retry-room').hidden = false;
  },
);

function setDragMode(mode) {
  if (mode === 'follow' && (coarsePointer.matches || reducedMotion.matches)) mode = 'look';
  if (dragMode === 'follow' && mode !== 'follow') cursorGoal.set(0, 0);
  dragMode = mode;
  controls.enableRotate = mode !== 'follow';
  controls.enablePan = mode !== 'follow';
  controls.mouseButtons.LEFT = mode === 'follow' ? null : mode === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
  controls.touches.ONE = mode === 'pan' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  for (const name of ['follow', 'look', 'pan']) {
    document.querySelector(`#mode-${name}`).setAttribute('aria-pressed', String(mode === name));
  }
  document.querySelector('#mode-follow').hidden = coarsePointer.matches;
  document.querySelector('#mode-follow').disabled = !roomReady || reducedMotion.matches;
  document.body.classList.toggle('cursor-follow', mode === 'follow');
  hint.textContent = mode === 'follow' ? 'Move toward the edges to explore the room · Scroll to zoom'
    : `${mode === 'pan' ? 'Drag to pan' : 'Drag to look'} · ${coarsePointer.matches ? 'Pinch' : 'Scroll'} to zoom`;
  status.textContent = mode === 'follow' ? 'The view gently follows your cursor.'
    : mode === 'pan' ? 'Pan mode. Drag to move across the room.' : 'Look mode. Drag to look around.';
  invalidate();
}

function queueZoom(delta, deltaMode = 0) {
  if (!roomReady || !controls.enabled || flight) return;
  const distance = zoomGoal ?? camera.position.distanceTo(controls.target);
  zoomGoal = zoomDistance(distance, delta, deltaMode, controls.minDistance, controls.maxDistance);
  setMonitorHover(false);
  invalidate();
}

canvas.addEventListener('pointerdown', (event) => {
  if (!controls.enabled) return;
  canvas.focus({ preventScroll: true });
  if (!activePointers.size) {
    pointerTravel = 0;
    multiTouchGesture = false;
    dragOrigin = { x: event.clientX, y: event.clientY };
    pointerDownHit = event.button === 0 && updateMonitorHit(event);
  }
  pendingPan.set(0, 0, 0);
  activePointers.add(event.pointerId);
  if (activePointers.size > 1) multiTouchGesture = true;
  zoomGoal = null;
}, { capture: true });
canvas.addEventListener('pointermove', (event) => {
  lastHoverPointer = { clientX: event.clientX, clientY: event.clientY };
  if (dragMode === 'follow' && controls.enabled && !reducedMotion.matches && event.pointerType !== 'touch') {
    const rect = canvas.getBoundingClientRect();
    cursorGoal.set(
      THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(1 - (event.clientY - rect.top) / rect.height * 2, -1, 1),
    );
  }
  if (dragOrigin) pointerTravel = Math.max(pointerTravel,
    Math.hypot(event.clientX - dragOrigin.x, event.clientY - dragOrigin.y));
  if (activePointers.size) setMonitorHover(false);
  else updateMonitorHit(event);
});
function releasePointer(event) {
  activePointers.delete(event.pointerId);
  if (!activePointers.size) dragOrigin = null;
}
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', (event) => { pointerDownHit = false; releasePointer(event); });
canvas.addEventListener('pointerleave', () => { lastHoverPointer = null; setMonitorHover(false); cursorGoal.set(0, 0); });
canvas.addEventListener('click', (event) => {
  if (!multiTouchGesture && pointerDownHit && pointerTravel <= 7 && updateMonitorHit(event)) focusMonitor();
  pointerDownHit = false;
});
canvas.addEventListener('wheel', (event) => {
  if (!controls.enabled || flight) return;
  event.preventDefault();
  // Keep Shift + trackpad scrolling consistent with the visible Pan tool.
  if (event.shiftKey) {
    event.stopImmediatePropagation();
    const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
    panView(-Math.max(-80, Math.min(80, (event.deltaX || event.deltaY) * units)) * 0.002, 0);
    return;
  }
  event.stopImmediatePropagation();
  queueZoom(event.deltaY, event.deltaMode);
}, { capture: true, passive: false });

function panView(x, y) {
  if (!roomReady || !controls.enabled || flight) return;
  if (dragMode === 'follow') setDragMode('pan');
  const movement = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0).multiplyScalar(x)
    .addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1), y);
  pendingPan.add(movement);
  invalidate();
}

enterDesktopButton.addEventListener('click', focusMonitor);
document.querySelector('#close-computer').addEventListener('click', closeDesktop);
document.querySelector('#mode-follow').addEventListener('click', () => setDragMode('follow'));
document.querySelector('#mode-look').addEventListener('click', () => setDragMode('look'));
document.querySelector('#mode-pan').addEventListener('click', () => setDragMode('pan'));
document.querySelector('#zoom-in').addEventListener('click', () => queueZoom(-120));
document.querySelector('#zoom-out').addEventListener('click', () => queueZoom(120));
document.querySelector('#reset-view').addEventListener('click', () => goHome());
document.querySelector('#retry-room').addEventListener('click', () => location.reload());
helpButton.addEventListener('click', () => {
  help.hidden = !help.hidden;
  helpButton.setAttribute('aria-expanded', String(!help.hidden));
});
coarsePointer.addEventListener('change', () => setDragMode(dragMode));
setDragMode('follow');

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (desktop.classList.contains('visible') || openingComputer) closeDesktop();
    else if (!help.hidden) { help.hidden = true; helpButton.setAttribute('aria-expanded', 'false'); helpButton.focus(); }
    else goHome();
    event.preventDefault();
    return;
  }
  if (desktop.classList.contains('visible')) {
    if (event.key === 'Tab') {
      const items = [...desktop.querySelectorAll('button, a[href], summary, [tabindex="0"]')].filter((el) => el.getClientRects().length && !el.disabled);
      const first = items[0], last = items.at(-1);
      if (!desktop.contains(document.activeElement)) { (event.shiftKey ? last : first).focus(); event.preventDefault(); }
      else if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
    }
    return;
  }
  if (!roomReady || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  const key = event.key.toLowerCase();
  if (key === 'r') { goHome(); event.preventDefault(); }
  if (key === '+' || key === '=') { queueZoom(-100); event.preventDefault(); }
  if (key === '-') { queueZoom(100); event.preventDefault(); }
  if (event.target === canvas) {
    const pan = { ArrowLeft: [-0.055, 0], ArrowRight: [0.055, 0], ArrowUp: [0, 0.055], ArrowDown: [0, -0.055] }[event.key];
    if (pan) { panView(...pan); event.preventDefault(); }
    if (event.key === 'Enter') { focusMonitor(); event.preventDefault(); }
  }
});

reducedMotion.addEventListener('change', () => {
  controls.enableDamping = !reducedMotion.matches;
  if (reducedMotion.matches && flight) flight.duration = 1;
  if (reducedMotion.matches && dragMode === 'follow') setDragMode('look');
  else setDragMode(dragMode);
  invalidate();
});
document.addEventListener('visibilitychange', () => { lastFrameTime = performance.now(); invalidate(); });

// Shared section navigation: both the header and contextual portfolio links.
function showPortfolioSection(id, focusPanel = false) {
  const panel = document.getElementById(id);
  if (!panel || !panel.classList.contains('portfolio-panel')) return;
  desktop.querySelectorAll('.portfolio-panel').forEach(el => el.classList.toggle('hidden', el !== panel));
  panel.scrollTop = 0;
  dockItems.forEach(item => {
    const active = item.dataset.window === id;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  if (focusPanel) panel.focus({ preventScroll: true });
}
dockItems.forEach(item => item.addEventListener('click', () => showPortfolioSection(item.dataset.window)));
desktop.addEventListener('click', event => {
  const link = event.target.closest('a[data-section]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  showPortfolioSection(`portfolio-${link.dataset.section}`, true);
});

function animate(now = performance.now()) {
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  if (document.hidden) { requestAnimationFrame(animate); return; }
  setSize();
  if (flight) advanceFlight(now);
  if (!flight && roomReady && !desktop.classList.contains('visible')) {
    if (zoomGoal !== null) {
      const offset = camera.position.clone().sub(controls.target);
      const distance = reducedMotion.matches ? zoomGoal
        : THREE.MathUtils.lerp(offset.length(), zoomGoal, responseAt(8, dt));
      const arrived = Math.abs(distance - zoomGoal) < 0.002;
      camera.position.copy(controls.target).add(offset.setLength(arrived ? zoomGoal : distance));
      if (arrived) zoomGoal = null;
      invalidate();
    }
    if (pendingPan.lengthSq() > 0.0000001) {
      const step = pendingPan.clone().multiplyScalar(reducedMotion.matches ? 1 : responseAt(10, dt));
      camera.position.add(step);
      controls.target.add(step);
      pendingPan.sub(step);
      invalidate();
    }
    controls.dampingFactor = responseAt(7, dt);
    controls.update();
    if (homePose) {
      // Room-scale pans, with the eye kept inside the walls and above the floor.
      const delta = controls.target.clone().sub(homePose.target);
      const bounded = delta.clone().clamp(
        new THREE.Vector3(-1.8, -0.85, -1.8), new THREE.Vector3(1.8, 0.85, 1.8));
      const correction = bounded.sub(delta);
      controls.target.add(correction);
      camera.position.add(correction);
      const eyeCorrection = camera.position.clone().clamp(
        new THREE.Vector3(-3.55, 0.45, -2.65), new THREE.Vector3(3.55, 3.35, 2.65),
      ).sub(camera.position);
      camera.position.add(eyeCorrection);
      controls.target.add(eyeCorrection);
      if (correction.lengthSq() + eyeCorrection.lengthSq() > 0) invalidate();
    }
  }
  if (!flight && !desktop.classList.contains('visible')
    && (cursorOffset.distanceToSquared(cursorGoal) > 0 || cursorVelocity.lengthSq() > 0)) {
    for (const axis of ['x', 'y']) {
      const next = dampAxis(cursorOffset[axis], cursorVelocity[axis], cursorGoal[axis], dt);
      cursorOffset[axis] = reducedMotion.matches ? cursorGoal[axis] : next.value;
      cursorVelocity[axis] = reducedMotion.matches ? 0 : next.velocity;
    }
    if (cursorOffset.distanceToSquared(cursorGoal) < 0.0000001 && cursorVelocity.lengthSq() < 0.000001) {
      cursorOffset.copy(cursorGoal);
      cursorVelocity.set(0, 0);
    }
    invalidate();
  }
  // A stationary pointer can enter/leave the screen while the room is easing.
  // Hit-test the displayed pose each frame, not just pointermove events.
  if (lastHoverPointer && controls.enabled && !flight && !activePointers.size) {
    updateMonitorHit(lastHoverPointer);
  }
  if (monitorScreen?.material) {
    const wanted = LOOK.screen.emissive * (isHoveringMonitor ? 1.6 : 1);
    const material = monitorScreen.material;
    if (Math.abs(material.emissiveIntensity - wanted) > 0.001) {
      material.emissiveIntensity = reducedMotion.matches ? wanted
        : THREE.MathUtils.lerp(material.emissiveIntensity, wanted, responseAt(10, dt));
      invalidate();
    }
  }
  // Render only when something visible changes; a quiet room or open computer
  // should not keep submitting millions of triangles to the GPU.
  if (needsRender && !desktop.classList.contains('visible')) {
    const savedLayers = camera.layers.mask;
    withCursorView(() => {
      renderer.clear(true, true, true);
      camera.layers.set(1);
      renderer.render(scene, camera);
      camera.layers.set(0);
      renderer.render(scene, camera);
    });
    camera.layers.mask = savedLayers;
    if (roomReady) renderer.shadowMap.autoUpdate = false;
    needsRender = false;
  }
  requestAnimationFrame(animate);
}

animate();

canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  roomReady=false; controls.enabled=false;
  loading.classList.remove('loaded');
  loadingMessage.textContent='The room paused. Reload it, or read my profile below.';
  progress.hidden=true; document.querySelector('#retry-room').hidden=false;
});
