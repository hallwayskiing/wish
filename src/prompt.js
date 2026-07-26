/* ==========================================================================
   AI Prompt & Category Constants Module - 璀璨许愿阁
   ========================================================================== */

export const CATEGORY_NAMES = {
  zh: {
    career: '事业突破',
    study: '学业成名',
    love: '情感真挚',
    health: '健康生活',
    growth: '个人成长',
    creative: '奇思妙想'
  },
  en: {
    career: 'Career',
    study: 'Learning',
    love: 'Relationships',
    health: 'Health',
    growth: 'Growth',
    creative: 'Creativity'
  }
};

export function buildPrompt(wish, category, language) {
  if (language === 'en') {
    return `
You are a warm, insightful, and highly practical wish-realization mentor and life-planning expert.

User wish: ${wish}
Wish category: ${CATEGORY_NAMES.en[category]}

Create a specific, practical, motivating, and actionable plan for realizing this wish.
Every user-facing value must be written in natural English, including phase names, titles, actions, timelines, habits, pitfalls, inspiration, and the first step.
Return strict JSON only. Do not include Markdown fences or text outside the JSON object.
Use exactly this structure. The roadmap array may contain any number of phases:
{
  "inspiration": "One warm, philosophical, and motivating insight",
  "roadmap": [
    {
      "phase": "Short, concise and meaningful stage name. Number or order is not allowed",
      "title": "Core theme of this stage",
      "action": "Specific actions to take",
      "timeline": "Estimated timeframe"
    }
  ],
  "habitsAndTools": [
    "Recommended micro-habit or tool 1",
    "Recommended micro-habit or tool 2",
    "Recommended micro-habit or tool 3"
  ],
  "pitfalls": [
    "Potential pitfall 1 and how to handle it",
    "Potential pitfall 2 and how to handle it"
  ],
  "firstStep": "One concrete first step that can be completed within 24 hours"
}`;
  }

  return `
你是一位温暖、富有深刻洞察力与超强执行力的“愿望实现导师与人生规划专家”。

愿望内容：${wish}
愿望分类：${CATEGORY_NAMES.zh[category]}

请为用户定制一份具体、实用、充满号召力且可落地的愿望实现计划。
所有面向用户的字段必须只使用自然中文，包括阶段名、标题、行动、时间线、习惯、避坑建议、启示和第一步。
严格输出纯 JSON，不要包含 Markdown 代码块或 JSON 之外的文字。
严格使用以下结构，其中 roadmap 数组可以包含任意数量的阶段：
{
  "inspiration": "一句温暖励志且富有哲理的洞察与激励",
  "roadmap": [
    {
      "phase": "简短、凝练、有意义的阶段名称。禁止包含序号或顺序",
      "title": "阶段核心主题",
      "action": "具体行动方案",
      "timeline": "预计时间段"
    }
  ],
  "habitsAndTools": [
    "推荐的关键微习惯或工具 1",
    "推荐的关键微习惯或工具 2",
    "推荐的关键微习惯或工具 3"
  ],
  "pitfalls": [
    "可能遇到的陷阱 1 及应对策略",
    "可能遇到的陷阱 2 及应对策略"
  ],
  "firstStep": "24 小时内可以完成的第一小步"
}`;
}
