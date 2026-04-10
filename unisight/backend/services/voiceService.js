// services/voiceService.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Read both dynamically so any .env change takes effect after nodemon restart
const getApiKey  = () => process.env.ELEVENLABS_API_KEY;
const getVoiceId = () => process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

/**
 * Converts text to speech using ElevenLabs API.
 * Returns a base64 data URL of the mp3 audio, or null on failure.
 */
export async function textToSpeech(text) {
  const API_KEY  = getApiKey();
  const VOICE_ID = getVoiceId();

  if (!API_KEY) {
    console.warn('[Voice] ELEVENLABS_API_KEY not set — skipping TTS');
    return null;
  }

  console.log(`[Voice] TTS → voice: ${VOICE_ID} | key: ${API_KEY.substring(0, 12)}...`);

  // Trim to 500 chars to save quota
  const trimmedText = text.length > 500 ? text.substring(0, 497) + '...' : text;

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: trimmedText,
        // eleven_multilingual_v2 works with all voice IDs including cloned voices
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        responseType: 'arraybuffer',
        timeout: 25000,
      }
    );

    const audioBase64 = Buffer.from(response.data).toString('base64');
    console.log(`[Voice] ✅ TTS success (${(response.data.byteLength / 1024).toFixed(1)} KB)`);
    return `data:audio/mpeg;base64,${audioBase64}`;

  } catch (err) {
    const status = err.response?.status;
    let detail = err.message;
    if (err.response?.data) {
      try { detail = Buffer.from(err.response.data).toString('utf8').substring(0, 300); } catch (_) {}
    }
    console.error(`[Voice] ❌ ElevenLabs failed (HTTP ${status}):`, detail);
    return null;
  }
}

/**
 * Test ElevenLabs API key + voice ID connectivity.
 * Returns { ok, voiceId, voiceName?, status?, error? }
 */
export async function testElevenLabsConnection() {
  const API_KEY  = getApiKey();
  const VOICE_ID = getVoiceId();

  if (!API_KEY) return { ok: false, error: 'ELEVENLABS_API_KEY not set in .env' };

  try {
    const res = await axios.get(
      `https://api.elevenlabs.io/v1/voices/${VOICE_ID}`,
      { headers: { 'xi-api-key': API_KEY }, timeout: 8000 }
    );
    return { ok: true, voiceId: VOICE_ID, voiceName: res.data?.name };
  } catch (err) {
    const status = err.response?.status;
    let detail = err.message;
    if (err.response?.data) {
      try { detail = JSON.stringify(err.response.data).substring(0, 200); } catch (_) {}
    }
    return { ok: false, status, voiceId: VOICE_ID, error: detail };
  }
}
