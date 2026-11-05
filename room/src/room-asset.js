// Decompress with the browser's native stream implementation. No geometry,
// texture or material changes, and no JavaScript decompression dependency.
export async function readRoomAsset(rawUrl, compressedUrl, onProgress = () => {}, {
  fetchAsset = fetch, Decompress = globalThis.DecompressionStream,
} = {}) {
  const response = await fetchAsset(Decompress ? compressedUrl : rawUrl);
  if (!response.ok) throw new Error(`Room download failed (${response.status})`);
  const total = Number(response.headers.get('content-length')) || 0;
  let loaded = 0;
  const body = response.body?.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      loaded += chunk.byteLength;
      onProgress({ loaded, total, lengthComputable: total > 0 });
      controller.enqueue(chunk);
    },
  }));
  const bytes = body ? await new Response(body).arrayBuffer() : await response.arrayBuffer();
  const header = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  // Some hosts already decode gzip via Content-Encoding. Detect bytes rather
  // than decompressing twice, so this works on Pages and other static hosts.
  if (Decompress && header[0] === 0x1f && header[1] === 0x8b) {
    return new Response(new Blob([bytes]).stream().pipeThrough(new Decompress('gzip'))).arrayBuffer();
  }
  return bytes;
}
