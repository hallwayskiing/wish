export const PERSONAL_PROFILE_STORAGE_KEY = 'wish_personal_profile_v1';
export const MAX_PROFILE_ENTRIES = 20;
export const MAX_PROFILE_ENTRY_LENGTH = 500;
export const MAX_PROFILE_TOTAL_LENGTH = MAX_PROFILE_ENTRIES * MAX_PROFILE_ENTRY_LENGTH;

export function normalizePersonalProfile(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const entries: string[] = [];
  let totalLength = 0;

  for (const value of input) {
    if (entries.length >= MAX_PROFILE_ENTRIES || totalLength >= MAX_PROFILE_TOTAL_LENGTH) break;
    if (typeof value !== 'string') continue;

    const availableLength = Math.min(
      MAX_PROFILE_ENTRY_LENGTH,
      MAX_PROFILE_TOTAL_LENGTH - totalLength
    );
    const entry = value.trim().slice(0, availableLength);
    if (!entry) continue;

    entries.push(entry);
    totalLength += entry.length;
  }

  return entries;
}
