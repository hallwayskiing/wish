export const CATEGORY_IDS = Object.freeze([
  'growth',
  'career',
  'relationship',
  'health',
  'creative',
  'wealth',
  'philosophy',
  'wild',
  'other',
] as const);

export type CategoryId = (typeof CATEGORY_IDS)[number];

const VALID_CATEGORY_SET = new Set<string>(CATEGORY_IDS);

export function isCategoryId(category: string): category is CategoryId {
  return VALID_CATEGORY_SET.has(category);
}

export const CATEGORY_ICONS: Readonly<Record<CategoryId, string>> = Object.freeze({
  growth: '🌱',
  career: '🚀',
  relationship: '💞',
  health: '🏃',
  creative: '🎨',
  wealth: '💰',
  philosophy: '📜',
  wild: '💡',
  other: '🌈',
});

export const CATEGORY_NAMES: Readonly<Record<'zh' | 'en', Readonly<Record<CategoryId, string>>>> =
  Object.freeze({
    zh: Object.freeze({
      growth: '个人成长',
      career: '事业发展',
      relationship: '情感关系',
      health: '健康生活',
      creative: '创意灵感',
      wealth: '财富管理',
      philosophy: '哲思哲理',
      wild: '奇思妙想',
      other: '其他',
    }),
    en: Object.freeze({
      growth: 'Growth',
      career: 'Career',
      relationship: 'Relationship',
      health: 'Health',
      creative: 'Creative',
      wealth: 'Wealth',
      philosophy: 'Philosophy',
      wild: 'Wild',
      other: 'Other',
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

export function normalizeCategories(input?: unknown): CategoryId[] {
  if (!Array.isArray(input)) return ['other'];
  const seen = new Set<string>();
  const result: CategoryId[] = [];
  for (const item of input) {
    if (typeof item !== 'string' || !isCategoryId(item) || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
    if (result.length >= 3) break;
  }
  return result.length ? result : ['other'];
}
