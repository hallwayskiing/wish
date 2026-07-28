export function requireElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Required DOM element #${id} was not found.`);
  }
  return el as T;
}

export function queryElement<T extends HTMLElement = HTMLElement>(selector: string, parent: ParentNode = document): T {
  const el = parent.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Required DOM element with selector "${selector}" was not found.`);
  }
  return el;
}

export function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function showModal(modal: HTMLElement): void {
  modal.classList.add('show');
}

export function hideModal(modal: HTMLElement): void {
  modal.classList.remove('show');
}

export function bindModalBackdrop(modal: HTMLElement, close: () => void): void {
  modal.addEventListener('click', (event: MouseEvent) => {
    if (event.target === modal) close();
  });
}

export function showToast(message: string): void {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}
