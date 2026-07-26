import { buildPrompt } from './prompt.js';
import { serverMessage } from './server-messages.js';

const GEMINI_MODEL = 'gemini-flash-lite-latest';

function extractText(payload) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

export async function generatePlan({ wish, category, apiKey, language }) {
  if (!apiKey) {
    throw new Error(serverMessage(language, 'noApiKey'));
  }

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
  );
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(wish, category, language) }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(serverMessage(
      language,
      'modelRequestFailed',
      payload?.error?.message || `HTTP ${response.status}`
    ));
  }

  const responseText = extractText(payload);
  if (!responseText) {
    throw new Error(serverMessage(language, 'emptyModelResponse'));
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(serverMessage(language, 'invalidModelJson'));
  }
}
