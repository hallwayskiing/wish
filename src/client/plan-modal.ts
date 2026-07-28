import { getCategoryName } from '../categories.js';
import { WishAPI } from './api.js';
import { Language, TranslateFn, Wish } from './types.js';
import { bindModalBackdrop, escapeHtml, hideModal, requireElement, showModal } from './ui.js';

interface CreatePlanModalOptions {
  api: typeof WishAPI;
  getLanguage: () => Language;
  onSaved: () => Promise<void>;
  showToast: (message: string) => void;
  t: TranslateFn;
}

export interface PlanModalController {
  open: (wish: Wish, draft?: boolean) => void;
  rerender: () => void;
}

interface PlanRoadmapStep {
  phase?: string;
  title?: string;
  action?: string;
  timeline?: string;
}

export function createPlanModal({ api, getLanguage, onSaved, showToast, t }: CreatePlanModalOptions): PlanModalController {
  const modal = requireElement('planModal');
  const content = requireElement('modalWishContent');
  const categoryBadge = requireElement('modalCategoryBadge');
  const wishTitle = requireElement('modalWishTitle');
  const wishTime = requireElement('modalWishTime');
  const inspiration = requireElement('planInspiration');
  const roadmap = requireElement('planRoadmap');
  const habits = requireElement('planHabits');
  const pitfalls = requireElement('planPitfalls');
  const firstStep = requireElement('planFirstStep');
  const footer = requireElement('planModalFooter');
  const saveButton = requireElement<HTMLButtonElement>('saveWishBtn');

  let currentWish: Wish | null = null;
  let isDraft = false;

  function phaseHeading(step: PlanRoadmapStep, index: number): string {
    const label = `${t('phaseLabel')} ${index + 1}`;
    const phaseName = typeof step.phase === 'string' ? step.phase.trim() : '';
    return phaseName ? `${label} · ${phaseName}` : label;
  }

  function renderTextList(container: HTMLElement, items?: string[]): void {
    const elements = (Array.isArray(items) ? items : []).map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    });
    container.replaceChildren(...elements);
  }

  function render(): void {
    if (!currentWish) return;
    const plan = currentWish.aiPlan || {};
    footer.classList.toggle('hidden', !isDraft);
    categoryBadge.textContent = getCategoryName(currentWish.category, getLanguage(), t('beautifulWish'));
    wishTitle.textContent = `“${currentWish.title}”`;

    const date = new Date(currentWish.createdAt).toLocaleString(
      getLanguage() === 'en' ? 'en-US' : 'zh-CN',
      { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    );
    wishTime.textContent = `${t('wishTime')}: ${date}`;
    inspiration.textContent = `“${plan.inspiration || t('inspirationFallback')}”`;

    const rawSteps = plan.roadmap || plan.phases || [];
    const steps = rawSteps.map((step, index) => {
      const element = document.createElement('div');
      element.className = 'roadmap-step-card';
      element.innerHTML = `
        <div class="step-header">
          <span class="step-phase">${escapeHtml(phaseHeading(step, index))}</span>
          <span class="step-timeline">⏱️ ${escapeHtml(step.timeline || t('timelineFallback'))}</span>
        </div>
        <div class="step-title">${escapeHtml(step.title || step.name || t('taskFallback'))}</div>
        <div class="step-action">${escapeHtml(step.action || (Array.isArray(step.tasks) ? step.tasks.join('; ') : ''))}</div>
      `;
      return element;
    });
    roadmap.replaceChildren(...steps);
    renderTextList(habits, plan.habitsAndTools || plan.habits);
    renderTextList(pitfalls, plan.pitfalls);
    firstStep.textContent = plan.firstStep || t('firstStepFallback');
  }

  function open(wish: Wish, draft = false): void {
    currentWish = wish;
    isDraft = draft;
    render();
    showModal(modal);
    modal.scrollTop = 0;
    content.scrollTop = 0;
  }

  function close(): void {
    hideModal(modal);
    modal.scrollTop = 0;
    content.scrollTop = 0;
    currentWish = null;
    isDraft = false;
  }

  document.getElementById('closePlanModalBtn')?.addEventListener('click', close);
  document.getElementById('closeDraftBtn')?.addEventListener('click', close);
  bindModalBackdrop(modal, close);

  saveButton.addEventListener('click', async () => {
    if (!isDraft || !currentWish) return;
    saveButton.disabled = true;
    saveButton.textContent = t('saving');
    try {
      await api.saveWish(currentWish, getLanguage());
      showToast(t('wishSaved'));
      close();
      await onSaved();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      showToast(`⚠️ ${message || t('saveError')}`);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = t('save');
    }
  });

  return { open, rerender: render };
}
