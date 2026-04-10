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
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
];

let model = null;
let activeModelName = null;

async function getWorkingModel() {
  for (const modelName of FALLBACK_MODELS) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      await testModel.generateContent('test');
      console.log(`Gemini using model: ${modelName}`);
      activeModelName = modelName;
      return testModel;
    } catch (error) {
      console.warn(`Model ${modelName} failed, trying next fallback...`);
    }
  }
  throw new Error('All fallback models failed');
}

export async function getModel() {
  if (!model) {
    model = await getWorkingModel();
  }
  return model;
}

export async function callGemini(prompt, options = {}) {
  return geminiQueue.add(async () => {
    let retries = 0;
    while (retries < FALLBACK_MODELS.length + 1) {
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
        console.warn(`Gemini call failed on ${activeModelName || 'unknown'}: ${err?.message || 'unknown'}`);
        model = null;
        activeModelName = null;
        retries++;
      }
    }
    throw new Error('All Gemini models failed');
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
