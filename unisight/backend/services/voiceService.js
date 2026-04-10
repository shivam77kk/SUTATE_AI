// services/voiceService.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

/**
 * Converts text to speech using ElevenLabs API.
 * Returns a base64 data URL of the mp3 audio.
 */
export async function textToSpeech(text) {
  if (!ELEVENLABS_API_KEY) {
    console.warn('[Voice] ELEVENLABS_API_KEY not set — skipping TTS');
    return null;
  }

  // Trim text to 500 chars max to save ElevenLabs quota during demo
  const trimmedText = text.length > 500
    ? text.substring(0, 497) + '...'
    : text;

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: trimmedText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        responseType: 'arraybuffer',
        timeout: 10000,
      }
    );

    const audioBase64 = Buffer.from(response.data).toString('base64');
    return `data:audio/mpeg;base64,${audioBase64}`;

  } catch (err) {
    console.error('[Voice] ElevenLabs TTS failed:', err.message);
    return null;
  }
}
