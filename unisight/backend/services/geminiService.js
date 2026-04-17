import { GoogleGenerativeAI } from '@google/generative-ai';
import PQueue from 'p-queue';
import dotenv from 'dotenv';
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export const geminiQueue = new PQueue({
  concurrency: 1,
  interval: 60000,
  intervalCap: 10,
});
const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
let modelIndex = 0;
function getModel(generationConfig = {}) {
  const name = MODELS[modelIndex % MODELS.length];
  return { model: genAI.getGenerativeModel({ model: name, generationConfig }), name };
}
function nextModel() {
  modelIndex = (modelIndex + 1) % MODELS.length;
}
function extractRetryDelay(err) {
  try {
    const details = err?.errorDetails || [];
    for (const d of details) {
      if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
        const sec = parseInt(d.retryDelay);
        if (!isNaN(sec) && sec > 0) return sec * 1000;
      }
    }
    const match = err?.message?.match(/retry in (\d+)/i);
    if (match) return parseInt(match[1]) * 1000;
  } catch {}
  return 0;
}
export async function callGemini(prompt, options = {}) {
  return geminiQueue.add(async () => {
    const maxRetries = 4;
    let lastErr;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { model, name } = getModel({
        maxOutputTokens: options.maxTokens ?? 800,
        temperature: options.temperature ?? 0.3,
      });
      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: String(prompt) }] }],
        });
        const text = result?.response?.text?.() ?? '';
        if (!text.trim()) throw new Error('Empty response from Gemini');
        return text;
      } catch (err) {
        lastErr = err;
        const status = err?.status || 0;
        console.warn(`[Gemini] ${name} failed (${status || err.message?.substring(0, 80)})`);
        if (status === 429) {
          let delay = extractRetryDelay(err);
          if (delay <= 0) delay = Math.min(60000, 5000 * Math.pow(2, attempt));
          console.log(`[Gemini] 429 rate-limit. Waiting ${Math.round(delay/1000)}s (attempt ${attempt+1}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, delay));
          nextModel();
          continue;
        }
        if (status === 503 || status === 500) {
          const delay = 3000 * (attempt + 1);
          console.log(`[Gemini] Server error ${status}. Waiting ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          nextModel();
          continue;
        }
        nextModel();
      }
    }
    throw lastErr || new Error('All Gemini retries failed');
  });
}
export async function callGeminiWithParts(parts, options = {}) {
  return geminiQueue.add(async () => {
    const maxRetries = 3;
    let lastErr;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { model, name } = getModel();
      try {
        const result = await model.generateContent(parts);
        const text = result?.response?.text?.() ?? '';
        return text;
      } catch (err) {
        lastErr = err;
        console.warn(`[Gemini Parts] ${name} failed: ${err?.status || err?.message?.substring(0, 80)}`);
        if (err?.status === 429) {
          let delay = extractRetryDelay(err);
          if (delay <= 0) delay = 10000 * (attempt + 1);
          await new Promise(r => setTimeout(r, delay));
        }
        nextModel();
      }
    }
    throw lastErr || new Error('All Gemini models failed for parts');
  });
}
export function parseGeminiJSON(text) {
  if (typeof text !== 'string') text = JSON.stringify(text);
  let s = text
    .replace(/```json\s*/gi, '')
    .replace(/```javascript\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const obj = s.indexOf('{');
  const arr = s.indexOf('[');
  let start = -1;
  if (obj !== -1 && arr !== -1) start = Math.min(obj, arr);
  else if (obj !== -1) start = obj;
  else if (arr !== -1) start = arr;
  if (start > 0) s = s.substring(start);
  const isArr = s.startsWith('[');
  let depth = 0;
  let end = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === (isArr ? '[' : '{')) depth++;
    if (s[i] === (isArr ? ']' : '}')) {
      depth--;
      if (!depth) {
        end = i;
        break;
      }
    }
  }
  if (end !== -1) s = s.substring(0, end + 1);
  return JSON.parse(s);
}
export async function callGeminiJSON(prompt) {
  const raw = await callGemini(prompt);
  return parseGeminiJSON(raw);
}
