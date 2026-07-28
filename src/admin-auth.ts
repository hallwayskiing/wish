import { json, parseJsonBody } from './http.js';
import { serverMessage } from './server-messages.js';
import { Env } from './types.js';

const ADMIN_COOKIE = 'wish_admin_session';
const SESSION_SECONDS = 24 * 60 * 60;
const textEncoder = new TextEncoder();

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function sha256(value: string): Promise<string> {
  return bytesToHex(await crypto.subtle.digest('SHA-256', textEncoder.encode(value)));
}

function getSigningKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function signSession(expiresAt: number, password: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await getSigningKey(password),
    textEncoder.encode(`admin:${expiresAt}`)
  );
  return `${expiresAt}.${bytesToHex(signature)}`;
}

function getCookie(request: Request, name: string): string {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator !== -1 && cookie.slice(0, separator).trim() === name) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return '';
}

export async function isAdminAuthenticated(request: Request, env: Env): Promise<boolean> {
  const password = env.ADMIN_PASSWORD;
  if (!password) return false;
  const token = getCookie(request, ADMIN_COOKIE);
  const separator = token.indexOf('.');
  if (separator === -1) return false;

  const expiresAt = Number(token.slice(0, separator));
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  return constantTimeEqual(token, await signSession(expiresAt, password));
}

export async function adminLogin(request: Request, env: Env): Promise<Response> {
  const password = env.ADMIN_PASSWORD;
  if (!password) return json({ error: serverMessage('zh', 'adminPasswordMissing') }, 503);

  const body = await parseJsonBody<{ password?: string }>(request);
  const submittedPassword = typeof body?.password === 'string' ? body.password : '';
  const [submittedHash, expectedHash] = await Promise.all([
    sha256(submittedPassword),
    sha256(password)
  ]);
  if (!constantTimeEqual(submittedHash, expectedHash)) {
    return json({ error: serverMessage('zh', 'invalidPassword') }, 401);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = await signSession(expiresAt, password);
  return json({ success: true }, 200, {
    'set-cookie': `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`
  });
}

export function adminLogout(): Response {
  return json({ success: true }, 200, {
    'set-cookie': `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  });
}
