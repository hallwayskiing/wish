import type { Language } from './types.js';

export interface TranslationDictionary {
  pageDescription: string;
  brand: string;
  primaryNavLabel: string;
  navWish: string;
  navWall: string;
  apiConfigTitle: string;
  languageToggleLabel: string;
  languageToggleTitle: string;
  heroBadge: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  categoryLabel: string;
  filterAll: string;
  submitWish: string;
  wallTitle: string;
  wallSubtitle: string;
  searchPlaceholder: string;
  refreshWall: string;
  refreshWallTitle: string;
  loadingTitle: string;
  close: string;
  closeModal: string;
  inspirationTitle: string;
  roadmapTitle: string;
  habitsTitle: string;
  pitfallsTitle: string;
  firstStepTitle: string;
  phaseLabel: string;
  save: string;
  apiModalTip: string;
  apiKeyLabel: string;
  clearApiKey: string;
  saveConfig: string;
  footerQuote: string;
  placeholders: Record<string, string>;
  loadingPhrases: string[];
  apiKeySaved: string;
  apiKeyCleared: string;
  generationError: string;
  generationComplete: string;
  beautifulWish: string;
  wishTime: string;
  inspirationFallback: string;
  timelineFallback: string;
  taskFallback: string;
  firstStepFallback: string;
  saving: string;
  wishSaved: string;
  saveError: string;
  wallLoadError: string;
  wallLoading: string;
  wallEmpty: string;
  wishInputLabel: string;
  wishFallback: string;
  bless: string;
  sharePoster: string;
  viewPlan: string;
  blessSuccess: string;
  blessError: string;
  posterError: string;
  posterPreviewTitle: string;
  posterPreviewHint: string;
  posterPreviewAlt: string;
  downloadPoster: string;
  posterDownloaded: string;
  posterWishLabel: string;
  posterBlessingsLabel: string;
  posterDateLabel: string;
  posterScanLabel: string;
  prevPage: string;
  nextPage: string;
  completeWish: string;
  completingWish: string;
  wishCompleted: string;
  completeError: string;
  showCompleted: string;
  completedBadge: string;
  alreadyCompleted: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  zh: {
    pageDescription: '许下你的心愿，生成具象的行动蓝图。',
    brand: '璀璨许愿阁',
    primaryNavLabel: '主要导航',
    navWish: '祈愿台',
    navWall: '愿望森林',
    apiConfigTitle: '配置 Google API 密钥',
    languageToggleLabel: 'EN',
    languageToggleTitle: 'Switch to English',
    heroBadge: '✦ 祈愿星光',
    heroTitle: '许下微光心愿，',
    heroTitleAccent: '凝筑从愿景到现实的落地阶梯',
    heroSubtitle: '每一个真挚的心愿都值得被深刻呈现。在此祈愿并生成专属行动方案。',
    categoryLabel: '祈愿领域：',
    filterAll: '全部愿望',
    submitWish: '心愿升空',
    wallTitle: '🌌 愿望森林 · 众星祈愿',
    wallSubtitle: '汲取他人的心愿灵感，为真挚的祈愿送出助愿祝福',
    searchPlaceholder: '搜索愿望关键词...',
    refreshWall: '刷新',
    refreshWallTitle: '刷新当前愿望列表',
    loadingTitle: '群星推演中...',
    close: '关闭',
    closeModal: '关闭弹窗',
    inspirationTitle: '星芒启示',
    roadmapTitle: '🗺️ 心愿推演蓝图',
    habitsTitle: '🎯 关键习惯与助力工具',
    pitfallsTitle: '🛡️ 避坑指南与心态调整',
    firstStepTitle: '🚀 24h 启程第一步',
    phaseLabel: '阶段',
    save: '保存心愿到森林',
    apiModalTip:
      '请输入您的 Google API 密钥，用于调用 Google Gemini 服务生成愿望行动方案。密钥仅保存在当前浏览器中。',
    apiKeyLabel: 'Google API Key：',
    clearApiKey: '清除 Key',
    saveConfig: '保存配置',
    footerQuote: '“星光不问赶路人，岁月不负有心人。”',
    placeholders: {
      growth: '我想养成阅读和复盘的习惯',
      career: '我想完成作品集，并获得理想的工作机会',
      study: '我想掌握数据分析，并独立完成一个可视化项目',
      love: '我想学会更真诚地表达感受，建立稳定而温暖的关系',
      health: '我想建立规律运动和早睡的生活节奏',
      creative: '我想完成第一篇短篇小说并公开发布',
    },
    loadingPhrases: [
      '正在感应并解析你的心愿...',
      '正在梳理愿望核心与潜在阻力...',
      '正在推演心愿落地的行动路径...',
      '正在凝练关键建议与启程第一步...',
    ],
    apiKeySaved: '✦ Google API 密钥已保存',
    apiKeyCleared: '已清除 Google API 密钥',
    generationError: '许愿处理超时，请重试',
    generationComplete: '✨ 愿望蓝图构建完成！',
    beautifulWish: '美好心愿',
    wishTime: '许愿时间',
    inspirationFallback: '相信坚持的力量，愿望终将照进现实。',
    timelineFallback: '近期',
    taskFallback: '核心任务',
    firstStepFallback: '立刻写下第一项行动计划',
    saving: '保存中...',
    wishSaved: '🌟 愿望已保存到愿望森林',
    saveError: '保存愿望失败',
    wallLoadError: '加载愿望森林出错了，请检查网络或后端服务。',
    wallLoading: '正在加载愿望森林...',
    wallEmpty: '暂时还没有此类愿望，快来许下第一个心愿吧！',
    wishInputLabel: '请输入你的心愿',
    wishFallback: '心愿',
    bless: '助愿',
    sharePoster: '分享',
    viewPlan: '查看蓝图 →',
    blessSuccess: '✨ 助愿成功！送出一份诚挚祝福',
    blessError: '⚠️ 助愿失败',
    posterError: '海报生成失败，请重试',
    posterPreviewTitle: '分享愿望海报',
    posterPreviewHint: '长按图片保存，或点击下载图片',
    posterPreviewAlt: '愿望分享海报预览',
    downloadPoster: '下载图片',
    posterDownloaded: '海报已下载',
    posterWishLabel: '我的心愿',
    posterBlessingsLabel: '助愿能量',
    posterDateLabel: '许愿日期',
    posterScanLabel: '扫码进入许愿阁',
    prevPage: '‹ 上一页',
    nextPage: '下一页 ›',
    completeWish: '标记为已完成',
    completingWish: '处理中...',
    wishCompleted: '🎉 心愿已顺利完成！',
    completeError: '完成心愿失败，请重试',
    showCompleted: '查看已完成',
    completedBadge: '已完成',
    alreadyCompleted: '✓ 心愿已完成',
  },
  en: {
    pageDescription: 'Make a wish and turn it into a concrete action plan.',
    brand: 'Cosmic Wishing Well',
    primaryNavLabel: 'Primary navigation',
    navWish: 'Wishing Well',
    navWall: 'Wish Forest',
    apiConfigTitle: 'Configure Google API Key',
    languageToggleLabel: '中文',
    languageToggleTitle: '切换到中文',
    heroBadge: '✦ Make a Cosmic Wish',
    heroTitle: 'Make a wish, ',
    heroTitleAccent: 'build a path from vision to reality',
    heroSubtitle:
      'Every sincere wish deserves clarity. Make yours and receive a personalized action plan.',
    categoryLabel: 'Wish category:',
    filterAll: 'All Wishes',
    submitWish: 'Launch Wish',
    wallTitle: '🌌 Wish Forest · Shared Dreams',
    wallSubtitle: 'Find inspiration in others and send encouragement to sincere wishes',
    searchPlaceholder: 'Search wishes...',
    refreshWall: 'Refresh',
    refreshWallTitle: 'Refresh the current wish list',
    loadingTitle: 'Mapping Your Wish...',
    close: 'Close',
    closeModal: 'Close dialog',
    inspirationTitle: 'Starlight Insight',
    roadmapTitle: '🗺️ Wish Roadmap',
    habitsTitle: '🎯 Key Habits & Tools',
    pitfallsTitle: '🛡️ Pitfalls & Mindset',
    firstStepTitle: '🚀 First Step in 24h',
    phaseLabel: 'Phase',
    save: 'Save to Forest',
    apiModalTip:
      'Enter your Google API key to generate wish action plans with Google Gemini. The key is stored only in this browser.',
    apiKeyLabel: 'Google API Key:',
    clearApiKey: 'Clear Key',
    saveConfig: 'Save Config',
    footerQuote: '“May every step beneath the stars bring your wish closer.”',
    placeholders: {
      growth: 'I want to build a habit of reading and reflecting',
      career: 'I want to complete my portfolio and find an ideal opportunity',
      study: 'I want to master data analysis and build a visualization project',
      love: 'I want to express myself honestly and build a warm, stable relationship',
      health: 'I want to build a consistent exercise and sleep routine',
      creative: 'I want to finish and publish my first short story',
    },
    loadingPhrases: [
      'Sensing and interpreting your wish...',
      'Mapping its core goals and potential obstacles...',
      'Designing a practical path forward...',
      'Refining key guidance and your first step...',
    ],
    apiKeySaved: '✦ Google API key saved',
    apiKeyCleared: 'Google API key cleared',
    generationError: 'Generation timed out. Please try again.',
    generationComplete: '✨ Your wish blueprint is ready!',
    beautifulWish: 'A Beautiful Wish',
    wishTime: 'Wished on',
    inspirationFallback: 'Trust the power of persistence—your wish can become reality.',
    timelineFallback: 'Soon',
    taskFallback: 'Core Action',
    firstStepFallback: 'Write down and complete your first small action.',
    saving: 'Saving...',
    wishSaved: '🌟 Wish saved to the Wish Forest',
    saveError: 'Failed to save wish',
    wallLoadError: 'Could not load the Wish Forest. Please check server connection.',
    wallLoading: 'Loading the Wish Forest...',
    wallEmpty: 'No wishes here yet. Be the first to make one!',
    wishInputLabel: 'Enter your wish',
    wishFallback: 'Wish',
    bless: 'Like',
    sharePoster: 'Share',
    viewPlan: 'View Plan →',
    blessSuccess: '✨ Liked!',
    blessError: '⚠️ Could not send like',
    posterError: 'Could not create the poster. Please try again.',
    posterPreviewTitle: 'Share Wish Poster',
    posterPreviewHint: 'Save the preview or download the image',
    posterPreviewAlt: 'Wish poster preview',
    downloadPoster: 'Download Image',
    posterDownloaded: 'Poster downloaded',
    posterWishLabel: 'My Wish',
    posterBlessingsLabel: 'Encouragement',
    posterDateLabel: 'Wish Date',
    posterScanLabel: 'Scan to make a wish',
    prevPage: '‹ Prev',
    nextPage: 'Next ›',
    completeWish: 'Mark as Completed',
    completingWish: 'Processing...',
    wishCompleted: '🎉 Congratulations! Wish completed!',
    completeError: 'Failed to complete wish. Please try again.',
    showCompleted: 'View Completed',
    completedBadge: 'Completed',
    alreadyCompleted: '✓ Wish Completed',
  },
};

export function translate(language: Language, key: string): string {
  const dict = translations[language];
  if (key in dict) {
    const val = dict[key as keyof TranslationDictionary];
    if (typeof val === 'string') return val;
  }
  return key;
}
