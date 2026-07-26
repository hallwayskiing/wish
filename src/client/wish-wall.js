import { escapeHtml } from './ui.js';

const PAGE_LIMIT = 6;
let posterModulePromise;

function loadPosterModule() {
  posterModulePromise ||= import('./poster.js').catch(error => {
    posterModulePromise = null;
    throw error;
  });
  return posterModulePromise;
}

export function createWishWall({
  api,
  getLanguage,
  openPlanModal,
  openPosterModal,
  scrollToSection,
  showToast,
  t
}) {
  const filterPills = document.getElementById('wallFilterPills');
  const searchInput = document.getElementById('searchInput');
  const refreshButton = document.getElementById('refreshWallBtn');
  const grid = document.getElementById('wishGrid');
  const pagination = document.getElementById('wallPagination');
  const section = document.getElementById('wish-wall');

  let activeFilter = 'all';
  let currentPage = 1;
  let totalPages = 1;
  let wishes = [];
  let searchTimeout;

  function renderMessage(icon, message, withPanel = false) {
    grid.innerHTML = `
      <div class="empty-wall${withPanel ? ' glass-panel' : ''}">
        <div class="empty-icon">${icon}</div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderGrid() {
    if (!wishes.length) {
      renderMessage('🌟', t('wallEmpty'), true);
      return;
    }

    const language = getLanguage();
    const cards = wishes.map(wish => {
      const card = document.createElement('div');
      card.className = 'wish-card glass-panel';
      const date = new Date(wish.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });
      const inspiration = wish.aiPlan?.inspiration || t('inspirationFallback');

      card.innerHTML = `
        <div>
          <div class="card-top">
            <span class="card-cat-badge">${escapeHtml(t('categoryNames')[wish.category] || t('wishFallback'))}</span>
            <span class="card-date">${date}</span>
          </div>
          <h3 class="card-wish-text">“${escapeHtml(wish.title)}”</h3>
          <div class="card-ai-preview">
            <div class="preview-label">${escapeHtml(t('inspirationLabel'))}</div>
            <div class="preview-text">${escapeHtml(inspiration)}</div>
          </div>
        </div>
        <div class="card-bottom">
          <button class="btn-bless" data-wish-id="${escapeHtml(wish.id)}">
            <span class="bless-label">${escapeHtml(t('bless'))}</span>
            <span class="bless-count">${wish.blessings || 0}</span>
          </button>
          <button class="btn-share" data-wish-id="${escapeHtml(wish.id)}">
            <span class="share-icon" aria-hidden="true">↗</span>
            <span>${escapeHtml(t('sharePoster'))}</span>
          </button>
          <button class="btn-view-plan" data-wish-id="${escapeHtml(wish.id)}">${escapeHtml(t('viewPlan'))}</button>
        </div>
      `;
      return card;
    });
    grid.replaceChildren(...cards);
  }

  function createPageButton(label, targetPage, options = {}) {
    const button = document.createElement('button');
    button.className = `page-btn${options.active ? ' active' : ''}`;
    button.textContent = label;
    button.disabled = options.disabled;
    button.addEventListener('click', () => goToPage(targetPage));
    return button;
  }

  function renderPagination() {
    if (totalPages <= 1) {
      pagination.replaceChildren();
      return;
    }
    const buttons = [createPageButton(t('prevPage'), currentPage - 1, { disabled: currentPage <= 1 })];
    for (let page = 1; page <= totalPages; page += 1) {
      buttons.push(createPageButton(String(page), page, { active: page === currentPage }));
    }
    buttons.push(createPageButton(t('nextPage'), currentPage + 1, { disabled: currentPage >= totalPages }));
    pagination.replaceChildren(...buttons);
  }

  async function load({ firstPage = false } = {}) {
    if (firstPage) currentPage = 1;
    try {
      const result = await api.getWishes(
        activeFilter,
        searchInput.value.trim(),
        currentPage,
        PAGE_LIMIT
      );
      wishes = result.wishes || [];
      totalPages = result.totalPages || 1;
      currentPage = result.page || 1;
      renderGrid();
      renderPagination();
    } catch (error) {
      console.error('Failed to load wish wall:', error);
      renderMessage('🪐', t('wallLoadError'));
      pagination.replaceChildren();
    }
  }

  function goToPage(page) {
    if (page === currentPage || page < 1 || page > totalPages) return;
    currentPage = page;
    load();
    scrollToSection(section);
  }

  filterPills.addEventListener('click', event => {
    const pill = event.target.closest('.filter-pill');
    if (!pill) return;
    filterPills.querySelector('.filter-pill.active')?.classList.remove('active');
    pill.classList.add('active');
    activeFilter = pill.dataset.filter;
    load({ firstPage: true });
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => load({ firstPage: true }), 300);
  });

  refreshButton.addEventListener('click', async () => {
    clearTimeout(searchTimeout);
    refreshButton.disabled = true;
    refreshButton.classList.add('loading');
    try {
      await load();
    } finally {
      refreshButton.disabled = false;
      refreshButton.classList.remove('loading');
    }
  });

  grid.addEventListener('click', async event => {
    const button = event.target.closest('button[data-wish-id]');
    if (!button) return;
    const wish = wishes.find(item => item.id === button.dataset.wishId);
    if (!wish) return;

    if (button.classList.contains('btn-share')) {
      button.disabled = true;
      try {
        const { createWishPoster } = await loadPosterModule();
        const poster = await createWishPoster(wish, { language: getLanguage(), t });
        openPosterModal(poster.blob, poster.filename);
      } catch (error) {
        console.error('Poster generation failed:', error);
        showToast(t('posterError'));
      } finally {
        button.disabled = false;
      }
      return;
    }

    if (button.classList.contains('btn-view-plan')) {
      openPlanModal(wish);
      return;
    }
    if (!button.classList.contains('btn-bless') || button.disabled) return;

    const label = button.querySelector('.bless-label');
    const originalText = label.textContent;
    button.style.minWidth = `${button.offsetWidth}px`;
    label.textContent = '↻';
    button.disabled = true;
    button.classList.add('loading');
    try {
      const result = await api.blessWish(wish.id);
      wish.blessings = result.blessings;
      button.querySelector('.bless-count').textContent = result.blessings;
      button.classList.add('blessed');
      showToast(t('blessSuccess'));
    } catch {
      showToast(t('blessError'));
    } finally {
      label.textContent = originalText;
      button.classList.remove('loading');
      button.disabled = false;
      button.style.minWidth = '';
    }
  });

  return { load, render: renderGrid };
}
