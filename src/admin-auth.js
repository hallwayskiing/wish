import configYaml from '../config.yaml';
import { json, parseJsonBody } from './http.js';

const ADMIN_COOKIE = 'wish_admin_session';
const SESSION_SECONDS = 24 * 60 * 60;
const textEncoder = new TextEncoder();

function readYamlString(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*(?:\"([^\"]*)\"|'([^']*)'|([^#\\r\\n]+))\\s*$`, 'm'));
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
}

const password = readYamlString(configYaml, 'admin_password');

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', textEncoder.encode(value)));
}

let signingKeyPromise;
let passwordHashPromise;

function getSigningKey() {
  signingKeyPromise ||= crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return signingKeyPromise;
}

function getPasswordHash() {
  passwordHashPromise ||= sha256(password);
  return passwordHashPromise;
}

async function signSession(expiresAt) {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await getSigningKey(),
    textEncoder.encode(`admin:${expiresAt}`)
  );
  return `${expiresAt}.${bytesToHex(signature)}`;
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator !== -1 && cookie.slice(0, separator).trim() === name) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return '';
}

export async function isAdminAuthenticated(request) {
  if (!password) return false;
  const token = getCookie(request, ADMIN_COOKIE);
  const separator = token.indexOf('.');
  if (separator === -1) return false;

  const expiresAt = Number(token.slice(0, separator));
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  return constantTimeEqual(token, await signSession(expiresAt));
}

export async function adminLogin(request) {
  if (!password) return json({ error: '管理员密码尚未配置。' }, 503);

  const body = await parseJsonBody(request);
  const submittedPassword = typeof body?.password === 'string' ? body.password : '';
  const [submittedHash, expectedHash] = await Promise.all([
    sha256(submittedPassword),
    getPasswordHash()
  ]);
  if (!constantTimeEqual(submittedHash, expectedHash)) {
    return json({ error: '密码错误。' }, 401);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = await signSession(expiresAt);
  return json({ success: true }, 200, {
    'set-cookie': `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`
  });
}

export function adminLogout() {
  return json({ success: true }, 200, {
    'set-cookie': `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  });
}
