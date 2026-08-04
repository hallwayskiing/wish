import { getCategoryName } from '../categories.js';
import { WishAPI } from './api.js';
import { createWishPoster } from './poster.js';
import { Language, TranslateFn, Wish } from './types.js';
import { escapeHtml, requireElement } from './ui.js';

const PAGE_LIMIT = 6;
let posterModulePromise: Promise<{ createWishPoster: typeof createWishPoster }> | null = null;

function loadPosterModule(): Promise<{ createWishPoster: typeof createWishPoster }> {
  posterModulePromise ||= import('./poster.js').catch(error => {
    posterModulePromise = null;
    throw error;
  });
  return posterModulePromise;
}

interface CreateWishWallOptions {
  api: typeof WishAPI;
  getLanguage: () => Language;
  openPlanModal: (wish: Wish) => void;
  openPosterModal: (blob: Blob, filename: string) => void;
  scrollToSection: (element: HTMLElement) => void;
  showToast: (message: string) => void;
  t: TranslateFn;
}

export interface WishWallController {
  load: (options?: { firstPage?: boolean }) => Promise<void>;
  render: () => void;
}

interface PageButtonOptions {
  active?: boolean;
  disabled?: boolean;
}

export function createWishWall({
  api,
  getLanguage,
  openPlanModal,
  openPosterModal,
  scrollToSection,
  showToast,
  t
}: CreateWishWallOptions): WishWallController {
  const filterPills = requireElement('wallFilterPills');
  const searchInput = requireElement<HTMLInputElement>('searchInput');
  const refreshButton = requireElement<HTMLButtonElement>('refreshWallBtn');
  const showCompletedCheckbox = requireElement<HTMLInputElement>('showCompletedCheckbox');
  const grid = requireElement('wishGrid');
  const pagination = requireElement('wallPagination');
  const section = requireElement('wish-wall');

  let activeFilter = 'all';
  let currentPage = 1;
  let totalPages = 1;
  let wishes: Wish[] = [];
  let searchTimeout: ReturnType<typeof setTimeout> | undefined;

  function renderMessage(icon: string, message: string, withPanel = false): void {
    grid.innerHTML = `
      <div class="empty-wall${withPanel ? ' glass-panel' : ''}">
        <div class="empty-icon">${icon}</div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderGrid(pageWishes: Wish[]): void {
    if (!pageWishes.length) {
      renderMessage('🌟', t('wallEmpty'), true);
      return;
    }

    const language = getLanguage();
    const cards = pageWishes.map(wish => {
      const card = document.createElement('div');
      card.className = `wish-card glass-panel${wish.status === 'completed' ? ' wish-completed-card' : ''}`;
      const date = new Date(wish.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });
      const inspiration = wish.aiPlan?.inspiration || t('inspirationFallback');
      const categoryName = getCategoryName(wish.category, language, t('wishFallback'));
      const statusBadge = wish.status === 'completed'
        ? `<span class="card-completed-badge">🎉 ${escapeHtml(t('completedBadge'))}</span>`
        : '';

      card.innerHTML = `
        <div>
          <div class="card-top">
            <span class="card-cat-badge">${escapeHtml(categoryName)}</span>
            ${statusBadge}
            <span class="card-date">${date}</span>
          </div>
          <h3 class="card-wish-text">“${escapeHtml(wish.title)}”</h3>
          <div class="card-ai-preview">
            <div class="preview-label"><span aria-hidden="true">✨</span> ${escapeHtml(t('inspirationTitle'))}</div>
            <div class="preview-text">${escapeHtml(inspiration)}</div>
          </div>
        </div>
        <div class="card-bottom">
          <button class="btn-bless" data-wish-id="${escapeHtml(wish.id)}">
            <span class="bless-icon" aria-hidden="true">✨</span>
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

  function createPageButton(label: string, targetPage: number, options: PageButtonOptions = {}): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `page-btn${options.active ? ' active' : ''}`;
    button.textContent = label;
    button.disabled = Boolean(options.disabled);
    button.addEventListener('click', () => goToPage(targetPage));
    return button;
  }

  function renderPagination(): void {
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

  function renderWall(): void {
    const isShowCompleted = showCompletedCheckbox.checked;
    let filteredWishes = wishes.filter(wish =>
      isShowCompleted ? wish.status === 'completed' : wish.status !== 'completed'
    );

    if (activeFilter !== 'all') {
      filteredWishes = filteredWishes.filter(wish => wish.category === activeFilter);
    }

    totalPages = Math.max(1, Math.ceil(filteredWishes.length / PAGE_LIMIT));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * PAGE_LIMIT;
    const pageWishes = filteredWishes.slice(start, start + PAGE_LIMIT);

    renderGrid(pageWishes);
    renderPagination();
  }

  let activeAbortController: AbortController | null = null;

  async function load({ firstPage = false }: { firstPage?: boolean } = {}): Promise<void> {
    if (firstPage) currentPage = 1;
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();
    const { signal } = activeAbortController;

    try {
      const result = await api.getWishes(
        'all',
        searchInput.value.trim(),
        undefined,
        undefined,
        'all',
        signal
      );
      wishes = result.wishes || [];
      renderWall();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Failed to load wish wall:', error);
      renderMessage('🪐', t('wallLoadError'));
      pagination.replaceChildren();
    }
  }

  function goToPage(page: number): void {
    if (page === currentPage || page < 1 || page > totalPages) return;
    currentPage = page;
    renderWall();
    scrollToSection(section);
  }

  filterPills.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const pill = target?.closest('.filter-pill') as HTMLElement | null;
    if (!pill) return;
    filterPills.querySelector('.filter-pill.active')?.classList.remove('active');
    pill.classList.add('active');
    activeFilter = pill.dataset.filter || 'all';
    currentPage = 1;
    renderWall();
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

  showCompletedCheckbox.addEventListener('change', () => {
    currentPage = 1;
    renderWall();
  });

  grid.addEventListener('click', async (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button[data-wish-id]') as HTMLButtonElement | null;
    if (!button) return;
    const wish = wishes.find(item => item.id === button.dataset.wishId);
    if (!wish) return;

    if (button.classList.contains('btn-share')) {
      button.disabled = true;
      try {
        const { createWishPoster: generatePoster } = await loadPosterModule();
        const poster = await generatePoster(wish, { language: getLanguage(), t });
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

    const iconEl = button.querySelector('.bless-icon') as HTMLElement | null;
    const originalIcon = iconEl ? iconEl.textContent || '✨' : '✨';

    button.disabled = true;
    button.classList.add('loading');
    if (iconEl) iconEl.textContent = '↻';

    try {
      const result = await api.blessWish(wish.id);
      wish.blessings = result.blessings;
      const countEl = button.querySelector('.bless-count');
      if (countEl) countEl.textContent = String(result.blessings);
      button.classList.add('blessed');
      showToast(t('blessSuccess'));
    } catch {
      showToast(t('blessError'));
    } finally {
      if (iconEl) iconEl.textContent = originalIcon;
      button.classList.remove('loading');
      button.disabled = false;
    }
  });

  return { load, render: renderWall };
}

