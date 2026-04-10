import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
);

// ── Fallback model list (tried in order) ──────────────────────────────────
const FALLBACK_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
];

let cachedModel = null;

/**
 * Try each model in FALLBACK_MODELS until one responds.
 * The working model is cached so we don't re-test on every call.
 */
async function getWorkingModel(generationConfig = {}) {
  for (const modelName of FALLBACK_MODELS) {
    try {
      const m = genAI.getGenerativeModel({ model: modelName, generationConfig });
      // Quick probe to see if the model is available
      await m.generateContent('test');
      console.log(`✅ [Gemini] Using model: ${modelName}`);
      return m;
    } catch (err) {
      console.log(`⚠️ [Gemini] ${modelName} failed, trying next…`);
    }
  }
  throw new Error('❌ All Gemini fallback models failed');
}

async function getModel(generationConfig = {}) {
  if (!cachedModel) {
    cachedModel = await getWorkingModel(generationConfig);
  }
  return cachedModel;
}

/**
 * Retry with exponential backoff on rate-limit errors (429 / quota).
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRateLimit =
        err.message?.includes('quota') ||
        err.message?.includes('rate limit') ||
        err.message?.includes('429') ||
        Number(err.status) === 429;

      if (attempt === maxRetries || !isRateLimit) throw err;

      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[Gemini] Rate-limit hit — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));

      // Reset cached model so next attempt re-discovers a working one
      cachedModel = null;
    }
  }
  throw lastError;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Call Gemini and return the raw text response.
 */
export async function callGemini(prompt, { maxTokens = 800, temperature = 0.3 } = {}) {
  const generationConfig = { maxOutputTokens: maxTokens, temperature };
  return retryWithBackoff(async () => {
    const m = await getModel(generationConfig);
    const result = await m.generateContent(prompt);
    return result.response.text();
  });
}

/**
 * Call Gemini and parse the response as JSON.
 */
export async function callGeminiJSON(prompt) {
  const text = await callGemini(prompt, { temperature: 0.1, maxTokens: 1200 });
  const clean = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Gemini response was not valid JSON: ' + clean.slice(0, 200));
  }
}
