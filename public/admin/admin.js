import { adminApi as api } from './api.js?v=3.0.0';
import { buildPlanForm } from './plan-editor.js?v=3.0.0';
import { escapeHtml } from '../js/ui.js?v=3.0.0';

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

  function createField(labelText, control, extraClass = '') {
    const field = document.createElement('div');
    field.className = `field${extraClass ? ` ${extraClass}` : ''}`;
    const label = document.createElement('span');
    label.className = 'field-label';
    label.textContent = labelText;
    field.append(label, control);
    return field;
  }

  function createButton(className, text) {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.textContent = text;
    return button;
  }

  async function withBusyButton(button, busyText, task) {
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.textContent = busyText;
    try {
      return await task();
    } finally {
      button.disabled = false;
      button.innerHTML = originalContent;
    }
  }

  function handleRequestError(error) {
    if (error.status === 401) {
      showLogin('登录已过期，请重新登录。');
      return true;
    }
    showNotice(error.message, true);
    return false;
  }

  function createWishCard(wish) {
    const card = document.createElement('article');
    card.className = 'wish-admin-card glass-panel';
    card.dataset.id = wish.id;

    const meta = document.createElement('div');
    meta.className = 'wish-meta';
    const dateText = document.createElement('span');
    dateText.textContent = `创建时间：${formatDate(wish.createdAt)}`;
    const idText = document.createElement('span');
    idText.className = 'wish-id-tag';
    idText.textContent = wish.id;
    meta.append(dateText, idText);

    const titleInput = document.createElement('textarea');
    titleInput.className = 'wish-title-input';
    titleInput.maxLength = 300;
    titleInput.value = wish.title || '';
    const titleField = createField('愿望内容', titleInput, 'wish-title-field');

    const categorySelect = document.createElement('select');
    categorySelect.className = 'wish-category-select';
    Object.entries(categoryNames).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = value === wish.category;
      categorySelect.appendChild(option);
    });
    const categoryField = createField('分类领域', categorySelect);

    const blessingsInput = document.createElement('input');
    blessingsInput.className = 'wish-blessings-input';
    blessingsInput.type = 'number';
    blessingsInput.min = '0';
    blessingsInput.max = '999999999';
    blessingsInput.step = '1';
    blessingsInput.value = String(wish.blessings ?? 0);
    const blessingsField = createField('助愿能量数', blessingsInput);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const saveButton = createButton('save-button', '保存变更');
    const deleteButton = createButton('delete-button', '删除愿望');
    actions.append(saveButton, deleteButton);

    const planEditor = document.createElement('details');
    planEditor.className = 'plan-editor';
    const planSummary = document.createElement('summary');
    planSummary.innerHTML = `
      <div class="summary-badge">
        <span>✦ 编辑 AI 行动蓝图 (填空模式)</span>
      </div>
      <span class="summary-indicator">▶</span>
    `;

    const planForm = buildPlanForm(wish.aiPlan);
    planEditor.append(planSummary, planForm.element);

    saveButton.addEventListener('click', async () => {
      const aiPlan = planForm.getAiPlan();
      try {
        await withBusyButton(saveButton, '保存中...', async () => {
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
        });
        showNotice('愿望及 AI 蓝图填空已成功保存！');
      } catch (error) {
        handleRequestError(error);
      }
    });

    deleteButton.addEventListener('click', async () => {
      if (!window.confirm(`确认永久删除这条愿望？\n\n“${titleInput.value}”`)) return;
      try {
        await withBusyButton(deleteButton, '删除中...', () =>
          api(`/wishes/${encodeURIComponent(wish.id)}`, { method: 'DELETE' })
        );
        wishes = wishes.filter(item => item.id !== wish.id);
        renderWishes();
        showNotice('愿望已删除。');
      } catch (error) {
        handleRequestError(error);
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
      if (handleRequestError(error)) return;
      wishCount.textContent = '读取失败';
    } finally {
      refreshButton.disabled = false;
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    loginMessage.textContent = '';
    try {
      await withBusyButton(loginButton, '验证中...', () =>
        api('/login', {
          method: 'POST',
          body: JSON.stringify({ password: passwordInput.value })
        })
      );
      passwordInput.value = '';
      showDashboard();
      await loadWishes();
    } catch (error) {
      loginMessage.textContent = error.message;
      passwordInput.select();
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
