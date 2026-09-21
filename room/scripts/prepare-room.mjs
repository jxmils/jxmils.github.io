import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, weld, reorder, quantize, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readFile, writeFile, mkdir, open, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
const source = new URL('../public/models/room.glb', import.meta.url);
const output = new URL('../src/assets/room.glb', import.meta.url);
const receipt = new URL('../src/assets/room-build.json', import.meta.url);
// Bound reads as well as writes: large reads can stall on removable NTFS volumes.
async function readInChunks(path) {
  const file = await open(path, 'r');
  try {
    const buffer = Buffer.alloc((await file.stat()).size);
    let offset = 0;
    while (offset < buffer.length) {
      const {bytesRead} = await file.read(buffer, offset, Math.min(4 * 1024 * 1024, buffer.length - offset), offset);
      if (!bytesRead) throw new Error('Unexpected end of room asset');
      offset += bytesRead;
    }
    return buffer;
  } finally { await file.close(); }
}
const input = await readInChunks(source);
const sha256 = createHash('sha256').update(input).digest('hex');
try {
  const previous=JSON.parse(await readFile(receipt));
  if(previous.version===3 && previous.sourceHash===sha256 && (await stat(output)).size===previous.bytes){console.log('Room asset is up to date.');process.exit(0);}
} catch {}
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc = await io.readBinary(input);
const names=doc.getRoot().listNodes().map(n=>n.getName()).sort();
await doc.transform(weld(),dedup({propertyTypes:[PropertyType.ACCESSOR,PropertyType.MESH,PropertyType.TEXTURE]}),reorder({encoder:MeshoptEncoder}),quantize({quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16,cleanup:false}),prune({propertyTypes:[PropertyType.ACCESSOR]}),textureCompress({encoder:sharp,targetFormat:'webp',quality:95}));
// No simplification, node joining or pruning. 16-bit positions retain fine
// per-mesh detail; named interaction hooks and camera nodes stay intact.
doc.createExtension(EXTMeshoptCompression).setRequired(true);
const binary=await io.writeBinary(doc);
const verified=await io.readBinary(binary);
if(JSON.stringify(names)!==JSON.stringify(verified.getRoot().listNodes().map(n=>n.getName()).sort()))throw new Error('Room node names changed');
await mkdir(new URL('../src/assets/',import.meta.url),{recursive:true});
const tempDirectory=await mkdtemp(join(tmpdir(),'portfolio-room-'));
try {
  const temporary=join(tempDirectory,'room.glb');
  await writeFile(temporary,binary);
  // Bulk writes avoid small-write stalls on removable project volumes.
  execFileSync('/usr/bin/python3',['-c',"import sys,shutil,os; s,d=sys.argv[1:]; f=open(s,'rb'); g=open(d+'.tmp','wb'); shutil.copyfileobj(f,g,16*1024*1024); g.close(); f.close(); os.replace(d+'.tmp',d)",temporary,fileURLToPath(output)]);
} finally { await rm(tempDirectory,{recursive:true,force:true}); }
await writeFile(receipt,JSON.stringify({version:3,sourceHash:sha256,sourceBytes:input.length,bytes:binary.length,nodeCount:names.length},null,2)+'\n');
console.log(`Room: ${(input.length/1e6).toFixed(1)} MB → ${(binary.length/1e6).toFixed(1)} MB; ${names.length} named nodes preserved.`);
