/* ==========================================================================
   Main Application UI Script - 璀璨许愿阁 (Bilingual Cosmic Wish Realizer)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const wishInput = document.getElementById('wishInput');
  const charCount = document.getElementById('charCount');
  const submitWishBtn = document.getElementById('submitWishBtn');
  const categoryPills = document.getElementById('categoryPills');
  
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const progressFill = document.getElementById('progressFill');

  const planModal = document.getElementById('planModal');
  const modalWishContent = document.getElementById('modalWishContent');
  const closePlanModalBtn = document.getElementById('closePlanModalBtn');
  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalWishTitle = document.getElementById('modalWishTitle');
  const modalWishTime = document.getElementById('modalWishTime');
  const planInspiration = document.getElementById('planInspiration');
  const planRoadmap = document.getElementById('planRoadmap');
  const planHabits = document.getElementById('planHabits');
  const planPitfalls = document.getElementById('planPitfalls');
  const planFirstStep = document.getElementById('planFirstStep');
  const planModalFooter = document.getElementById('planModalFooter');
  const closeDraftBtn = document.getElementById('closeDraftBtn');
  const saveWishBtn = document.getElementById('saveWishBtn');

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

  const wallFilterPills = document.getElementById('wallFilterPills');
  const searchInput = document.getElementById('searchInput');
  const refreshWallBtn = document.getElementById('refreshWallBtn');
  const wishGrid = document.getElementById('wishGrid');
  const wallPagination = document.getElementById('wallPagination');
  const languageToggleBtn = document.getElementById('languageToggleBtn');
  const appHeader = document.querySelector('.app-header');
  const navWish = document.getElementById('nav-wish');
  const navWall = document.getElementById('nav-wall');
  const wishWallSection = document.getElementById('wish-wall');

  // --- State ---
  let currentCategory = 'growth';
  let activeFilter = 'all';
  let currentWishData = null;
  let currentWishesList = [];
  let isDraftModal = false;
  let posterObjectUrl = '';
  let posterFilename = '';
  let customApiKey = localStorage.getItem('gemini_api_key') || '';
  let currentLanguage = localStorage.getItem('wish_language') === 'en' ? 'en' : 'zh';

  // --- Pagination State ---
  let currentPage = 1;
  const PAGE_LIMIT = 6;
  let totalPages = 1;

  // --- Internationalization (i18n) Translations ---
  const translations = {
    zh: {
      pageTitle: '璀璨许愿阁',
      pageDescription: '许下你的心愿，生成具象的行动蓝图。',
      brand: '璀璨许愿阁',
      navWish: '祈愿台',
      navWall: '愿望森林',
      apiConfigTitle: '配置 Google API 密钥',
      heroBadge: '✦ 祈愿星光',
      heroTitle: '许下微光心愿，',
      heroTitleAccent: '凝筑从愿景到现实的落地阶梯',
      heroSubtitle: '每一个真挚的心愿都值得被深刻呈现。在此祈愿并生成专属行动方案。',
      categoryLabel: '祈愿领域：',
      catGrowth: '🌱 个人成长',
      catCareer: '🚀 事业突破',
      catStudy: '🎓 学业成名',
      catLove: '💖 真挚情感',
      catHealth: '🏃 健康生活',
      catCreative: '💡 奇思妙想',
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
      save: '保存心愿到森林',
      apiModalTitle: '⚙️ 配置 Google API 密钥',
      apiModalTip: '请输入您的 Google API 密钥，用于调用 Google Gemini 服务生成愿望行动方案。密钥仅保存在当前浏览器中。',
      apiKeyLabel: 'Google API Key：',
      clearApiKey: '清除 Key',
      saveConfig: '保存配置',
      footerBrand: '✦ 璀璨许愿阁',
      footerQuote: '“星光不问赶路人，岁月不负有心人。”',
      categoryNames: {
        growth: '个人成长', career: '事业突破', study: '学业成名',
        love: '真挚情感', health: '健康生活', creative: '奇思妙想'
      },
      placeholders: {
        growth: '我想养成阅读和复盘的习惯',
        career: '我想完成作品集，并获得理想的工作机会',
        study: '我想掌握数据分析，并独立完成一个可视化项目',
        love: '我想学会更真诚地表达感受，建立稳定而温暖的关系',
        health: '我想建立规律运动和早睡的生活节奏',
        creative: '我想完成第一篇短篇小说并公开发布'
      },
      loadingPhrases: [
        '正在感应并解析你的心愿...',
        '正在梳理愿望核心与潜在阻力...',
        '正在推演心愿落地的行动路径...',
        '正在凝练关键建议与启程第一步...'
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
      wallEmpty: '暂时还没有此类愿望，快来许下第一个心愿吧！',
      wishFallback: '心愿',
      inspirationLabel: '✨ 星愿启示：',
      bless: '✨ 助愿',
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
      posterInspirationLabel: '星芒启示',
      posterBlessingsLabel: '助愿能量',
      posterScanLabel: '扫码进入许愿阁',
      prevPage: '‹ 上一页',
      nextPage: '下一页 ›'
    },
    en: {
      pageTitle: 'Cosmic Wishing Well',
      pageDescription: 'Make a wish and turn it into a concrete action plan.',
      brand: 'Cosmic Wishing Well',
      navWish: 'Wishing Well',
      navWall: 'Wish Forest',
      apiConfigTitle: 'Configure Google API Key',
      heroBadge: '✦ Make a Cosmic Wish',
      heroTitle: 'Make a wish, ',
      heroTitleAccent: 'build a path from vision to reality',
      heroSubtitle: 'Every sincere wish deserves clarity. Make yours and receive a personalized action plan.',
      categoryLabel: 'Wish category:',
      catGrowth: '🌱 Growth',
      catCareer: '🚀 Career',
      catStudy: '🎓 Learning',
      catLove: '💖 Relationships',
      catHealth: '🏃 Health',
      catCreative: '💡 Creativity',
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
      save: 'Save to Forest',
      apiModalTitle: '⚙️ Configure Google API Key',
      apiModalTip: 'Enter your Google API key to generate wish action plans with Google Gemini. The key is stored only in this browser.',
      apiKeyLabel: 'Google API Key:',
      clearApiKey: 'Clear Key',
      saveConfig: 'Save Config',
      footerBrand: '✦ Cosmic Wishing Well',
      footerQuote: '“May every step beneath the stars bring your wish closer.”',
      categoryNames: {
        growth: 'Growth', career: 'Career', study: 'Learning',
        love: 'Relationships', health: 'Health', creative: 'Creativity'
      },
      placeholders: {
        growth: 'I want to build a habit of reading and reflecting',
        career: 'I want to complete my portfolio and find an ideal opportunity',
        study: 'I want to master data analysis and build a visualization project',
        love: 'I want to express myself honestly and build a warm, stable relationship',
        health: 'I want to build a consistent exercise and sleep routine',
        creative: 'I want to finish and publish my first short story'
      },
      loadingPhrases: [
        'Sensing and interpreting your wish...',
        'Mapping its core goals and potential obstacles...',
        'Designing a practical path forward...',
        'Refining key guidance and your first step...'
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
      wallEmpty: 'No wishes here yet. Be the first to make one!',
      wishFallback: 'Wish',
      inspirationLabel: '✨ Starlight Insight:',
      bless: '✨ Encourage',
      sharePoster: 'Share',
      viewPlan: 'View Plan →',
      blessSuccess: '✨ Encouragement sent!',
      blessError: '⚠️ Could not send encouragement',
      posterError: 'Could not create the poster. Please try again.',
      posterPreviewTitle: 'Share Wish Poster',
      posterPreviewHint: 'Save the preview or download the image',
      posterPreviewAlt: 'Wish poster preview',
      downloadPoster: 'Download Image',
      posterDownloaded: 'Poster downloaded',
      posterWishLabel: 'My Wish',
      posterInspirationLabel: 'Starlight Insight',
      posterBlessingsLabel: 'Encouragement',
      posterScanLabel: 'Scan to make a wish',
      prevPage: '‹ Prev',
      nextPage: 'Next ›'
    }
  };

  // Helper functions for i18n
  const t = key => translations[currentLanguage][key] ?? key;
  const getWishExample = () => t('placeholders')[currentCategory];
  const getWishPlaceholder = () => `${getWishExample()}...`;

  function getRoadmapPhaseHeading(step, index) {
    const label = currentLanguage === 'en' ? `Phase ${index + 1}` : `阶段 ${index + 1}`;
    const phaseName = typeof step.phase === 'string' ? step.phase.trim() : '';
    return phaseName ? `${label} · ${phaseName}` : label;
  }

  // --- Apply Language Updates to DOM ---
  function applyLanguage(refreshWall = false) {
    const isEn = currentLanguage === 'en';
    document.documentElement.lang = isEn ? 'en' : 'zh-CN';
    document.title = t('pageTitle');
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

    languageToggleBtn.textContent = isEn ? '中文' : 'EN';
    languageToggleBtn.title = isEn ? '切换到中文' : 'Switch to English';
    wishInput.placeholder = getWishPlaceholder();

    if (currentWishData && planModal.classList.contains('show')) {
      renderPlanModal(currentWishData);
    }
    if (refreshWall) {
      renderWishGrid(currentWishesList);
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

  // --- Modal Helpers ---
  function showModal(modal) {
    modal.classList.add('show');
  }

  function hideModal(modal) {
    modal.classList.remove('show');
  }

  function bindModalBackdrop(modal, closeFn) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFn();
    });
  }

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
      const res = await window.WishAPI.submitWish(wishText, currentCategory, customApiKey, currentLanguage);
      finishLoadingAnimation(() => {
        openPlanModal(res.wish, true);
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

  // --- Plan Modal Render & Controls ---
  function renderTextList(container, items) {
    const elements = (Array.isArray(items) ? items : []).map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    });
    container.replaceChildren(...elements);
  }

  function renderPlanModal(wishObj) {
    const plan = wishObj.aiPlan || {};
    planModalFooter.classList.toggle('hidden', !isDraftModal);

    modalCategoryBadge.textContent = t('categoryNames')[wishObj.category] || t('beautifulWish');
    modalWishTitle.textContent = `“${wishObj.title}”`;

    const formattedDate = new Date(wishObj.createdAt).toLocaleString(currentLanguage === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    modalWishTime.textContent = `${t('wishTime')}: ${formattedDate}`;
    planInspiration.textContent = `“${plan.inspiration || t('inspirationFallback')}”`;

    const roadmap = (Array.isArray(plan.roadmap) ? plan.roadmap : []).map((step, index) => {
      const element = document.createElement('div');
      element.className = 'roadmap-step-card';
      element.innerHTML = `
        <div class="step-header">
          <span class="step-phase">${escapeHtml(getRoadmapPhaseHeading(step, index))}</span>
          <span class="step-timeline">⏱️ ${escapeHtml(step.timeline || t('timelineFallback'))}</span>
        </div>
        <div class="step-title">${escapeHtml(step.title || t('taskFallback'))}</div>
        <div class="step-action">${escapeHtml(step.action || '')}</div>
      `;
      return element;
    });
    planRoadmap.replaceChildren(...roadmap);

    renderTextList(planHabits, plan.habitsAndTools);
    renderTextList(planPitfalls, plan.pitfalls);

    // Render First Step
    planFirstStep.textContent = plan.firstStep || t('firstStepFallback');
  }

  function openPlanModal(wishObj, isDraft = false) {
    currentWishData = wishObj;
    isDraftModal = isDraft;
    renderPlanModal(wishObj);
    showModal(planModal);
    planModal.scrollTop = 0;
    modalWishContent.scrollTop = 0;
  }

  function closePlanModal() {
    hideModal(planModal);
    planModal.scrollTop = 0;
    modalWishContent.scrollTop = 0;
    currentWishData = null;
    isDraftModal = false;
  }

  closePlanModalBtn.addEventListener('click', closePlanModal);
  closeDraftBtn.addEventListener('click', closePlanModal);
  bindModalBackdrop(planModal, closePlanModal);

  saveWishBtn.addEventListener('click', async () => {
    if (!isDraftModal || !currentWishData) return;

    saveWishBtn.disabled = true;
    saveWishBtn.textContent = t('saving');
    try {
      await window.WishAPI.saveWish(currentWishData, currentLanguage);
      showToast(t('wishSaved'));
      closePlanModal();
      currentPage = 1;
      await loadWishWall();
    } catch (err) {
      showToast(`⚠️ ${err.message || t('saveError')}`);
    } finally {
      saveWishBtn.disabled = false;
      saveWishBtn.textContent = t('save');
    }
  });

  // --- Wish Wall Filtering & Search ---
  wallFilterPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    wallFilterPills.querySelector('.filter-pill.active')?.classList.remove('active');
    pill.classList.add('active');
    activeFilter = pill.dataset.filter;
    currentPage = 1;
    loadWishWall();
  });

  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      loadWishWall();
    }, 300);
  });

  refreshWallBtn.addEventListener('click', async () => {
    clearTimeout(searchTimeout);
    refreshWallBtn.disabled = true;
    refreshWallBtn.classList.add('loading');
    try {
      await loadWishWall();
    } finally {
      refreshWallBtn.disabled = false;
      refreshWallBtn.classList.remove('loading');
    }
  });

  // Load and Render Wish Wall Cards
  async function loadWishWall() {
    try {
      const res = await window.WishAPI.getWishes(activeFilter, searchInput.value.trim(), currentPage, PAGE_LIMIT);
      currentWishesList = res.wishes || [];
      totalPages = res.totalPages || 1;
      currentPage = res.page || 1;
      renderWishGrid(currentWishesList);
      renderPagination(currentPage, totalPages);
    } catch (err) {
      console.error('Failed to load wish wall:', err);
      renderWallMessage('🪐', t('wallLoadError'));
      wallPagination.replaceChildren();
    }
  }

  function goToPage(page) {
    if (page === currentPage || page < 1 || page > totalPages) return;
    currentPage = page;
    loadWishWall();
    scrollToSection(wishWallSection);
  }

  function createPageButton(label, targetPage, { active = false, disabled = false } = {}) {
    const button = document.createElement('button');
    button.className = `page-btn${active ? ' active' : ''}`;
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener('click', () => goToPage(targetPage));
    return button;
  }

  function renderPagination(page, total) {
    if (total <= 1) {
      wallPagination.replaceChildren();
      return;
    }

    const buttons = [
      createPageButton(t('prevPage'), page - 1, { disabled: page <= 1 })
    ];
    for (let index = 1; index <= total; index += 1) {
      buttons.push(createPageButton(String(index), index, { active: index === page }));
    }
    buttons.push(createPageButton(t('nextPage'), page + 1, { disabled: page >= total }));
    wallPagination.replaceChildren(...buttons);
  }

  function renderWallMessage(icon, message, withPanel = false) {
    wishGrid.innerHTML = `
      <div class="empty-wall${withPanel ? ' glass-panel' : ''}">
        <div class="empty-icon">${icon}</div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderWishGrid(wishes) {
    if (wishes.length === 0) {
      renderWallMessage('🌟', t('wallEmpty'), true);
      return;
    }

    const cards = wishes.map(wish => {
      const card = document.createElement('div');
      card.className = 'wish-card glass-panel';

      const dateStr = new Date(wish.createdAt).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'zh-CN', {
        year: '2-digit', month: '2-digit', day: '2-digit'
      });

      const inspirationPreview = wish.aiPlan && wish.aiPlan.inspiration
        ? wish.aiPlan.inspiration
        : t('inspirationFallback');

      card.innerHTML = `
        <div>
          <div class="card-top">
            <span class="card-cat-badge">${escapeHtml(t('categoryNames')[wish.category] || t('wishFallback'))}</span>
            <span class="card-date">${dateStr}</span>
          </div>
          <h3 class="card-wish-text">“${escapeHtml(wish.title)}”</h3>
          <div class="card-ai-preview">
            <div class="preview-label">${escapeHtml(t('inspirationLabel'))}</div>
            <div class="preview-text">${escapeHtml(inspirationPreview)}</div>
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
    wishGrid.replaceChildren(...cards);
  }

  function wrapPosterText(context, value, maxWidth, maxLines) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return [];

    const tokens = currentLanguage === 'en'
      ? text.split(/(\s+)/).filter(Boolean)
      : Array.from(text);
    const lines = [];
    let line = '';
    let tokenIndex = 0;

    for (; tokenIndex < tokens.length; tokenIndex += 1) {
      const candidate = `${line}${tokens[tokenIndex]}`;
      if (!line || context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      lines.push(line.trim());
      line = tokens[tokenIndex].trimStart();
      if (lines.length === maxLines) break;
    }

    if (lines.length < maxLines && line) lines.push(line.trim());
    if (tokenIndex < tokens.length && lines.length) {
      let finalLine = lines.at(-1);
      while (finalLine && context.measureText(`${finalLine}…`).width > maxWidth) {
        finalLine = finalLine.slice(0, -1).trimEnd();
      }
      lines[lines.length - 1] = `${finalLine}…`;
    }
    return lines;
  }

  function drawPosterLines(context, lines, x, y, lineHeight) {
    lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  }

  function fillRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  async function canvasToPngBlob(canvas) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Canvas export returned no data');
    return blob;
  }

  async function loadSiteQrImage() {
    const response = await fetch('/api/site-qr');
    if (!response.ok) throw new Error('Could not create site QR code');
    const svg = await response.text();
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    return image;
  }

  async function createWishPoster(wish) {
    const [qrImage] = await Promise.all([
      loadSiteQrImage(),
      document.fonts?.ready
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');

    const background = context.createLinearGradient(80, 0, 1000, 1440);
    background.addColorStop(0, '#08090e');
    background.addColorStop(0.52, '#121018');
    background.addColorStop(1, '#201417');
    context.fillStyle = background;
    context.fillRect(0, 0, 1080, 1440);

    const topGlow = context.createRadialGradient(860, 120, 0, 860, 120, 590);
    topGlow.addColorStop(0, 'rgba(207, 176, 126, 0.22)');
    topGlow.addColorStop(1, 'rgba(207, 176, 126, 0)');
    context.fillStyle = topGlow;
    context.fillRect(250, 0, 830, 760);

    const bottomGlow = context.createRadialGradient(40, 1320, 0, 40, 1320, 520);
    bottomGlow.addColorStop(0, 'rgba(115, 79, 96, 0.18)');
    bottomGlow.addColorStop(1, 'rgba(115, 79, 96, 0)');
    context.fillStyle = bottomGlow;
    context.fillRect(0, 820, 700, 620);

    context.strokeStyle = 'rgba(207, 176, 126, 0.16)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(34, 34, 1012, 1372, 38);
    context.stroke();

    context.strokeStyle = 'rgba(207, 176, 126, 0.08)';
    context.beginPath();
    context.ellipse(870, 130, 330, 178, -0.24, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(870, 130, 250, 128, -0.24, 0, Math.PI * 2);
    context.stroke();

    for (let index = 0; index < 42; index += 1) {
      const x = (index * 197 + 83) % 1020 + 30;
      const y = (index * 101 + 47) % 1320 + 30;
      const radius = index % 7 === 0 ? 2.2 : 1;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(232, 216, 190, ${index % 5 === 0 ? 0.5 : 0.2})`;
      context.fill();
    }

    const fontFamily = '"Noto Sans SC", "Plus Jakarta Sans", sans-serif';
    const locale = currentLanguage === 'en' ? 'en-US' : 'zh-CN';
    const date = new Date(wish.createdAt || Date.now()).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const category = t('categoryNames')[wish.category] || t('wishFallback');
    const inspiration = wish.aiPlan?.inspiration || t('inspirationFallback');

    context.fillStyle = '#cfb07e';
    context.font = `600 28px ${fontFamily}`;
    context.fillText(`✦ ${t('brand')}`, 76, 96);

    context.strokeStyle = 'rgba(207, 176, 126, 0.32)';
    context.beginPath();
    context.moveTo(76, 126);
    context.lineTo(330, 126);
    context.stroke();

    context.font = `500 22px ${fontFamily}`;
    const categoryBadgeWidth = Math.max(150, context.measureText(category).width + 58);
    context.fillStyle = 'rgba(207, 176, 126, 0.12)';
    fillRoundedRect(context, 76, 156, categoryBadgeWidth, 52, 26);
    context.strokeStyle = 'rgba(207, 176, 126, 0.22)';
    context.beginPath();
    context.roundRect(76, 156, categoryBadgeWidth, 52, 26);
    context.stroke();
    context.fillStyle = '#dfc79f';
    context.textAlign = 'center';
    context.fillText(category, 76 + categoryBadgeWidth / 2, 190);
    context.textAlign = 'left';

    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.36)';
    context.shadowBlur = 26;
    context.fillStyle = 'rgba(247, 240, 228, 0.96)';
    fillRoundedRect(context, 814, 52, 192, 220, 28);
    context.restore();
    context.drawImage(qrImage, 830, 68, 160, 160);
    context.fillStyle = 'rgba(42, 31, 27, 0.66)';
    context.font = `600 16px ${fontFamily}`;
    context.textAlign = 'center';
    context.fillText(t('posterScanLabel'), 910, 252);
    context.textAlign = 'left';

    context.fillStyle = 'rgba(255, 255, 255, 0.46)';
    context.font = `600 22px ${fontFamily}`;
    context.fillText(t('posterWishLabel').toUpperCase(), 84, 308);

    context.fillStyle = 'rgba(207, 176, 126, 0.12)';
    context.font = `700 132px ${fontFamily}`;
    context.fillText('“', 52, 424);
    context.fillStyle = '#f5f0e9';
    context.font = `700 62px ${fontFamily}`;
    drawPosterLines(context, wrapPosterText(context, wish.title, 884, 4), 98, 402, 82);

    context.strokeStyle = 'rgba(207, 176, 126, 0.3)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(84, 688);
    context.lineTo(182, 688);
    context.stroke();
    context.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(196, 688);
    context.lineTo(996, 688);
    context.stroke();

    const insightCard = context.createLinearGradient(68, 730, 1012, 1116);
    insightCard.addColorStop(0, 'rgba(30, 27, 34, 0.92)');
    insightCard.addColorStop(1, 'rgba(12, 12, 17, 0.72)');
    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.26)';
    context.shadowBlur = 28;
    context.fillStyle = insightCard;
    fillRoundedRect(context, 64, 728, 952, 388, 38);
    context.restore();
    context.strokeStyle = 'rgba(207, 176, 126, 0.18)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(64, 728, 952, 388, 38);
    context.stroke();

    context.fillStyle = 'rgba(207, 176, 126, 0.12)';
    fillRoundedRect(context, 104, 774, 52, 52, 26);
    context.fillStyle = '#cfb07e';
    context.font = `600 22px ${fontFamily}`;
    context.textAlign = 'center';
    context.fillText('✦', 130, 809);
    context.textAlign = 'left';
    context.font = `600 24px ${fontFamily}`;
    context.fillText(t('posterInspirationLabel'), 176, 809);

    context.fillStyle = 'rgba(245, 240, 233, 0.84)';
    context.font = `400 33px ${fontFamily}`;
    drawPosterLines(context, wrapPosterText(context, inspiration, 824, 5), 108, 884, 52);

    context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    context.beginPath();
    context.moveTo(84, 1176);
    context.lineTo(996, 1176);
    context.stroke();

    context.fillStyle = 'rgba(255, 255, 255, 0.46)';
    context.font = `500 19px ${fontFamily}`;
    context.fillText(t('posterBlessingsLabel'), 84, 1218);
    context.fillStyle = '#cfb07e';
    context.font = `600 30px ${fontFamily}`;
    context.fillText(`✦  ${wish.blessings || 0}`, 84, 1260);
    context.textAlign = 'right';
    context.fillStyle = 'rgba(255, 255, 255, 0.56)';
    context.font = `400 22px ${fontFamily}`;
    context.fillText(date, 996, 1260);
    context.textAlign = 'left';

    context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    context.beginPath();
    context.moveTo(84, 1306);
    context.lineTo(996, 1306);
    context.stroke();

    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    context.font = `400 20px ${fontFamily}`;
    context.fillText(t('footerQuote'), 84, 1360);
    context.textAlign = 'right';
    context.fillStyle = 'rgba(207, 176, 126, 0.72)';
    context.fillText(t('brand'), 996, 1360);

    if (!wish.id) throw new Error('Wish has no database ID');
    return {
      blob: await canvasToPngBlob(canvas),
      filename: `${wish.id}.png`
    };
  }

  wishGrid.addEventListener('click', async event => {
    const button = event.target.closest('button[data-wish-id]');
    if (!button) return;
    const wish = currentWishesList.find(item => item.id === button.dataset.wishId);
    if (!wish) return;

    if (button.classList.contains('btn-share')) {
      button.disabled = true;
      try {
        const poster = await createWishPoster(wish);
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
    if (!button.classList.contains('btn-bless')) return;
    if (button.disabled) return;

    const label = button.querySelector('.bless-label');
    const originalText = label.textContent;
    button.style.minWidth = `${button.offsetWidth}px`;
    label.textContent = '↻';
    button.disabled = true;
    button.classList.add('loading');

    try {
      const res = await window.WishAPI.blessWish(wish.id);
      wish.blessings = res.blessings;
      button.querySelector('.bless-count').textContent = res.blessings;
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

  // --- Toast Utilities ---
  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load wish wall on init
  loadWishWall();
});
