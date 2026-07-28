import '../particles.js';
import '../styles/style.css';
import './admin.css';
import './editor.css';
import { CATEGORY_NAMES, isCategoryId } from '../../categories.js';
import { Wish, UnpaginatedWishListResult } from '../types.js';
import { requireElement } from '../ui.js';
import { AdminApiError, adminApi as api } from './api.js';
import { buildPlanForm } from './plan-editor.js';

const LOADING_WISHES_TEXT = '正在读取愿望...';

function initAdminDashboard(): void {
  const elements = {
    loginPanel: requireElement('loginPanel'),
    dashboard: requireElement('dashboard'),
    loginForm: requireElement<HTMLFormElement>('loginForm'),
    passwordInput: requireElement<HTMLInputElement>('passwordInput'),
    loginButton: requireElement<HTMLButtonElement>('loginButton'),
    loginMessage: requireElement('loginMessage'),
    logoutButton: requireElement<HTMLButtonElement>('logoutButton'),
    refreshButton: requireElement<HTMLButtonElement>('refreshButton'),
    searchInput: requireElement<HTMLInputElement>('searchInput'),
    wishList: requireElement('wishList'),
    wishCount: requireElement('wishCount'),
    notice: requireElement('notice'),
    emptyState: requireElement('emptyState')
  };

  const categoryNames = CATEGORY_NAMES.zh;

  let wishes: Wish[] = [];
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  function showLogin(message = ''): void {
    elements.dashboard.classList.add('hidden');
    elements.loginPanel.classList.remove('hidden');
    elements.loginMessage.textContent = message;
    elements.passwordInput.focus();
  }

  function showDashboard(): void {
    elements.loginPanel.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
  }

  function showNotice(message: string, isError = false): void {
    clearTimeout(noticeTimer);
    elements.notice.textContent = message;
    elements.notice.classList.toggle('error', isError);
    noticeTimer = setTimeout(() => {
      elements.notice.textContent = '';
      elements.notice.classList.remove('error');
    }, 3500);
  }

  function formatDate(value: string): string {
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

  function createField(labelText: string, control: Node, extraClass = ''): HTMLElement {
    const field = document.createElement('div');
    field.className = `field${extraClass ? ` ${extraClass}` : ''}`;
    const label = document.createElement('span');
    label.className = 'field-label';
    label.textContent = labelText;
    field.appendChild(label);
    field.appendChild(control);
    return field;
  }

  function createButton(className: string, text: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.textContent = text;
    return button;
  }

  async function withBusyButton<T>(button: HTMLButtonElement, busyText: string, task: () => Promise<T>): Promise<T> {
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

  function handleRequestError(error: unknown): boolean {
    if (error instanceof AdminApiError) {
      if (error.status === 401) {
        showLogin('登录已过期，请重新登录。');
        return true;
      }
      showNotice(error.message, true);
    } else if (error instanceof Error) {
      showNotice(error.message, true);
    } else {
      showNotice(String(error), true);
    }
    return false;
  }

  function createWishCard(wish: Wish): HTMLElement {
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
    meta.appendChild(dateText);
    meta.appendChild(idText);

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
    actions.appendChild(saveButton);
    actions.appendChild(deleteButton);

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
    planEditor.appendChild(planSummary);
    planEditor.appendChild(planForm.element);

    saveButton.addEventListener('click', async () => {
      const aiPlan = planForm.getAiPlan();
      try {
        await withBusyButton(saveButton, '保存中...', async () => {
          const data = await api<{ success: boolean; wish: Wish }>(`/wishes/${encodeURIComponent(wish.id)}`, {
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
      } catch (error: unknown) {
        handleRequestError(error);
      }
    });

    deleteButton.addEventListener('click', async () => {
      if (!window.confirm(`确认永久删除这条愿望？\n\n“${titleInput.value}”`)) return;
      try {
        await withBusyButton(deleteButton, '删除中...', () =>
          api<{ success: boolean }>(`/wishes/${encodeURIComponent(wish.id)}`, { method: 'DELETE' })
        );
        wishes = wishes.filter(item => item.id !== wish.id);
        renderWishes();
        showNotice('愿望已删除。');
      } catch (error: unknown) {
        handleRequestError(error);
      }
    });

    card.appendChild(meta);
    card.appendChild(titleField);
    card.appendChild(categoryField);
    card.appendChild(blessingsField);
    card.appendChild(actions);
    card.appendChild(planEditor);
    return card;
  }

  function renderWishes(): void {
    const term = elements.searchInput.value.trim().toLocaleLowerCase('zh-CN');
    const filtered = term
      ? wishes.filter(wish => {
          const category = isCategoryId(wish.category) ? categoryNames[wish.category] : wish.categoryName || '';
          return `${wish.title} ${category}`.toLocaleLowerCase('zh-CN').includes(term);
        })
      : wishes;

    elements.wishList.replaceChildren(...filtered.map(createWishCard));
    elements.wishCount.textContent = `共 ${wishes.length} 条愿望${term ? `，当前显示 ${filtered.length} 条` : ''}`;
    elements.emptyState.classList.toggle('hidden', filtered.length !== 0);
  }

  async function loadWishes(): Promise<void> {
    elements.refreshButton.disabled = true;
    elements.wishCount.textContent = LOADING_WISHES_TEXT;
    try {
      const data = await api<UnpaginatedWishListResult>('/wishes');
      wishes = data.wishes || [];
      renderWishes();
    } catch (error: unknown) {
      if (handleRequestError(error)) return;
      elements.wishCount.textContent = '读取失败';
    } finally {
      elements.refreshButton.disabled = false;
    }
  }

  elements.loginForm.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();
    elements.loginMessage.textContent = '';
    try {
      await withBusyButton(elements.loginButton, '验证中...', () =>
        api<{ success: boolean }>('/login', {
          method: 'POST',
          body: JSON.stringify({ password: elements.passwordInput.value })
        })
      );
      elements.passwordInput.value = '';
      showDashboard();
      await loadWishes();
    } catch (error: unknown) {
      elements.loginMessage.textContent = error instanceof Error ? error.message : '登录失败';
      elements.passwordInput.select();
    }
  });

  elements.logoutButton.addEventListener('click', async () => {
    try {
      await api<{ success: boolean }>('/logout', { method: 'POST' });
    } finally {
      wishes = [];
      showLogin();
    }
  });

  elements.refreshButton.addEventListener('click', loadWishes);
  elements.searchInput.addEventListener('input', renderWishes);

  api<{ authenticated: boolean }>('/session')
    .then(() => {
      showDashboard();
      return loadWishes();
    })
    .catch(() => showLogin());
}

initAdminDashboard();
