import './particles.js';
import './styles/style.css';
import './styles/wish.css';
import './styles/modal.css';
import './styles/wall.css';
import { getCategoryLabel } from '../categories.js';
import { WishAPI } from './api.js';
import { createPlanModal } from './plan-modal.js';
import { translate, translations } from './translations.js';
import { Language, Wish } from './types.js';
import { bindModalBackdrop, hideModal, queryElement, requireElement, showModal, showToast } from './ui.js';
import { createWishWall, WishWallController } from './wish-wall.js';

function initApp(): void {
  // --- DOM Elements Context ---
  const elements = {
    wishInput: requireElement<HTMLTextAreaElement>('wishInput'),
    charCount: requireElement('charCount'),
    submitWishBtn: requireElement<HTMLButtonElement>('submitWishBtn'),
    categoryPills: requireElement('categoryPills'),

    loadingOverlay: requireElement('loadingOverlay'),
    loadingStatusText: requireElement('loadingStatusText'),
    progressFill: requireElement('progressFill'),

    apiKeyModal: requireElement('apiKeyModal'),
    openApiKeyModalBtn: requireElement('openApiKeyModalBtn'),
    closeApiKeyModalBtn: requireElement('closeApiKeyModalBtn'),
    apiKeyInput: requireElement<HTMLInputElement>('apiKeyInput'),
    saveApiKeyBtn: requireElement('saveApiKeyBtn'),
    clearApiKeyBtn: requireElement('clearApiKeyBtn'),

    posterModal: requireElement('posterModal'),
    closePosterModalBtn: requireElement('closePosterModalBtn'),
    cancelPosterBtn: requireElement('cancelPosterBtn'),
    downloadPosterBtn: requireElement('downloadPosterBtn'),
    posterPreviewImage: requireElement<HTMLImageElement>('posterPreviewImage'),

    languageToggleBtn: requireElement('languageToggleBtn'),
    appHeader: queryElement('.app-header'),
    navWish: requireElement<HTMLAnchorElement>('nav-wish'),
    navWall: requireElement<HTMLAnchorElement>('nav-wall'),
    wishWallSection: requireElement('wish-wall')
  };

  // --- State ---
  let currentCategory = 'growth';
  let posterObjectUrl = '';
  let posterFilename = '';
  let customApiKey = localStorage.getItem('gemini_api_key') || '';
  let currentLanguage: Language = localStorage.getItem('wish_language') === 'en' ? 'en' : 'zh';

  // Helper functions for i18n
  const t = (key: string): string => translate(currentLanguage, key);
  const getWishExample = (): string => {
    const dict = translations[currentLanguage].placeholders;
    return dict[currentCategory] || '';
  };
  const getWishPlaceholder = (): string => `${getWishExample()}...`;

  let wall: WishWallController;
  const plan = createPlanModal({
    api: WishAPI,
    getLanguage: () => currentLanguage,
    onSaved: async () => wall.load({ firstPage: true }),
    showToast,
    t
  });
  wall = createWishWall({
    api: WishAPI,
    getLanguage: () => currentLanguage,
    openPlanModal: (wish: Wish) => plan.open(wish),
    openPosterModal,
    scrollToSection,
    showToast,
    t
  });

  // --- Apply Language Updates to DOM ---
  function applyLanguage(refreshWall = false): void {
    const isEn = currentLanguage === 'en';
    document.documentElement.lang = isEn ? 'en' : 'zh-CN';
    document.title = t('brand');
    const metaDesc = document.getElementById('pageDescription') as HTMLMetaElement | null;
    if (metaDesc) metaDesc.content = t('pageDescription');

    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
      if (el.dataset.i18n) el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach(el => {
      if (el.dataset.i18nPlaceholder) el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
      if (el.dataset.i18nTitle) el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach(el => {
      if (el.dataset.i18nAriaLabel) el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    });
    document.querySelectorAll<HTMLImageElement>('[data-i18n-alt]').forEach(el => {
      if (el.dataset.i18nAlt) el.alt = t(el.dataset.i18nAlt);
    });
    document.querySelectorAll<HTMLElement>('[data-category-label]').forEach(el => {
      if (el.dataset.categoryLabel) {
        el.textContent = getCategoryLabel(el.dataset.categoryLabel, currentLanguage);
      }
    });

    elements.wishInput.placeholder = getWishPlaceholder();

    plan.rerender();
    if (refreshWall) {
      wall.render();
    }
  }

  // Init API Key & Language
  if (customApiKey) elements.apiKeyInput.value = customApiKey;
  applyLanguage();

  elements.languageToggleBtn.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
    localStorage.setItem('wish_language', currentLanguage);
    applyLanguage(true);
  });

  // --- Position-driven Navigation ---
  const navItems = [elements.navWish, elements.navWall];
  let currentNavItem: HTMLAnchorElement | null = null;
  let navScrollFrame: number | null = null;

  function setActiveNav(nextNavItem: HTMLAnchorElement): void {
    if (nextNavItem === currentNavItem) return;
    currentNavItem = nextNavItem;

    navItems.forEach(navItem => {
      const isActive = navItem === nextNavItem;
      navItem.classList.toggle('active', isActive);
      if (isActive) navItem.setAttribute('aria-current', 'location');
      else navItem.removeAttribute('aria-current');
    });
  }

  function updateActiveNav(): void {
    navScrollFrame = null;
    const readingLine = Math.min(window.innerHeight * 0.4, 300);
    const isWallActive = elements.wishWallSection.getBoundingClientRect().top <= readingLine;
    setActiveNav(isWallActive ? elements.navWall : elements.navWish);
  }

  function scheduleActiveNavUpdate(): void {
    if (navScrollFrame !== null) return;
    navScrollFrame = requestAnimationFrame(updateActiveNav);
  }

  function scrollToSection(section: HTMLElement): void {
    const headerHeight = elements.appHeader.getBoundingClientRect().height;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, sectionTop - headerHeight),
      behavior: 'smooth'
    });
  }

  navItems.forEach(navLink => {
    navLink.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault();
      const targetId = navLink.hash.slice(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) scrollToSection(targetSection);
    });
  });

  window.addEventListener('scroll', scheduleActiveNavUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveNavUpdate);
  updateActiveNav();

  // --- Category Selection ---
  elements.categoryPills.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const pill = target?.closest('.cat-pill') as HTMLElement | null;
    if (!pill) return;
    elements.categoryPills.querySelector('.cat-pill.active')?.classList.remove('active');
    pill.classList.add('active');
    currentCategory = pill.dataset.cat || 'growth';
    elements.wishInput.placeholder = getWishPlaceholder();
  });

  // Character Counter
  elements.wishInput.addEventListener('input', () => {
    elements.charCount.textContent = `${elements.wishInput.value.length}/300`;
  });

  // API Key Modal Events
  elements.openApiKeyModalBtn.addEventListener('click', () => showModal(elements.apiKeyModal));
  elements.closeApiKeyModalBtn.addEventListener('click', () => hideModal(elements.apiKeyModal));
  bindModalBackdrop(elements.apiKeyModal, () => hideModal(elements.apiKeyModal));

  function closePosterModal(): void {
    hideModal(elements.posterModal);
    elements.posterPreviewImage.removeAttribute('src');
    if (posterObjectUrl) URL.revokeObjectURL(posterObjectUrl);
    posterObjectUrl = '';
    posterFilename = '';
  }

  function openPosterModal(blob: Blob, filename: string): void {
    closePosterModal();
    posterObjectUrl = URL.createObjectURL(blob);
    posterFilename = filename;
    elements.posterPreviewImage.src = posterObjectUrl;
    showModal(elements.posterModal);
  }

  elements.closePosterModalBtn.addEventListener('click', closePosterModal);
  elements.cancelPosterBtn.addEventListener('click', closePosterModal);
  bindModalBackdrop(elements.posterModal, closePosterModal);
  elements.downloadPosterBtn.addEventListener('click', () => {
    if (!posterObjectUrl) return;
    const link = document.createElement('a');
    link.href = posterObjectUrl;
    link.download = posterFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(t('posterDownloaded'));
  });

  function saveApiKey(value: string): void {
    customApiKey = value;
    if (value) {
      localStorage.setItem('gemini_api_key', value);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    showToast(t(value ? 'apiKeySaved' : 'apiKeyCleared'));
    hideModal(elements.apiKeyModal);
  }

  elements.saveApiKeyBtn.addEventListener('click', () => {
    saveApiKey(elements.apiKeyInput.value.trim());
  });

  elements.clearApiKeyBtn.addEventListener('click', () => {
    elements.apiKeyInput.value = '';
    saveApiKey('');
  });

  // --- Submit Wish ---
  elements.submitWishBtn.addEventListener('click', async () => {
    const wishText = elements.wishInput.value.trim() || getWishExample();
    startLoadingAnimation();

    try {
      const res = await WishAPI.submitWish(wishText, currentCategory, customApiKey, currentLanguage);
      finishLoadingAnimation(() => {
        plan.open(res.wish, true);
        elements.wishInput.value = '';
        elements.charCount.textContent = '0/300';
      });
    } catch (err: unknown) {
      stopLoadingAnimation();
      const message = err instanceof Error ? err.message : '';
      showToast(`❌ ${message || t('generationError')}`);
    }
  });

  // --- Loading Animation Controller ---
  let progressInterval: ReturnType<typeof setInterval> | null = null;

  function clearLoadingInterval(): void {
    if (progressInterval !== null) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function startLoadingAnimation(): void {
    clearLoadingInterval();
    elements.submitWishBtn.disabled = true;
    const statusPhrases = translations[currentLanguage].loadingPhrases;
    showModal(elements.loadingOverlay);
    elements.progressFill.style.width = '5%';
    elements.loadingStatusText.textContent = statusPhrases[0];
    let pct = 5;
    let phraseIdx = 0;

    progressInterval = setInterval(() => {
      if (pct < 90) {
        pct = Math.min(90, pct + Math.floor(Math.random() * 8) + 3);
        elements.progressFill.style.width = `${pct}%`;

        const nextPhraseIdx = Math.min(statusPhrases.length - 1, Math.floor(pct / 25));
        if (nextPhraseIdx !== phraseIdx) {
          phraseIdx = nextPhraseIdx;
          elements.loadingStatusText.textContent = statusPhrases[phraseIdx];
        }
      }
    }, 300);
  }

  function finishLoadingAnimation(callback: () => void): void {
    clearLoadingInterval();
    elements.progressFill.style.width = '100%';
    elements.loadingStatusText.textContent = t('generationComplete');
    setTimeout(() => {
      hideModal(elements.loadingOverlay);
      elements.submitWishBtn.disabled = false;
      callback();
    }, 450);
  }

  function stopLoadingAnimation(): void {
    clearLoadingInterval();
    hideModal(elements.loadingOverlay);
    elements.submitWishBtn.disabled = false;
  }

  wall.load();
}

initApp();
