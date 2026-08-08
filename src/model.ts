import type { CategoryId } from './categories.js';
import { buildPrompt } from './prompt.js';
import { serverMessage } from './server-messages.js';
import type { AIPlan } from './types.js';
import { sanitizeAiPlan } from './wish-data.js';

const GEMINI_MODEL = 'gemini-flash-lite-latest';

interface GeneratePlanOptions {
  wish: string;
  category: CategoryId;
  apiKey?: string;
  language?: string;
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
  category,
  apiKey,
  language = 'zh',
}: GeneratePlanOptions): Promise<AIPlan> {
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
      contents: [{ parts: [{ text: buildPrompt(wish, category, language) }] }],
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
    return sanitizeAiPlan(rawParsed);
  } catch {
    throw new Error(serverMessage(language, 'invalidModelJson'));
  }
}
