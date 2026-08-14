import { normalizePersonalProfile, PERSONAL_PROFILE_STORAGE_KEY } from '../profile-library.js';

export function loadPersonalProfile(): string[] {
  const stored = localStorage.getItem(PERSONAL_PROFILE_STORAGE_KEY);
  if (!stored) return [];

  try {
    return normalizePersonalProfile(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function savePersonalProfile(entries: string[]): string[] {
  const normalized = normalizePersonalProfile(entries);
  if (normalized.length > 0) {
    localStorage.setItem(PERSONAL_PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  } else {
    localStorage.removeItem(PERSONAL_PROFILE_STORAGE_KEY);
  }
  return normalized;
}
