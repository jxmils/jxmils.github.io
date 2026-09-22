import { Matrix4, Frustum, Vector3, Vector4 } from 'three';
const matrix = new Matrix4(), frustum = new Frustum(), point = new Vector4();
const corner = new Vector3();
// Conservative screen-space bounds: leave a small border for glass and AA.
// A near-plane crossing falls back to the full viewport rather than clipping sky.
export function windowScissor(box, camera, width, height) {
  if (!box) return { x: 0, y: 0, width, height };
  matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(matrix);
  if (!frustum.intersectsBox(box)) return null;
  let left = 1, right = -1, bottom = 1, top = -1;
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
    point.set(corner.x, corner.y, corner.z, 1).applyMatrix4(matrix);
    if (point.w <= camera.near) return { x: 0, y: 0, width, height };
    left = Math.min(left, point.x / point.w); right = Math.max(right, point.x / point.w);
    bottom = Math.min(bottom, point.y / point.w); top = Math.max(top, point.y / point.w);
  }
  const x = Math.max(0, Math.floor((left + 1) * width / 2) - 2);
  const y = Math.max(0, Math.floor((bottom + 1) * height / 2) - 2);
  const xmax = Math.min(width, Math.ceil((right + 1) * width / 2) + 2);
  const ymax = Math.min(height, Math.ceil((top + 1) * height / 2) + 2);
  return xmax > x && ymax > y ? { x, y, width: xmax - x, height: ymax - y } : null;
}
