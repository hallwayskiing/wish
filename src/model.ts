import { type CategoryId, normalizeCategories } from './categories.js';
import { buildPrompt } from './prompt.js';
import { serverMessage } from './server-messages.js';
import type { AIPlan } from './types.js';
import { sanitizeAiPlan } from './wish-data.js';

const GEMINI_MODEL = 'gemini-flash-lite-latest';

interface GeneratePlanOptions {
  wish: string;
  apiKey?: string;
  language?: string;
}

export interface GeneratePlanResult {
  categories: CategoryId[];
  aiPlan: AIPlan;
}

function extractCategories(raw: unknown): CategoryId[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ['other'];
  const obj = raw as Record<string, unknown>;
  return normalizeCategories(obj.categories);
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiErrorPayload {
  error?: {
    message?: string;
  };
}

type GeminiResponsePayload = GeminiErrorPayload & {
  candidates?: GeminiCandidate[];
};

function extractText(payload: GeminiResponsePayload): string {
  return (
    payload.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim() || ''
  );
}

export async function generatePlan({
  wish,
  apiKey,
  language = 'zh',
}: GeneratePlanOptions): Promise<GeneratePlanResult> {
  if (!apiKey) {
    throw new Error(serverMessage(language, 'noApiKey'));
  }

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
  );
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint.href, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(wish, language) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 1.2,
        topP: 0.95,
        thinkingConfig: {
          thinkingBudget: 1024,
          includeThoughts: false,
        },
      },
    }),
  });
  const payload = (await response.json()) as GeminiResponsePayload;

  if (!response.ok) {
    throw new Error(
      serverMessage(
        language,
        'modelRequestFailed',
        payload.error?.message || `HTTP ${response.status}`
      )
    );
  }

  const responseText = extractText(payload);
  if (!responseText) {
    throw new Error(serverMessage(language, 'emptyModelResponse'));
  }

  try {
    const rawParsed: unknown = JSON.parse(responseText);
    const categories = extractCategories(rawParsed);
    const aiPlan = sanitizeAiPlan(rawParsed);
    return { categories, aiPlan };
  } catch {
    throw new Error(serverMessage(language, 'invalidModelJson'));
  }
}
