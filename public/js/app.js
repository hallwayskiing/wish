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

  const wallFilterPills = document.getElementById('wallFilterPills');
  const searchInput = document.getElementById('searchInput');
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
      viewPlan: '查看蓝图 →',
      blessSuccess: '✨ 助愿成功！送出一份诚挚祝福',
      blessError: '⚠️ 助愿失败',
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
      viewPlan: 'View Plan →',
      blessSuccess: '✨ Encouragement sent!',
      blessError: '⚠️ Could not send encouragement',
      prevPage: '‹ Prev',
      nextPage: 'Next ›'
    }
  };

  // Helper functions for i18n
  const t = key => translations[currentLanguage][key] || key;
  const getWishExample = () => t('placeholders')[currentCategory];
  const getWishPlaceholder = () => `${getWishExample()}...`;

  function getRoadmapPhaseLabel(index) {
    return currentLanguage === 'en' ? `Phase ${index + 1}` : `阶段 ${index + 1}`;
  }

  function getRoadmapPhaseHeading(step, index) {
    const label = getRoadmapPhaseLabel(index);
    const phaseName = typeof step.phase === 'string' ? step.phase.trim() : '';
    if (!phaseName) return label;
    return `${label} · ${phaseName}`;
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

    languageToggleBtn.textContent = isEn ? '中文' : 'EN';
    languageToggleBtn.title = isEn ? '切换到中文' : 'Switch to English';
    wishInput.placeholder = getWishPlaceholder();

    if (currentWishData && planModal.classList.contains('show')) {
      renderPlanModal(currentWishData, isDraftModal);
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
    const headerHeight = appHeader?.getBoundingClientRect().height || 0;
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
    categoryPills.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
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

  saveApiKeyBtn.addEventListener('click', () => {
    const val = apiKeyInput.value.trim();
    customApiKey = val;
    if (val) {
      localStorage.setItem('gemini_api_key', val);
      showToast(t('apiKeySaved'));
    } else {
      localStorage.removeItem('gemini_api_key');
      showToast(t('apiKeyCleared'));
    }
    hideModal(apiKeyModal);
  });

  clearApiKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = '';
    customApiKey = '';
    localStorage.removeItem('gemini_api_key');
    showToast(t('apiKeyCleared'));
    hideModal(apiKeyModal);
  });

  // --- Submit Wish ---
  submitWishBtn.addEventListener('click', async () => {
    const wishText = wishInput.value.trim() || getWishExample();
    startLoadingAnimation();

    try {
      const res = await window.WishAPI.submitWish(wishText, currentCategory, customApiKey, currentLanguage);
      finishLoadingAnimation(() => {
        currentWishData = res.wish;
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
  function startLoadingAnimation() {
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
    clearInterval(progressInterval);
    progressFill.style.width = '100%';
    loadingStatusText.textContent = t('generationComplete');
    setTimeout(() => {
      hideModal(loadingOverlay);
      if (callback) callback();
    }, 450);
  }

  function stopLoadingAnimation() {
    clearInterval(progressInterval);
    hideModal(loadingOverlay);
  }

  // --- Plan Modal Render & Controls ---
  function renderPlanModal(wishObj, isDraft = false) {
    const plan = wishObj.aiPlan || {};
    isDraftModal = isDraft;
    planModalFooter.classList.toggle('hidden', !isDraft);

    modalCategoryBadge.textContent = t('categoryNames')[wishObj.category] || t('beautifulWish');
    modalWishTitle.textContent = `“${wishObj.title}”`;

    const formattedDate = new Date(wishObj.createdAt).toLocaleString(currentLanguage === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    modalWishTime.textContent = `${t('wishTime')}: ${formattedDate}`;
    planInspiration.textContent = `“${plan.inspiration || t('inspirationFallback')}”`;

    // Render Roadmap Timeline
    planRoadmap.innerHTML = '';
    if (Array.isArray(plan.roadmap)) {
      plan.roadmap.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'roadmap-step-card';
        stepEl.innerHTML = `
          <div class="step-header">
            <span class="step-phase">${escapeHtml(getRoadmapPhaseHeading(step, index))}</span>
            <span class="step-timeline">⏱️ ${escapeHtml(step.timeline || t('timelineFallback'))}</span>
          </div>
          <div class="step-title">${escapeHtml(step.title || t('taskFallback'))}</div>
          <div class="step-action">${escapeHtml(step.action || '')}</div>
        `;
        planRoadmap.appendChild(stepEl);
      });
    }

    // Render Habits & Tools
    planHabits.innerHTML = '';
    if (Array.isArray(plan.habitsAndTools)) {
      plan.habitsAndTools.forEach(h => {
        const li = document.createElement('li');
        li.textContent = h;
        planHabits.appendChild(li);
      });
    }

    // Render Pitfalls
    planPitfalls.innerHTML = '';
    if (Array.isArray(plan.pitfalls)) {
      plan.pitfalls.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        planPitfalls.appendChild(li);
      });
    }

    // Render First Step
    planFirstStep.textContent = plan.firstStep || t('firstStepFallback');
  }

  function openPlanModal(wishObj, isDraft = false) {
    renderPlanModal(wishObj, isDraft);
    showModal(planModal);

    // Reset scroll positions AFTER modal display is flex
    planModal.scrollTop = 0;
    modalWishContent.scrollTop = 0;

    requestAnimationFrame(() => {
      planModal.scrollTop = 0;
      modalWishContent.scrollTop = 0;
    });
  }

  function closePlanModal() {
    hideModal(planModal);
    planModal.scrollTop = 0;
    modalWishContent.scrollTop = 0;
    if (isDraftModal) currentWishData = null;
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
      hideModal(planModal);
      currentWishData = null;
      isDraftModal = false;
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
    wallFilterPills.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
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
      wishGrid.innerHTML = `
        <div class="empty-wall">
          <div class="empty-icon">🪐</div>
          <p>${escapeHtml(t('wallLoadError'))}</p>
        </div>
      `;
      if (wallPagination) wallPagination.innerHTML = '';
    }
  }

  function renderPagination(page, total) {
    if (!wallPagination) return;
    wallPagination.innerHTML = '';
    if (total <= 1) return;

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev-btn';
    prevBtn.disabled = page <= 1;
    prevBtn.textContent = t('prevPage');
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadWishWall();
        scrollToWallTop();
      }
    });
    wallPagination.appendChild(prevBtn);

    // Numbered Page Buttons
    for (let i = 1; i <= total; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === page ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        if (currentPage !== i) {
          currentPage = i;
          loadWishWall();
          scrollToWallTop();
        }
      });
      wallPagination.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn next-btn';
    nextBtn.disabled = page >= total;
    nextBtn.textContent = t('nextPage');
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadWishWall();
        scrollToWallTop();
      }
    });
    wallPagination.appendChild(nextBtn);
  }

  function scrollToWallTop() {
    scrollToSection(wishWallSection);
  }

  function renderWishGrid(wishes) {
    wishGrid.innerHTML = '';
    if (!wishes || wishes.length === 0) {
      wishGrid.innerHTML = `
        <div class="empty-wall glass-panel">
          <div class="empty-icon">🌟</div>
          <p>${escapeHtml(t('wallEmpty'))}</p>
        </div>
      `;
      return;
    }

    wishes.forEach(wish => {
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
          <button class="btn-bless" data-wish-id="${wish.id}">
            <span class="bless-label">${escapeHtml(t('bless'))}</span>
            <span class="bless-count">${wish.blessings || 0}</span>
          </button>
          <button class="btn-view-plan" data-wish-id="${wish.id}">${escapeHtml(t('viewPlan'))}</button>
        </div>
      `;

      // Bless Button Click Handler (Locks width, shows spinning '↻' symbol without number)
      const blessBtn = card.querySelector('.btn-bless');
      const blessLabel = blessBtn.querySelector('.bless-label');
      blessBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (blessBtn.disabled || blessBtn.classList.contains('loading')) return;

        const originalText = blessLabel.textContent;
        const currentWidth = blessBtn.offsetWidth;
        blessBtn.style.minWidth = `${currentWidth}px`;

        blessLabel.textContent = '↻';
        blessBtn.disabled = true;
        blessBtn.classList.add('loading');

        try {
          const res = await window.WishAPI.blessWish(wish.id);
          blessBtn.querySelector('.bless-count').textContent = res.blessings;
          blessBtn.classList.add('blessed');
          showToast(t('blessSuccess'));
        } catch (err) {
          showToast(t('blessError'));
        } finally {
          blessLabel.textContent = originalText;
          blessBtn.classList.remove('loading');
          blessBtn.disabled = false;
          blessBtn.style.minWidth = '';
        }
      });

      // View Plan Handler
      const viewBtn = card.querySelector('.btn-view-plan');
      viewBtn.addEventListener('click', () => {
        currentWishData = wish;
        openPlanModal(wish, false);
      });

      wishGrid.appendChild(card);
    });
  }

  // --- Toast Utilities ---
  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = msg;
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
