export const CATEGORY_IDS = Object.freeze([
  'growth',
  'career',
  'study',
  'love',
  'health',
  'creative'
]);

export const CATEGORY_ICONS = Object.freeze({
  growth: '🌱',
  career: '🚀',
  study: '🎓',
  love: '💖',
  health: '🏃',
  creative: '💡'
});

export const CATEGORY_NAMES = Object.freeze({
  zh: Object.freeze({
    growth: '个人成长',
    career: '事业突破',
    study: '学业成名',
    love: '真挚情感',
    health: '健康生活',
    creative: '奇思妙想'
  }),
  en: Object.freeze({
    growth: 'Growth',
    career: 'Career',
    study: 'Learning',
    love: 'Relationships',
    health: 'Health',
    creative: 'Creativity'
  })
});

export function getCategoryLabel(category, language = 'zh') {
  const locale = language === 'en' ? 'en' : 'zh';
  const name = CATEGORY_NAMES[locale][category];
  return name ? `${CATEGORY_ICONS[category]} ${name}` : category;
}
