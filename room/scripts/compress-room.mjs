import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';

// GitHub Pages does not reliably apply HTTP compression to GLB files.
// Ship a lossless gzip copy; keep the original for older browsers.
const source = await readFile(new URL('../src/assets/room.glb', import.meta.url));
const compressed = gzipSync(source, { level: 9 });
if (!gunzipSync(compressed).equals(source)) throw new Error('Room compression round-trip failed');
await writeFile(new URL('../src/assets/room.glb.gz', import.meta.url), compressed);
console.log(`Room download: ${source.length} → ${compressed.length} bytes (lossless).`);
