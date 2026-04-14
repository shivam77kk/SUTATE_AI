import { GoogleGenerativeAI } from '@google/generative-ai';
import PQueue from 'p-queue';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiQueue = new PQueue({
  concurrency: 2,
  interval: 60000,
  intervalCap: 14,
});

const FALLBACK_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b-latest',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-002',
];

let model = null;
let activeModelName = null;
let modelIndex = 0;

function getModelByIndex(idx) {
  const name = FALLBACK_MODELS[idx % FALLBACK_MODELS.length];
  activeModelName = name;
  return genAI.getGenerativeModel({ model: name });
}

export async function getModel() {
  if (!model) {
    model = getModelByIndex(modelIndex);
    console.log(`Gemini using model: ${activeModelName}`);
  }
  return model;
}

function advanceModel() {
  modelIndex = (modelIndex + 1) % FALLBACK_MODELS.length;
  model = null;
  activeModelName = null;
}

export async function callGemini(prompt, options = {}) {
  return geminiQueue.add(async () => {
    let lastErr;
    for (let attempt = 0; attempt < FALLBACK_MODELS.length; attempt++) {
      try {
        const workingModel = await getModel();
        const result = await workingModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: String(prompt) }] }],
          generationConfig: {
            maxOutputTokens: options.maxTokens ?? 800,
            temperature: options.temperature ?? 0.3,
          },
        });
        const text = result?.response?.text?.() ?? '';
        if (!text.trim()) throw new Error('Empty response');
        return text;
      } catch (err) {
        lastErr = err;
        console.warn(`Gemini [${activeModelName}] failed: ${err?.status || err?.message || 'unknown'}`);
        advanceModel();
      }
    }
    throw lastErr || new Error('All Gemini models failed');
  });
}

export async function callGeminiWithParts(parts, options = {}) {
  return geminiQueue.add(async () => {
    let lastErr;
    for (let attempt = 0; attempt < FALLBACK_MODELS.length; attempt++) {
      try {
        const workingModel = await getModel();
        const result = await workingModel.generateContent(parts);
        const text = result?.response?.text?.() ?? '';
        return text;
      } catch (err) {
        lastErr = err;
        console.warn(`Gemini Parts [${activeModelName}] failed: ${err?.status || err?.message || 'unknown'}`);
        advanceModel();
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

export async function callGeminiJSON(prompt, fallback = null) {
  try {
    const raw = await callGemini(prompt);
    return parseGeminiJSON(raw);
  } catch {
    return fallback;
  }
}
