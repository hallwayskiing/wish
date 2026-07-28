import { AIPlan, AIPlanPhase } from '../types.js';
import { escapeHtml } from '../ui.js';

const PHASE_LABEL = '阶段';

export interface PlanFormController {
  element: HTMLElement;
  getAiPlan: () => AIPlan;
}

interface CreateTextListOptions {
  title: string;
  values?: string[];
  inputClass: string;
  placeholder: string;
  addLabel: string;
}

export function buildPlanForm(aiPlan?: AIPlan): PlanFormController {
  const plan = aiPlan || {};
  const container = document.createElement('div');
  container.className = 'plan-form-container';

  // 1. Inspiration Section
  const inspSection = document.createElement('div');
  inspSection.className = 'plan-form-section';
  inspSection.innerHTML = `
    <label class="plan-section-title">
      <span class="section-icon">✦</span> 励志寄语与洞察
    </label>
    <textarea class="plan-form-textarea plan-inspiration-input" placeholder="输入温暖励志且富有哲理的洞察与激励...">${escapeHtml(plan.inspiration || '')}</textarea>
  `;
  container.appendChild(inspSection);

  // 2. Roadmap Steps Section
  const roadmapSection = document.createElement('div');
  roadmapSection.className = 'plan-form-section';

  const roadmapTitle = document.createElement('div');
  roadmapTitle.className = 'plan-section-title';
  roadmapTitle.innerHTML = `<span class="section-icon">✦</span> 行动路线图（阶段规划）`;

  const stepsList = document.createElement('div');
  stepsList.className = 'roadmap-steps-list';

  function createStepEditor(step: AIPlanPhase = {}, index = 0): HTMLElement {
    const stepCard = document.createElement('div');
    stepCard.className = 'roadmap-step-editor';

    stepCard.innerHTML = `
      <div class="roadmap-step-header">
        <span class="step-num-badge">${PHASE_LABEL} ${index + 1}</span>
        <button type="button" class="btn-remove-step">✕ 删除阶段</button>
      </div>
      <div class="step-grid-2">
        <div class="field">
          <span class="field-label">阶段名称</span>
          <input type="text" class="plan-form-input step-phase-input" placeholder="如: 准备阶段" value="${escapeHtml(step.phase || '')}">
        </div>
        <div class="field">
          <span class="field-label">预计周期</span>
          <input type="text" class="plan-form-input step-timeline-input" placeholder="如: 第 1 - 2 周" value="${escapeHtml(step.timeline || '')}">
        </div>
      </div>
      <div class="field">
        <span class="field-label">阶段主题</span>
        <input type="text" class="plan-form-input step-title-input" placeholder="输入阶段核心主题..." value="${escapeHtml(step.title || '')}">
      </div>
      <div class="field">
        <span class="field-label">具体行动方案</span>
        <textarea class="plan-form-textarea step-action-input" placeholder="详细说明本阶段需执行的具体步骤...">${escapeHtml(step.action || '')}</textarea>
      </div>
    `;

    stepCard.querySelector('.btn-remove-step')?.addEventListener('click', () => {
      stepCard.remove();
      updateStepBadges();
    });

    return stepCard;
  }

  function updateStepBadges(): void {
    stepsList.querySelectorAll('.roadmap-step-editor').forEach((card, idx) => {
      const badge = card.querySelector('.step-num-badge');
      if (badge) badge.textContent = `${PHASE_LABEL} ${idx + 1}`;
    });
  }

  const initialRoadmap = Array.isArray(plan.roadmap) ? plan.roadmap : [];
  initialRoadmap.forEach((step, idx) => {
    stepsList.appendChild(createStepEditor(step, idx));
  });

  const addStepBtn = document.createElement('button');
  addStepBtn.type = 'button';
  addStepBtn.className = 'btn-add-item';
  addStepBtn.innerHTML = `<span>+</span> 添加行动阶段`;
  addStepBtn.addEventListener('click', () => {
    const currentCount = stepsList.querySelectorAll('.roadmap-step-editor').length;
    stepsList.appendChild(createStepEditor({}, currentCount));
  });

  roadmapSection.appendChild(roadmapTitle);
  roadmapSection.appendChild(stepsList);
  roadmapSection.appendChild(addStepBtn);
  container.appendChild(roadmapSection);

  function createTextListSection({ title, values, inputClass, placeholder, addLabel }: CreateTextListOptions): HTMLElement {
    const section = document.createElement('div');
    section.className = 'plan-form-section';
    section.innerHTML = `
      <label class="plan-section-title">
        <span class="section-icon">✦</span> ${title}
      </label>
    `;

    const list = document.createElement('div');
    list.className = 'dynamic-items-list';

    const createRow = (text = ''): HTMLElement => {
      const row = document.createElement('div');
      row.className = 'dynamic-item-row';
      row.innerHTML = `
        <input type="text" class="plan-form-input ${inputClass}" placeholder="${placeholder}" value="${escapeHtml(text)}">
        <button type="button" class="btn-remove-item" title="删除项">✕</button>
      `;
      row.querySelector('.btn-remove-item')?.addEventListener('click', () => row.remove());
      return row;
    };

    (Array.isArray(values) ? values : []).forEach(value => list.appendChild(createRow(value)));

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn-add-item';
    addButton.textContent = `＋ ${addLabel}`;
    addButton.addEventListener('click', () => list.appendChild(createRow()));

    section.appendChild(list);
    section.appendChild(addButton);
    return section;
  }

  container.appendChild(
    createTextListSection({
      title: '关键微习惯与工具',
      values: plan.habitsAndTools,
      inputClass: 'habit-item-input',
      placeholder: '输入建议养成的微习惯或推荐工具...',
      addLabel: '添加微习惯/工具'
    })
  );
  container.appendChild(
    createTextListSection({
      title: '避坑指南与应对策略',
      values: plan.pitfalls,
      inputClass: 'pitfall-item-input',
      placeholder: '输入可能遇到的坑及对应解决办法...',
      addLabel: '添加避坑指南'
    })
  );

  // 5. First Step Section
  const firstStepSection = document.createElement('div');
  firstStepSection.className = 'plan-form-section';
  firstStepSection.innerHTML = `
    <label class="plan-section-title">
      <span class="section-icon">✦</span> 24小时内第一步
    </label>
    <textarea class="plan-form-textarea plan-firststep-input" placeholder="24 小时内可以立即开始并完成的第一小步...">${escapeHtml(plan.firstStep || '')}</textarea>
  `;
  container.appendChild(firstStepSection);

  // Optional JSON Debug Toggle
  const jsonDebugToggle = document.createElement('details');
  jsonDebugToggle.className = 'json-debug-toggle';
  const debugSummary = document.createElement('summary');
  debugSummary.textContent = '🔍 查看/调试 原始 JSON 数据';
  const jsonArea = document.createElement('textarea');
  jsonArea.className = 'json-debug-textarea';
  jsonArea.readOnly = true;
  jsonArea.value = JSON.stringify(plan, null, 2);

  jsonDebugToggle.appendChild(debugSummary);
  jsonDebugToggle.appendChild(jsonArea);
  container.appendChild(jsonDebugToggle);

  function collectValues(selector: string): string[] {
    return Array.from(container.querySelectorAll<HTMLInputElement>(selector))
      .map(input => input.value.trim())
      .filter(Boolean);
  }

  function getAiPlan(): AIPlan {
    const inspirationInput = container.querySelector('.plan-inspiration-input') as HTMLTextAreaElement | null;
    const firstStepInput = container.querySelector('.plan-firststep-input') as HTMLTextAreaElement | null;
    const inspiration = inspirationInput ? inspirationInput.value.trim() : '';
    const firstStep = firstStepInput ? firstStepInput.value.trim() : '';

    const roadmap: AIPlanPhase[] = [];
    container.querySelectorAll('.roadmap-step-editor').forEach(stepCard => {
      const phaseInput = stepCard.querySelector('.step-phase-input') as HTMLInputElement | null;
      const timelineInput = stepCard.querySelector('.step-timeline-input') as HTMLInputElement | null;
      const titleInput = stepCard.querySelector('.step-title-input') as HTMLInputElement | null;
      const actionInput = stepCard.querySelector('.step-action-input') as HTMLTextAreaElement | null;

      const phase = phaseInput ? phaseInput.value.trim() : '';
      const timeline = timelineInput ? timelineInput.value.trim() : '';
      const title = titleInput ? titleInput.value.trim() : '';
      const action = actionInput ? actionInput.value.trim() : '';

      if (phase || timeline || title || action) {
        roadmap.push({ phase, timeline, title, action });
      }
    });

    const updatedPlan: AIPlan = {
      inspiration,
      roadmap,
      habitsAndTools: collectValues('.habit-item-input'),
      pitfalls: collectValues('.pitfall-item-input'),
      firstStep
    };

    jsonArea.value = JSON.stringify(updatedPlan, null, 2);
    return updatedPlan;
  }

  return { element: container, getAiPlan };
}
