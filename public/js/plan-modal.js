import { bindModalBackdrop, escapeHtml, hideModal, showModal } from './ui.js?v=3.0.0';

export function createPlanModal({ api, getLanguage, onSaved, showToast, t }) {
  const modal = document.getElementById('planModal');
  const content = document.getElementById('modalWishContent');
  const categoryBadge = document.getElementById('modalCategoryBadge');
  const wishTitle = document.getElementById('modalWishTitle');
  const wishTime = document.getElementById('modalWishTime');
  const inspiration = document.getElementById('planInspiration');
  const roadmap = document.getElementById('planRoadmap');
  const habits = document.getElementById('planHabits');
  const pitfalls = document.getElementById('planPitfalls');
  const firstStep = document.getElementById('planFirstStep');
  const footer = document.getElementById('planModalFooter');
  const saveButton = document.getElementById('saveWishBtn');

  let currentWish;
  let isDraft = false;

  function phaseHeading(step, index) {
    const label = getLanguage() === 'en' ? `Phase ${index + 1}` : `阶段 ${index + 1}`;
    const phaseName = typeof step.phase === 'string' ? step.phase.trim() : '';
    return phaseName ? `${label} · ${phaseName}` : label;
  }

  function renderTextList(container, items) {
    const elements = (Array.isArray(items) ? items : []).map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    });
    container.replaceChildren(...elements);
  }

  function render() {
    if (!currentWish) return;
    const plan = currentWish.aiPlan || {};
    footer.classList.toggle('hidden', !isDraft);
    categoryBadge.textContent = t('categoryNames')[currentWish.category] || t('beautifulWish');
    wishTitle.textContent = `“${currentWish.title}”`;

    const date = new Date(currentWish.createdAt).toLocaleString(
      getLanguage() === 'en' ? 'en-US' : 'zh-CN',
      { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    );
    wishTime.textContent = `${t('wishTime')}: ${date}`;
    inspiration.textContent = `“${plan.inspiration || t('inspirationFallback')}”`;

    const steps = (Array.isArray(plan.roadmap) ? plan.roadmap : []).map((step, index) => {
      const element = document.createElement('div');
      element.className = 'roadmap-step-card';
      element.innerHTML = `
        <div class="step-header">
          <span class="step-phase">${escapeHtml(phaseHeading(step, index))}</span>
          <span class="step-timeline">⏱️ ${escapeHtml(step.timeline || t('timelineFallback'))}</span>
        </div>
        <div class="step-title">${escapeHtml(step.title || t('taskFallback'))}</div>
        <div class="step-action">${escapeHtml(step.action || '')}</div>
      `;
      return element;
    });
    roadmap.replaceChildren(...steps);
    renderTextList(habits, plan.habitsAndTools);
    renderTextList(pitfalls, plan.pitfalls);
    firstStep.textContent = plan.firstStep || t('firstStepFallback');
  }

  function open(wish, draft = false) {
    currentWish = wish;
    isDraft = draft;
    render();
    showModal(modal);
    modal.scrollTop = 0;
    content.scrollTop = 0;
  }

  function close() {
    hideModal(modal);
    modal.scrollTop = 0;
    content.scrollTop = 0;
    currentWish = null;
    isDraft = false;
  }

  document.getElementById('closePlanModalBtn').addEventListener('click', close);
  document.getElementById('closeDraftBtn').addEventListener('click', close);
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
    } catch (error) {
      showToast(`⚠️ ${error.message || t('saveError')}`);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = t('save');
    }
  });

  return { open, rerender: render };
}
