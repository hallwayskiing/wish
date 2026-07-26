document.addEventListener('DOMContentLoaded', () => {
  const loginPanel = document.getElementById('loginPanel');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('passwordInput');
  const loginButton = document.getElementById('loginButton');
  const loginMessage = document.getElementById('loginMessage');
  const logoutButton = document.getElementById('logoutButton');
  const refreshButton = document.getElementById('refreshButton');
  const searchInput = document.getElementById('searchInput');
  const wishList = document.getElementById('wishList');
  const wishCount = document.getElementById('wishCount');
  const notice = document.getElementById('notice');
  const emptyState = document.getElementById('emptyState');

  const categoryNames = {
    growth: '个人成长',
    career: '事业突破',
    study: '学业成名',
    love: '情感真挚',
    health: '健康生活',
    creative: '奇思妙想'
  };

  let wishes = [];
  let noticeTimer = null;

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function api(endpoint, options = {}) {
    const response = await fetch(`/api/admin${endpoint}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `请求失败（${response.status}）`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function showLogin(message = '') {
    dashboard.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    loginMessage.textContent = message;
    passwordInput.focus();
  }

  function showDashboard() {
    loginPanel.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }

  function showNotice(message, isError = false) {
    clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.classList.toggle('error', isError);
    noticeTimer = setTimeout(() => {
      notice.textContent = '';
      notice.classList.remove('error');
    }, 3500);
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '未知时间';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // --- Fill-In-The-Blank AI Plan Editor Builder ---
  function buildPlanForm(aiPlan) {
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

    function createStepEditor(step = {}, index = 0) {
      const stepCard = document.createElement('div');
      stepCard.className = 'roadmap-step-editor';

      stepCard.innerHTML = `
        <div class="roadmap-step-header">
          <span class="step-num-badge">阶段 ${index + 1}</span>
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

      stepCard.querySelector('.btn-remove-step').addEventListener('click', () => {
        stepCard.remove();
        updateStepBadges(stepsList);
      });

      return stepCard;
    }

    function updateStepBadges(listEl) {
      listEl.querySelectorAll('.roadmap-step-editor').forEach((card, idx) => {
        const badge = card.querySelector('.step-num-badge');
        if (badge) badge.textContent = `阶段 ${idx + 1}`;
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

    roadmapSection.append(roadmapTitle, stepsList, addStepBtn);
    container.appendChild(roadmapSection);

    // 3. Habits & Tools Section
    const habitsSection = document.createElement('div');
    habitsSection.className = 'plan-form-section';
    habitsSection.innerHTML = `
      <label class="plan-section-title">
        <span class="section-icon">✦</span> 关键微习惯与工具
      </label>
    `;

    const habitsList = document.createElement('div');
    habitsList.className = 'dynamic-items-list';

    function createHabitRow(text = '') {
      const row = document.createElement('div');
      row.className = 'dynamic-item-row';
      row.innerHTML = `
        <input type="text" class="plan-form-input habit-item-input" placeholder="输入建议养成的微习惯或推荐工具..." value="${escapeHtml(text)}">
        <button type="button" class="btn-remove-item" title="删除项">✕</button>
      `;
      row.querySelector('.btn-remove-item').addEventListener('click', () => row.remove());
      return row;
    }

    const initialHabits = Array.isArray(plan.habitsAndTools) ? plan.habitsAndTools : [];
    initialHabits.forEach(h => habitsList.appendChild(createHabitRow(h)));

    const addHabitBtn = document.createElement('button');
    addHabitBtn.type = 'button';
    addHabitBtn.className = 'btn-add-item';
    addHabitBtn.innerHTML = `<span>+</span> 添加微习惯/工具`;
    addHabitBtn.addEventListener('click', () => habitsList.appendChild(createHabitRow('')));

    habitsSection.append(habitsList, addHabitBtn);
    container.appendChild(habitsSection);

    // 4. Pitfalls Section
    const pitfallsSection = document.createElement('div');
    pitfallsSection.className = 'plan-form-section';
    pitfallsSection.innerHTML = `
      <label class="plan-section-title">
        <span class="section-icon">✦</span> 避坑指南与应对策略
      </label>
    `;

    const pitfallsList = document.createElement('div');
    pitfallsList.className = 'dynamic-items-list';

    function createPitfallRow(text = '') {
      const row = document.createElement('div');
      row.className = 'dynamic-item-row';
      row.innerHTML = `
        <input type="text" class="plan-form-input pitfall-item-input" placeholder="输入可能遇到的坑及对应解决办法..." value="${escapeHtml(text)}">
        <button type="button" class="btn-remove-item" title="删除项">✕</button>
      `;
      row.querySelector('.btn-remove-item').addEventListener('click', () => row.remove());
      return row;
    }

    const initialPitfalls = Array.isArray(plan.pitfalls) ? plan.pitfalls : [];
    initialPitfalls.forEach(p => pitfallsList.appendChild(createPitfallRow(p)));

    const addPitfallBtn = document.createElement('button');
    addPitfallBtn.type = 'button';
    addPitfallBtn.className = 'btn-add-item';
    addPitfallBtn.innerHTML = `<span>+</span> 添加避坑指南`;
    addPitfallBtn.addEventListener('click', () => pitfallsList.appendChild(createPitfallRow('')));

    pitfallsSection.append(pitfallsList, addPitfallBtn);
    container.appendChild(pitfallsSection);

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

    jsonDebugToggle.append(debugSummary, jsonArea);
    container.appendChild(jsonDebugToggle);

    // Dynamic AI Plan extraction method
    container.getAiPlan = () => {
      const inspiration = container.querySelector('.plan-inspiration-input')?.value.trim() || '';
      const firstStep = container.querySelector('.plan-firststep-input')?.value.trim() || '';

      const roadmap = [];
      container.querySelectorAll('.roadmap-step-editor').forEach(stepCard => {
        const phase = stepCard.querySelector('.step-phase-input')?.value.trim() || '';
        const timeline = stepCard.querySelector('.step-timeline-input')?.value.trim() || '';
        const title = stepCard.querySelector('.step-title-input')?.value.trim() || '';
        const action = stepCard.querySelector('.step-action-input')?.value.trim() || '';
        if (phase || timeline || title || action) {
          roadmap.push({ phase, timeline, title, action });
        }
      });

      const habitsAndTools = [];
      container.querySelectorAll('.habit-item-input').forEach(input => {
        const val = input.value.trim();
        if (val) habitsAndTools.push(val);
      });

      const pitfalls = [];
      container.querySelectorAll('.pitfall-item-input').forEach(input => {
        const val = input.value.trim();
        if (val) pitfalls.push(val);
      });

      const updatedPlan = {
        inspiration,
        roadmap,
        habitsAndTools,
        pitfalls,
        firstStep
      };

      // Keep jsonArea updated
      jsonArea.value = JSON.stringify(updatedPlan, null, 2);
      return updatedPlan;
    };

    return container;
  }

  function createWishCard(wish) {
    const card = document.createElement('article');
    card.className = 'wish-admin-card glass-panel';
    card.dataset.id = wish.id;

    // Header Metadata
    const meta = document.createElement('div');
    meta.className = 'wish-meta';
    const dateText = document.createElement('span');
    dateText.textContent = `创建时间：${formatDate(wish.createdAt)}`;
    const idText = document.createElement('span');
    idText.className = 'wish-id-tag';
    idText.textContent = wish.id;
    meta.append(dateText, idText);

    // Title field
    const titleField = document.createElement('div');
    titleField.className = 'field wish-title-field';
    const titleLabel = document.createElement('span');
    titleLabel.className = 'field-label';
    titleLabel.textContent = '愿望内容';
    const titleInput = document.createElement('textarea');
    titleInput.className = 'wish-title-input';
    titleInput.maxLength = 300;
    titleInput.value = wish.title || '';
    titleField.append(titleLabel, titleInput);

    // Category field
    const categoryField = document.createElement('div');
    categoryField.className = 'field';
    const categoryLabel = document.createElement('span');
    categoryLabel.className = 'field-label';
    categoryLabel.textContent = '分类领域';
    const categorySelect = document.createElement('select');
    categorySelect.className = 'wish-category-select';
    Object.entries(categoryNames).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = value === wish.category;
      categorySelect.appendChild(option);
    });
    categoryField.append(categoryLabel, categorySelect);

    // Blessings field
    const blessingsField = document.createElement('div');
    blessingsField.className = 'field';
    const blessingsLabel = document.createElement('span');
    blessingsLabel.className = 'field-label';
    blessingsLabel.textContent = '助愿能量数';
    const blessingsInput = document.createElement('input');
    blessingsInput.className = 'wish-blessings-input';
    blessingsInput.type = 'number';
    blessingsInput.min = '0';
    blessingsInput.max = '999999999';
    blessingsInput.step = '1';
    blessingsInput.value = String(wish.blessings ?? 0);
    blessingsField.append(blessingsLabel, blessingsInput);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.type = 'button';
    saveButton.textContent = '保存变更';
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = '删除愿望';
    actions.append(saveButton, deleteButton);

    // AI Plan Collapsible Editor Container
    const planEditor = document.createElement('details');
    planEditor.className = 'plan-editor';
    const planSummary = document.createElement('summary');
    planSummary.innerHTML = `
      <div class="summary-badge">
        <span>✦ 编辑 AI 行动蓝图 (填空模式)</span>
      </div>
      <span class="summary-indicator">▶</span>
    `;

    const planFormContainer = buildPlanForm(wish.aiPlan);
    planEditor.append(planSummary, planFormContainer);

    saveButton.addEventListener('click', async () => {
      const aiPlan = planFormContainer.getAiPlan();

      saveButton.disabled = true;
      saveButton.textContent = '保存中...';
      try {
        const data = await api(`/wishes/${encodeURIComponent(wish.id)}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: titleInput.value,
            category: categorySelect.value,
            blessings: Number(blessingsInput.value),
            aiPlan
          })
        });
        const index = wishes.findIndex(item => item.id === wish.id);
        if (index !== -1) wishes[index] = data.wish;
        titleInput.value = data.wish.title;
        blessingsInput.value = String(data.wish.blessings);
        showNotice('愿望及 AI 蓝图填空已成功保存！');
      } catch (error) {
        if (error.status === 401) return showLogin('登录已过期，请重新登录。');
        showNotice(error.message, true);
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = '保存变更';
      }
    });

    deleteButton.addEventListener('click', async () => {
      if (!window.confirm(`确认永久删除这条愿望？\n\n“${titleInput.value}”`)) return;
      deleteButton.disabled = true;
      deleteButton.textContent = '删除中...';
      try {
        await api(`/wishes/${encodeURIComponent(wish.id)}`, { method: 'DELETE' });
        wishes = wishes.filter(item => item.id !== wish.id);
        renderWishes();
        showNotice('愿望已删除。');
      } catch (error) {
        if (error.status === 401) return showLogin('登录已过期，请重新登录。');
        showNotice(error.message, true);
        deleteButton.disabled = false;
        deleteButton.textContent = '删除愿望';
      }
    });

    card.append(meta, titleField, categoryField, blessingsField, actions, planEditor);
    return card;
  }

  function renderWishes() {
    const term = searchInput.value.trim().toLocaleLowerCase('zh-CN');
    const filtered = term
      ? wishes.filter(wish => {
          const category = categoryNames[wish.category] || wish.categoryName || '';
          return `${wish.title} ${category}`.toLocaleLowerCase('zh-CN').includes(term);
        })
      : wishes;

    wishList.replaceChildren(...filtered.map(createWishCard));
    wishCount.textContent = `共 ${wishes.length} 条愿望${term ? `，当前显示 ${filtered.length} 条` : ''}`;
    emptyState.classList.toggle('hidden', filtered.length !== 0);
  }

  async function loadWishes() {
    refreshButton.disabled = true;
    wishCount.textContent = '正在读取愿望...';
    try {
      const data = await api('/wishes');
      wishes = data.wishes || [];
      renderWishes();
    } catch (error) {
      if (error.status === 401) return showLogin('登录已过期，请重新登录。');
      showNotice(error.message, true);
      wishCount.textContent = '读取失败';
    } finally {
      refreshButton.disabled = false;
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    loginButton.disabled = true;
    loginButton.textContent = '验证中...';
    loginMessage.textContent = '';
    try {
      await api('/login', {
        method: 'POST',
        body: JSON.stringify({ password: passwordInput.value })
      });
      passwordInput.value = '';
      showDashboard();
      await loadWishes();
    } catch (error) {
      loginMessage.textContent = error.message;
      passwordInput.select();
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = '验证并登录';
    }
  });

  logoutButton.addEventListener('click', async () => {
    try {
      await api('/logout', { method: 'POST' });
    } finally {
      wishes = [];
      showLogin();
    }
  });

  refreshButton.addEventListener('click', loadWishes);
  searchInput.addEventListener('input', renderWishes);

  api('/session')
    .then(() => {
      showDashboard();
      return loadWishes();
    })
    .catch(() => showLogin());
});
