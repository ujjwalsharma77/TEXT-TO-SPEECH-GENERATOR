import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function ensureWavBuffer(
  rawBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): { wavBuffer: Buffer; durationSeconds: number } {
  if (rawBuffer.length >= 44 && rawBuffer.toString('ascii', 0, 4) === 'RIFF') {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const pcmBytes = Math.max(0, rawBuffer.length - 44);
    return {
      wavBuffer: rawBuffer,
      durationSeconds: Number((pcmBytes / byteRate).toFixed(2)),
    };
  }

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return {
    wavBuffer: Buffer.concat([header, rawBuffer]),
    durationSeconds: Number((dataSize / byteRate).toFixed(2)),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.post('/api/tts', async (req, res) => {
    try {
      const {
        text,
        voiceName = 'Puck',
        style = 'Engaging, natural YouTube Manhwa storyteller with clear pacing and expressive emotion',
        model = 'gemini-3.8-flash-lite-tts',
      } = req.body;

      if (!text || typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'Narration text is required.' });
        return;
      }

      // Clean out any bracketed pause notes like [00:23–00:25 — brief pause] before sending to TTS
      const cleanedText = text
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const selectedModel =
        model === 'gemini-3.8-flash-tts'
          ? 'gemini-3.8-flash-tts'
          : 'gemini-3.8-flash-lite-tts';

      const partPayload: Record<string, unknown> = {
        text: cleanedText,
      };
      if (style && typeof style === 'string' && style.trim()) {
        partPayload.speechMetadata = {
          style: style.trim(),
        };
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          {
            role: 'user',
            parts: [partPayload as { text: string }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      });

      const inlineData =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;

      if (!base64Audio) {
        res.status(500).json({
          error: 'No audio data returned by the Gemini TTS model.',
        });
        return;
      }

      const mimeType = inlineData?.mimeType || 'audio/pcm;rate=24000';
      const rateMatch = mimeType.match(/rate=(\d+)/i);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

      const rawBuffer = Buffer.from(base64Audio, 'base64');
      const { wavBuffer, durationSeconds } = ensureWavBuffer(
        rawBuffer,
        sampleRate,
        1,
        16
      );

      res.json({
        audioWavBase64: wavBuffer.toString('base64'),
        durationSeconds,
        sampleRate,
      });
    } catch (error: unknown) {
      console.error('TTS Generation Error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate speech audio.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Manhwa Vox Studio server listening on port ${PORT}`);
  });
}

startServer();
