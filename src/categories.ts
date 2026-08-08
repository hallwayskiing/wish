export const CATEGORY_IDS = Object.freeze([
  'growth',
  'career',
  'study',
  'love',
  'health',
  'creative',
] as const);

export type CategoryId = (typeof CATEGORY_IDS)[number];

const VALID_CATEGORY_SET = new Set<string>(CATEGORY_IDS);

export function isCategoryId(category: string): category is CategoryId {
  return VALID_CATEGORY_SET.has(category);
}

export function normalizeCategory(category?: string | null): CategoryId {
  return category && isCategoryId(category) ? category : 'growth';
}

export const CATEGORY_ICONS: Readonly<Record<CategoryId, string>> = Object.freeze({
  growth: '🌱',
  career: '🚀',
  study: '🎓',
  love: '💖',
  health: '🏃',
  creative: '💡',
});

export const CATEGORY_NAMES: Readonly<Record<'zh' | 'en', Readonly<Record<CategoryId, string>>>> =
  Object.freeze({
    zh: Object.freeze({
      growth: '个人成长',
      career: '事业突破',
      study: '学业成名',
      love: '真挚情感',
      health: '健康生活',
      creative: '奇思妙想',
    }),
    en: Object.freeze({
      growth: 'Growth',
      career: 'Career',
      study: 'Learning',
      love: 'Relationships',
      health: 'Health',
      creative: 'Creativity',
    }),
  });

export function getCategoryName(
  category: string,
  language: 'zh' | 'en' = 'zh',
  fallback = ''
): string {
  const locale = language === 'en' ? 'en' : 'zh';
  return isCategoryId(category) ? CATEGORY_NAMES[locale][category] : fallback;
}

export function getCategoryLabel(category: string, language: 'zh' | 'en' = 'zh'): string {
  const locale = language === 'en' ? 'en' : 'zh';
  if (isCategoryId(category)) {
    const name = CATEGORY_NAMES[locale][category];
    const icon = CATEGORY_ICONS[category];
    return `${icon} ${name}`;
  }
  return category;
}
