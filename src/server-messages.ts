type MessageKey =
  | 'emptyWish'
  | 'generationFailed'
  | 'missingDraft'
  | 'emptyTitle'
  | 'invalidCategory'
  | 'invalidPlan'
  | 'planTooLong'
  | 'invalidBlessings'
  | 'alreadySaved'
  | 'saveFailed'
  | 'listFailed'
  | 'notFound'
  | 'blessFailed'
  | 'updateFailed'
  | 'deleteFailed'
  | 'noApiKey'
  | 'modelRequestFailed'
  | 'emptyModelResponse'
  | 'invalidModelJson'
  | 'adminPasswordMissing'
  | 'invalidPassword'
  | 'adminLoginRequired'
  | 'routeNotFound';

type MessageValue = string | ((detail?: string) => string);

const SERVER_MESSAGES: Readonly<Record<'zh' | 'en', Readonly<Record<MessageKey, MessageValue>>>> = Object.freeze({
  zh: Object.freeze({
    emptyWish: '请填写您的愿望！',
    generationFailed: '愿望生成失败。',
    missingDraft: '缺少待保存的愿望数据。',
    emptyTitle: '愿望内容不能为空。',
    invalidCategory: '愿望分类无效。',
    invalidPlan: '愿望行动方案无效。',
    planTooLong: '愿望行动方案内容过长。',
    invalidBlessings: '助愿数量必须是大于或等于 0 的整数。',
    alreadySaved: '该愿望已经保存。',
    saveFailed: '保存愿望失败。',
    listFailed: '获取愿望列表失败，请重试。',
    notFound: '未找到该愿望。',
    blessFailed: '助愿失败，请重试。',
    updateFailed: '更新愿望失败。',
    deleteFailed: '删除愿望失败。',
    noApiKey: '未配置 API Key，请打开【Google API】并填写 Gemini API Key。',
    modelRequestFailed: (detail?: string) => `大模型调用失败：${detail || ''}`,
    emptyModelResponse: '大模型返回了空内容。',
    invalidModelJson: '大模型返回的 JSON 格式无效，请重试。',
    adminPasswordMissing: '管理员密码尚未配置。',
    invalidPassword: '密码错误。',
    adminLoginRequired: '请先登录管理后台。',
    routeNotFound: '请求路径不存在。'
  }),
  en: Object.freeze({
    emptyWish: 'Please enter a wish.',
    generationFailed: 'Wish generation failed.',
    missingDraft: 'Missing wish data.',
    emptyTitle: 'Wish content cannot be empty.',
    invalidCategory: 'The wish category is invalid.',
    invalidPlan: 'The wish action plan is invalid.',
    planTooLong: 'The wish action plan is too long.',
    invalidBlessings: 'Encouragement must be a non-negative integer.',
    alreadySaved: 'This wish has already been saved.',
    saveFailed: 'Could not save the wish.',
    listFailed: 'Could not load wishes.',
    notFound: 'Wish not found.',
    blessFailed: 'Could not send encouragement.',
    updateFailed: 'Could not update the wish.',
    deleteFailed: 'Could not delete the wish.',
    noApiKey: 'No API key configured. Open Google API and enter your Gemini API key.',
    modelRequestFailed: (detail?: string) => `Model request failed: ${detail || ''}`,
    emptyModelResponse: 'The model returned an empty response.',
    invalidModelJson: 'The model returned invalid JSON. Please try again.',
    adminPasswordMissing: 'The administrator password is not configured.',
    invalidPassword: 'Incorrect password.',
    adminLoginRequired: 'Please sign in to the admin console.',
    routeNotFound: 'The requested path does not exist.'
  })
});

export function serverMessage(language: string | null | undefined, key: MessageKey, detail?: string): string {
  const locale = language === 'en' ? 'en' : 'zh';
  const value = SERVER_MESSAGES[locale][key];
  if (typeof value === 'function') return value(detail);
  return value || key;
}
