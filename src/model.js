import { buildPrompt } from './prompt.js';

const GEMINI_MODEL = 'gemini-flash-lite-latest';

const MODEL_MESSAGES = {
  zh: {
    noApiKey: '未配置 API Key，请打开【Google API】并填写 Gemini API Key。',
    requestFailed: message => `大模型调用失败：${message}`,
    emptyResponse: '大模型返回了空内容。',
    invalidJson: '大模型返回的 JSON 格式无效，请重试。'
  },
  en: {
    noApiKey: 'No API key configured. Open Google API and enter your Gemini API key.',
    requestFailed: message => `Model request failed: ${message}`,
    emptyResponse: 'The model returned an empty response.',
    invalidJson: 'The model returned invalid JSON. Please try again.'
  }
};

function message(language, key, detail) {
  const value = MODEL_MESSAGES[language === 'en' ? 'en' : 'zh'][key];
  return typeof value === 'function' ? value(detail) : value;
}

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
    throw new Error(message(language, 'noApiKey'));
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
    throw new Error(message(
      language,
      'requestFailed',
      payload?.error?.message || `HTTP ${response.status}`
    ));
  }

  const responseText = extractText(payload);
  if (!responseText) {
    throw new Error(message(language, 'emptyResponse'));
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(message(language, 'invalidJson'));
  }
}
