import './particles.js';
import './styles/style.css';
import './styles/wish.css';
import './styles/modal.css';
import './styles/wall.css';
import { getCategoryLabel } from '../categories.js';
import { WishAPI } from './api.js';
import { createPlanModal } from './plan-modal.js';
import { translations } from './translations.js';
import { bindModalBackdrop, hideModal, showModal, showToast } from './ui.js';
import { createWishWall } from './wish-wall.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const wishInput = document.getElementById('wishInput');
  const charCount = document.getElementById('charCount');
  const submitWishBtn = document.getElementById('submitWishBtn');
  const categoryPills = document.getElementById('categoryPills');
  
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const progressFill = document.getElementById('progressFill');

  const apiKeyModal = document.getElementById('apiKeyModal');
  const openApiKeyModalBtn = document.getElementById('openApiKeyModalBtn');
  const closeApiKeyModalBtn = document.getElementById('closeApiKeyModalBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');

  const posterModal = document.getElementById('posterModal');
  const closePosterModalBtn = document.getElementById('closePosterModalBtn');
  const cancelPosterBtn = document.getElementById('cancelPosterBtn');
  const downloadPosterBtn = document.getElementById('downloadPosterBtn');
  const posterPreviewImage = document.getElementById('posterPreviewImage');

  const languageToggleBtn = document.getElementById('languageToggleBtn');
  const appHeader = document.querySelector('.app-header');
  const navWish = document.getElementById('nav-wish');
  const navWall = document.getElementById('nav-wall');
  const wishWallSection = document.getElementById('wish-wall');

  // --- State ---
  let currentCategory = 'growth';
  let posterObjectUrl = '';
  let posterFilename = '';
  let customApiKey = localStorage.getItem('gemini_api_key') || '';
  let currentLanguage = localStorage.getItem('wish_language') === 'en' ? 'en' : 'zh';

  // Helper functions for i18n
  const t = key => translations[currentLanguage][key] ?? key;
  const getWishExample = () => t('placeholders')[currentCategory];
  const getWishPlaceholder = () => `${getWishExample()}...`;
  let wall;
  const plan = createPlanModal({
    api: WishAPI,
    getLanguage: () => currentLanguage,
    onSaved: () => wall.load({ firstPage: true }),
    showToast,
    t
  });
  wall = createWishWall({
    api: WishAPI,
    getLanguage: () => currentLanguage,
    openPlanModal: wish => plan.open(wish),
    openPosterModal,
    scrollToSection,
    showToast,
    t
  });

  // --- Apply Language Updates to DOM ---
  function applyLanguage(refreshWall = false) {
    const isEn = currentLanguage === 'en';
    document.documentElement.lang = isEn ? 'en' : 'zh-CN';
    document.title = t('brand');
    document.getElementById('pageDescription').content = t('pageDescription');

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      el.alt = t(el.dataset.i18nAlt);
    });
    document.querySelectorAll('[data-category-label]').forEach(el => {
      el.textContent = getCategoryLabel(el.dataset.categoryLabel, currentLanguage);
    });

    wishInput.placeholder = getWishPlaceholder();

    plan.rerender();
    if (refreshWall) {
      wall.render();
    }
  }

  // Init API Key & Language
  if (customApiKey) apiKeyInput.value = customApiKey;
  applyLanguage();

  languageToggleBtn.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
    localStorage.setItem('wish_language', currentLanguage);
    applyLanguage(true);
  });

  // --- Position-driven Navigation ---
  const navItems = [navWish, navWall];
  let currentNavItem = null;
  let navScrollFrame = null;

  function setActiveNav(nextNavItem) {
    if (nextNavItem === currentNavItem) return;
    currentNavItem = nextNavItem;

    navItems.forEach(navItem => {
      const isActive = navItem === nextNavItem;
      navItem.classList.toggle('active', isActive);
      if (isActive) navItem.setAttribute('aria-current', 'location');
      else navItem.removeAttribute('aria-current');
    });
  }

  function updateActiveNav() {
    navScrollFrame = null;
    const readingLine = Math.min(window.innerHeight * 0.4, 300);
    const isWallActive = wishWallSection.getBoundingClientRect().top <= readingLine;
    setActiveNav(isWallActive ? navWall : navWish);
  }

  function scheduleActiveNavUpdate() {
    if (navScrollFrame !== null) return;
    navScrollFrame = requestAnimationFrame(updateActiveNav);
  }

  function scrollToSection(section) {
    const headerHeight = appHeader.getBoundingClientRect().height;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, sectionTop - headerHeight),
      behavior: 'smooth'
    });
  }

  // Clicking only scrolls; the scroll position remains the sole source of nav state.
  navItems.forEach(navLink => {
    navLink.addEventListener('click', event => {
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
  categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    categoryPills.querySelector('.cat-pill.active')?.classList.remove('active');
    pill.classList.add('active');
    currentCategory = pill.dataset.cat;
    wishInput.placeholder = getWishPlaceholder();
  });

  // Character Counter
  wishInput.addEventListener('input', () => {
    charCount.textContent = `${wishInput.value.length}/300`;
  });

  // API Key Modal Events
  openApiKeyModalBtn.addEventListener('click', () => showModal(apiKeyModal));
  closeApiKeyModalBtn.addEventListener('click', () => hideModal(apiKeyModal));
  bindModalBackdrop(apiKeyModal, () => hideModal(apiKeyModal));

  function closePosterModal() {
    hideModal(posterModal);
    posterPreviewImage.removeAttribute('src');
    if (posterObjectUrl) URL.revokeObjectURL(posterObjectUrl);
    posterObjectUrl = '';
    posterFilename = '';
  }

  function openPosterModal(blob, filename) {
    closePosterModal();
    posterObjectUrl = URL.createObjectURL(blob);
    posterFilename = filename;
    posterPreviewImage.src = posterObjectUrl;
    showModal(posterModal);
  }

  closePosterModalBtn.addEventListener('click', closePosterModal);
  cancelPosterBtn.addEventListener('click', closePosterModal);
  bindModalBackdrop(posterModal, closePosterModal);
  downloadPosterBtn.addEventListener('click', () => {
    if (!posterObjectUrl) return;
    const link = document.createElement('a');
    link.href = posterObjectUrl;
    link.download = posterFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(t('posterDownloaded'));
  });

  function saveApiKey(value) {
    customApiKey = value;
    if (value) {
      localStorage.setItem('gemini_api_key', value);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    showToast(t(value ? 'apiKeySaved' : 'apiKeyCleared'));
    hideModal(apiKeyModal);
  }

  saveApiKeyBtn.addEventListener('click', () => {
    saveApiKey(apiKeyInput.value.trim());
  });

  clearApiKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = '';
    saveApiKey('');
  });

  // --- Submit Wish ---
  submitWishBtn.addEventListener('click', async () => {
    const wishText = wishInput.value.trim() || getWishExample();
    startLoadingAnimation();

    try {
      const res = await WishAPI.submitWish(wishText, currentCategory, customApiKey, currentLanguage);
      finishLoadingAnimation(() => {
        plan.open(res.wish, true);
        wishInput.value = '';
        charCount.textContent = '0/300';
      });
    } catch (err) {
      stopLoadingAnimation();
      showToast(`❌ ${err.message || t('generationError')}`);
    }
  });

  // --- Loading Animation Controller ---
  let progressInterval = null;

  function clearLoadingInterval() {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  function startLoadingAnimation() {
    clearLoadingInterval();
    submitWishBtn.disabled = true;
    const statusPhrases = t('loadingPhrases');
    showModal(loadingOverlay);
    progressFill.style.width = '5%';
    loadingStatusText.textContent = statusPhrases[0];
    let pct = 5;
    let phraseIdx = 0;

    progressInterval = setInterval(() => {
      if (pct < 90) {
        pct = Math.min(90, pct + Math.floor(Math.random() * 8) + 3);
        progressFill.style.width = `${pct}%`;

        const nextPhraseIdx = Math.min(statusPhrases.length - 1, Math.floor(pct / 25));
        if (nextPhraseIdx !== phraseIdx) {
          phraseIdx = nextPhraseIdx;
          loadingStatusText.textContent = statusPhrases[phraseIdx];
        }
      }
    }, 300);
  }

  function finishLoadingAnimation(callback) {
    clearLoadingInterval();
    progressFill.style.width = '100%';
    loadingStatusText.textContent = t('generationComplete');
    setTimeout(() => {
      hideModal(loadingOverlay);
      submitWishBtn.disabled = false;
      callback();
    }, 450);
  }

  function stopLoadingAnimation() {
    clearLoadingInterval();
    hideModal(loadingOverlay);
    submitWishBtn.disabled = false;
  }

  wall.load();

});
