const APP_DETAILS = {
  'order-inbox': { icon: '◫', title: 'Order Inbox', description: 'Your merged marketplace orders will appear here.' },
  inventory: { icon: '▦', title: 'Inventory', description: 'Shared SKU stock levels will appear here.' },
  invoice: { icon: '▤', title: 'Invoice Generator', description: 'Create a GST invoice from any marketplace order.' },
  replies: { icon: '✦', title: 'Customer Replies', description: 'Review messages and draft customer replies here.' },
};

export class WindowManager {
  #windows = new Map();
  #zIndex = 20;

  constructor({ desktop, taskbarApps }) {
    this.desktop = desktop;
    this.taskbarApps = taskbarApps;
  }

  open(appId, action = 'ready') {
    const details = APP_DETAILS[appId];
    if (!details) throw new Error(`Unknown OmniSeller app: ${appId}`);

    let windowElement = this.#windows.get(appId);
    if (!windowElement) {
      windowElement = this.#createWindow(appId, details, action);
      this.#windows.set(appId, windowElement);
      this.desktop.append(windowElement);
    }

    windowElement.hidden = false;
    windowElement.querySelector('[data-window-action]').textContent = action.replaceAll('-', ' ');
    this.focus(appId);
    return windowElement;
  }

  focus(appId) {
    const windowElement = this.#windows.get(appId);
    if (!windowElement || windowElement.hidden) return;

    this.#zIndex += 1;
    windowElement.style.zIndex = this.#zIndex;
    this.#windows.forEach((element, id) => element.classList.toggle('is-focused', id === appId));
    this.#renderTaskbar();
  }

  close(appId) {
    const windowElement = this.#windows.get(appId);
    if (!windowElement) return;
    windowElement.hidden = true;
    windowElement.classList.remove('is-focused');
    this.#renderTaskbar();
  }

  isOpen(appId) {
    const windowElement = this.#windows.get(appId);
    return Boolean(windowElement && !windowElement.hidden);
  }

  setContent(appId, content) {
    const windowElement = this.#windows.get(appId);
    if (!windowElement) throw new Error(`Cannot update unopened app: ${appId}`);
    const container = windowElement.querySelector('.window-content');
    container.replaceChildren(content);
  }

  #createWindow(appId, details, action) {
    const windowElement = document.createElement('article');
    windowElement.className = 'app-window os-window';
    windowElement.dataset.appId = appId;
    windowElement.style.left = `${Math.min(10 + this.#windows.size * 4, 34)}vw`;
    windowElement.style.top = `${Math.min(14 + this.#windows.size * 4, 42)}vh`;
    windowElement.innerHTML = `
      <header class="window-titlebar">
        <span class="window-icon" aria-hidden="true">${details.icon}</span>
        <strong>${details.title}</strong>
        <span class="window-action" data-window-action>${action.replaceAll('-', ' ')}</span>
        <button class="window-close" type="button" aria-label="Close ${details.title}">×</button>
      </header>
      <div class="window-content">
        <p>${details.title} opened.</p>
        <small>${details.description}</small>
      </div>`;

    windowElement.addEventListener('pointerdown', () => this.focus(appId));
    windowElement.querySelector('.window-close').addEventListener('click', (event) => {
      event.stopPropagation();
      this.close(appId);
    });
    this.#makeDraggable(windowElement, windowElement.querySelector('.window-titlebar'));
    return windowElement;
  }

  #makeDraggable(windowElement, handle) {
    handle.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      this.focus(windowElement.dataset.appId);
      const bounds = windowElement.getBoundingClientRect();
      const offsetX = event.clientX - bounds.left;
      const offsetY = event.clientY - bounds.top;
      handle.setPointerCapture(event.pointerId);

      const move = (moveEvent) => {
        const maxLeft = Math.max(8, window.innerWidth - bounds.width - 8);
        const maxTop = Math.max(8, window.innerHeight - bounds.height - 76);
        windowElement.style.left = `${Math.min(Math.max(8, moveEvent.clientX - offsetX), maxLeft)}px`;
        windowElement.style.top = `${Math.min(Math.max(8, moveEvent.clientY - offsetY), maxTop)}px`;
      };
      const stop = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', stop);
        handle.removeEventListener('pointercancel', stop);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    });
  }

  #renderTaskbar() {
    this.taskbarApps.innerHTML = '';
    this.#windows.forEach((windowElement, appId) => {
      if (windowElement.hidden) return;
      const details = APP_DETAILS[appId];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `taskbar-app${windowElement.classList.contains('is-focused') ? ' is-active' : ''}`;
      button.textContent = `${details.icon} ${details.title}`;
      button.addEventListener('click', () => this.focus(appId));
      this.taskbarApps.append(button);
    });
  }
}

export const APPS = APP_DETAILS;
