export interface SiteConfig {
  brand: Record<'zh' | 'en', string>;
  description: Record<'zh' | 'en', string>;
}

export const SITE_CONFIG: Readonly<SiteConfig> = Object.freeze({
  brand: Object.freeze({
    zh: '璀璨许愿阁',
    en: 'Cosmic Wishing Well'
  }),
  description: Object.freeze({
    zh: '许下你的心愿，生成具象的行动蓝图。',
    en: 'Make a wish and turn it into a concrete action plan.'
  })
});
