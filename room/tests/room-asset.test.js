import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { readRoomAsset } from '../src/room-asset.js';
const original = new TextEncoder().encode('glTF room with unchanged geometry and textures');

test('compressed download round trips exactly and reports transferred bytes', async () => {
  const compressed = gzipSync(original), updates = [];
  const result = await readRoomAsset('/room.glb', '/room.gz', e => updates.push(e), {
    fetchAsset: async url => {
      assert.equal(url, '/room.gz');
      return new Response(compressed, { headers: { 'content-length': String(compressed.length) } });
    },
  });
  assert.deepEqual(new Uint8Array(result), original);
  assert.equal(updates.at(-1).loaded, compressed.length);
  assert.equal(updates.at(-1).total, compressed.length);
});

test('older browsers request the raw asset only', async () => {
  const result = await readRoomAsset('/room.glb', '/room.gz', undefined, {
    Decompress: null,
    fetchAsset: async url => { assert.equal(url, '/room.glb'); return new Response(original); },
  });
  assert.deepEqual(new Uint8Array(result), original);
});

test('HTTP-decoded gzip is not decompressed twice', async () => {
  const result = await readRoomAsset('/raw', '/gzip', undefined, {
    fetchAsset: async () => new Response(original, { headers: { 'content-encoding': 'gzip' } }),
  });
  assert.deepEqual(new Uint8Array(result), original);
});

test('failed downloads and corrupt compressed data reach the recovery UI', async () => {
  await assert.rejects(readRoomAsset('/raw', '/gzip', undefined, {
    fetchAsset: async () => new Response(null, { status: 404 }),
  }), /404/);
  await assert.rejects(readRoomAsset('/raw', '/gzip', undefined, {
    fetchAsset: async () => new Response(new Uint8Array([0x1f, 0x8b, 0])),
  }));
});
