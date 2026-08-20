import { type CategoryId, normalizeCategories } from './categories.js';
import { buildSystemPrompt } from './prompt.js';
import { serverMessage } from './server-messages.js';
import type { AIPlan } from './types.js';
import { sanitizeAiPlan } from './wish-data.js';

export const GEMINI_TIERS = ['LITE', 'FLASH', 'PRO'] as const;
export type GeminiTier = (typeof GEMINI_TIERS)[number];

export const GEMINI_MODEL_MAP: Record<GeminiTier, string> = {
  LITE: 'gemini-flash-lite-latest',
  FLASH: 'gemini-flash-latest',
  PRO: 'gemini-pro-latest',
};

export const DEFAULT_GEMINI_TIER: GeminiTier = 'LITE';

export function normalizeGeminiTier(input: unknown): GeminiTier {
  if (typeof input === 'string') {
    const v = input.trim().toUpperCase();
    if (v === 'LITE' || v === 'FLASH' || v === 'PRO') return v;
  }
  return DEFAULT_GEMINI_TIER;
}

export function getGeminiModel(tier: unknown): string {
  return GEMINI_MODEL_MAP[normalizeGeminiTier(tier)];
}

export const THINKING_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export const DEFAULT_THINKING_LEVEL: ThinkingLevel = 'MEDIUM';

export function normalizeThinkingLevel(input: unknown): ThinkingLevel {
  if (typeof input === 'string') {
    const v = input.trim().toUpperCase();
    if (v === 'LOW' || v === 'MEDIUM' || v === 'HIGH') return v;
  }
  return DEFAULT_THINKING_LEVEL;
}

export function getThinkingLevel(level: unknown): 'low' | 'medium' | 'high' {
  const normalized = normalizeThinkingLevel(level);
  return normalized.toLowerCase() as 'low' | 'medium' | 'high';
}

interface GeneratePlanOptions {
  wish: string;
  apiKey?: string;
  language?: string;
  modelTier?: string;
  thinkingLevel?: string;
  personalProfile?: string[];
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
  modelTier,
  thinkingLevel,
  personalProfile,
}: GeneratePlanOptions): Promise<GeneratePlanResult> {
  if (!apiKey) {
    throw new Error(serverMessage(language, 'noApiKey'));
  }

  const modelName = getGeminiModel(modelTier);
  const normalizedThinkingLevel = getThinkingLevel(thinkingLevel);
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`
  );
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint.href, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(language, personalProfile) }] },
      contents: [{ role: 'user', parts: [{ text: wish }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: normalizedThinkingLevel,
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
