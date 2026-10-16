// wav.ts — 24-bit stereo PCM WAV writer and a small reader (16/24-bit PCM, 32-bit float) for analysis.

import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {BIT_DEPTH, CHANNELS, SR} from './constants';
import type {Stereo} from './space';

const FULL_SCALE_24 = 8_388_607; // 2^23 - 1
const BYTES_PER_SAMPLE = BIT_DEPTH / 8;
const HEADER_BYTES = 44;
const PCM_FORMAT = 1;
const FLOAT_FORMAT = 3;
const EXTENSIBLE_FORMAT = 0xfffe;

/** Encode to 24-bit stereo WAV bytes. Exact zeros stay exact zeros (digital silence is preserved). */
export function encodeWav24(s: Stereo): Buffer {
  if (s.left.length !== s.right.length) throw new Error('encodeWav24: channel lengths differ');
  const frames = s.left.length;
  const dataBytes = frames * CHANNELS * BYTES_PER_SAMPLE;
  const buf = Buffer.alloc(HEADER_BYTES + dataBytes);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(PCM_FORMAT, 20);
  buf.writeUInt16LE(CHANNELS, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * CHANNELS * BYTES_PER_SAMPLE, 28);
  buf.writeUInt16LE(CHANNELS * BYTES_PER_SAMPLE, 32);
  buf.writeUInt16LE(BIT_DEPTH, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  let offset = HEADER_BYTES;
  for (let i = 0; i < frames; i++) {
    for (const ch of [s.left, s.right]) {
      const v = Math.max(-1, Math.min(1, ch[i] ?? 0));
      buf.writeIntLE(Math.round(v * FULL_SCALE_24), offset, BYTES_PER_SAMPLE);
      offset += BYTES_PER_SAMPLE;
    }
  }
  return buf;
}

export function writeWav24(path: string, s: Stereo): void {
  try {
    mkdirSync(dirname(path), {recursive: true});
    writeFileSync(path, encodeWav24(s));
  } catch (error) {
    throw new Error(`Could not write WAV to ${path}: ${(error as Error).message}`);
  }
}

export type DecodedWav = {readonly sampleRate: number; readonly channels: number; readonly bits: number; readonly stereo: Stereo};

function findChunk(buf: Buffer, id: string): {start: number; size: number} {
  let pos = 12;
  while (pos + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (chunkId === id) return {start: pos + 8, size};
    pos += 8 + size + (size % 2);
  }
  throw new Error(`WAV chunk '${id}' not found`);
}

function readSample(buf: Buffer, at: number, bits: number, isFloat: boolean): number {
  if (isFloat) return buf.readFloatLE(at);
  if (bits === 16) return buf.readInt16LE(at) / 32768;
  if (bits === 24) return buf.readIntLE(at, 3) / 8388608;
  if (bits === 32) return buf.readInt32LE(at) / 2147483648;
  throw new Error(`Unsupported bit depth ${bits}`);
}

export function readWav(path: string): DecodedWav {
  const buf = readFileSync(path);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`${path} is not a WAV file`);
  const fmt = findChunk(buf, 'fmt ');
  const format = buf.readUInt16LE(fmt.start);
  const channels = buf.readUInt16LE(fmt.start + 2);
  const sampleRate = buf.readUInt32LE(fmt.start + 4);
  const bits = buf.readUInt16LE(fmt.start + 14);
  const isFloat = format === FLOAT_FORMAT || (format === EXTENSIBLE_FORMAT && bits === 32 && buf.readUInt16LE(fmt.start + 24) === FLOAT_FORMAT);
  const data = findChunk(buf, 'data');
  const bytes = bits / 8;
  const frames = Math.floor(data.size / (bytes * channels));
  const left = new Float64Array(frames);
  const right = new Float64Array(frames);
  for (let i = 0; i < frames; i++) {
    const base = data.start + i * bytes * channels;
    left[i] = readSample(buf, base, bits, isFloat);
    right[i] = channels > 1 ? readSample(buf, base + bytes, bits, isFloat) : (left[i] ?? 0);
  }
  return {sampleRate, channels, bits, stereo: {left, right}};
}
