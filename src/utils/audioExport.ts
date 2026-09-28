import { ScriptSegment, formatSrtTime } from '../data/scriptData';

export interface GeneratedClip {
  segmentId: string;
  wavBase64: string;
  blobUrl: string;
  durationSeconds: number;
  sampleRate: number;
  voiceName: string;
  generatedAt: number;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function extractPcmFromWav(wavBytes: Uint8Array): Uint8Array {
  if (
    wavBytes.length > 44 &&
    wavBytes[0] === 0x52 && // 'R'
    wavBytes[1] === 0x49 && // 'I'
    wavBytes[2] === 0x46 && // 'F'
    wavBytes[3] === 0x46 // 'F'
  ) {
    return wavBytes.subarray(44);
  }
  return wavBytes;
}

function createWavHeader(
  dataLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(header);
}

export function createBlobUrlFromWavBase64(wavBase64: string): string {
  const bytes = base64ToUint8Array(wavBase64);
  const blob = new Blob([bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Stitches all generated segments sequentially with a subtle pause between clips.
 */
export function buildContinuousMasterWav(
  segments: ScriptSegment[],
  clips: Record<string, GeneratedClip>,
  gapSeconds = 0.25,
  sampleRate = 24000
): { blob: Blob; totalDurationSeconds: number; includedCount: number } {
  const orderedClips = segments
    .map((seg) => clips[seg.id])
    .filter((c): c is GeneratedClip => Boolean(c));

  const bytesPerSecond = sampleRate * 2; // 16-bit mono = 2 bytes per sample
  // Ensure gap is aligned to 2-byte sample boundary
  const gapBytesCount = Math.floor((gapSeconds * sampleRate)) * 2;

  const pcmChunks: Uint8Array[] = [];
  let totalPcmLength = 0;

  orderedClips.forEach((clip, idx) => {
    const wavBytes = base64ToUint8Array(clip.wavBase64);
    const pcm = extractPcmFromWav(wavBytes);
    pcmChunks.push(pcm);
    totalPcmLength += pcm.length;

    if (idx < orderedClips.length - 1 && gapBytesCount > 0) {
      const silence = new Uint8Array(gapBytesCount);
      pcmChunks.push(silence);
      totalPcmLength += silence.length;
    }
  });

  const header = createWavHeader(totalPcmLength, sampleRate, 1, 16);
  const combined = new Uint8Array(44 + totalPcmLength);
  combined.set(header, 0);

  let offset = 44;
  for (const chunk of pcmChunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    blob: new Blob([combined], { type: 'audio/wav' }),
    totalDurationSeconds: Number((totalPcmLength / bytesPerSecond).toFixed(2)),
    includedCount: orderedClips.length,
  };
}

/**
 * Places each generated segment at its exact video timestamp start (or immediately after the previous clip if slightly longer)
 * so the resulting WAV file aligns directly with the 26:48 video timeline.
 */
export function buildTimelineSyncedMasterWav(
  segments: ScriptSegment[],
  clips: Record<string, GeneratedClip>,
  sampleRate = 24000
): { blob: Blob; totalDurationSeconds: number; includedCount: number } {
  const bytesPerSample = 2;
  const bytesPerSecond = sampleRate * bytesPerSample;

  const decodedItems: {
    startSample: number;
    pcm: Uint8Array;
  }[] = [];

  let maxEndByte = 1608 * bytesPerSecond; // 26:48 = 1608s minimum
  let cursorByte = 0;

  for (const seg of segments) {
    const clip = clips[seg.id];
    if (!clip) continue;

    const wavBytes = base64ToUint8Array(clip.wavBase64);
    const pcm = extractPcmFromWav(wavBytes);

    const targetStartByte = Math.floor(seg.startSeconds * sampleRate) * bytesPerSample;
    const actualStartByte = Math.max(targetStartByte, cursorByte);

    decodedItems.push({
      startSample: actualStartByte,
      pcm,
    });

    cursorByte = actualStartByte + pcm.length;
    if (cursorByte > maxEndByte) {
      maxEndByte = cursorByte;
    }
  }

  const header = createWavHeader(maxEndByte, sampleRate, 1, 16);
  const masterBuffer = new Uint8Array(44 + maxEndByte);
  masterBuffer.set(header, 0);

  for (const item of decodedItems) {
    masterBuffer.set(item.pcm, 44 + item.startSample);
  }

  return {
    blob: new Blob([masterBuffer], { type: 'audio/wav' }),
    totalDurationSeconds: Number((maxEndByte / bytesPerSecond).toFixed(2)),
    includedCount: decodedItems.length,
  };
}

export function buildSrtContent(
  segments: ScriptSegment[],
  clips: Record<string, GeneratedClip>
): string {
  return segments
    .map((seg, idx) => {
      const clip = clips[seg.id];
      const startSec = seg.startSeconds;
      const endSec = clip
        ? Math.min(seg.endSeconds, seg.startSeconds + clip.durationSeconds)
        : seg.endSeconds;
      const cleanText = seg.text.replace(/\[.*?\]/g, '').trim();
      return `${idx + 1}\n${formatSrtTime(startSec)} --> ${formatSrtTime(endSec)}\n${cleanText}\n`;
    })
    .join('\n');
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
