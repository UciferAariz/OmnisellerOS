import { DEMO_COMMANDS, routeRequest } from '../kernel/router.js';
import { APPS, WindowManager } from './window-manager.js';
import { createMockConnector } from '../connectors/demo.js';
import { createAppController } from '../apps/app-controller.js';
import { createInventoryStore } from '../apps/inventory/inventory-store.js';

const desktop = document.querySelector('.desktop');
const consoleForm = document.querySelector('#kernel-console');
const requestInput = document.querySelector('#kernel-request');
const kernelLog = document.querySelector('#kernel-log');
const quickCommands = document.querySelector('#quick-commands');
const taskbarApps = document.querySelector('#taskbar-apps');
const appLaunchers = document.querySelectorAll('[data-app]');

if (!desktop) {
  throw new Error('OmniSeller OS could not find the desktop root.');
}

if (!consoleForm || !requestInput || !kernelLog || !quickCommands || !taskbarApps) {
  throw new Error('OmniSeller OS could not initialize the kernel console.');
}

const windowManager = new WindowManager({ desktop, taskbarApps });
const inventoryStore = createInventoryStore({ 'SKU-DEMO-001': 24 });
const connectors = ['amazon', 'flipkart', 'meesho'].map((marketplace) => createMockConnector(marketplace, inventoryStore));
const amazonConnector = connectors[0];
const appController = createAppController(connectors, {
  onSimulateSale: async () => {
    const sale = await amazonConnector.simulateSale('SKU-DEMO-001');
    kernelLog.textContent = `Sync: Amazon sale recorded. ${sale.sku} is now ${sale.availableStock} across every marketplace.`;
  },
});

inventoryStore.subscribe((change) => {
  if (windowManager.isOpen('inventory')) {
    openApplication('inventory', 'stock synchronized');
  }
});

async function openApplication(appId, action, request = '') {
  windowManager.open(appId, action);
  const loading = document.createElement('p');
  loading.textContent = 'Loading connector data…';
  windowManager.setContent(appId, loading);
  try {
    windowManager.setContent(appId, await appController.render(appId, request));
  } catch (error) {
    const failure = document.createElement('p');
    failure.textContent = `Unable to load this app: ${error.message}`;
    windowManager.setContent(appId, failure);
  }
}

function runRequest(request) {
  const route = routeRequest(request);
  if (!route) {
    kernelLog.textContent = 'Kernel: I could not match that. Try orders, stock, invoice, or reply.';
    return;
  }

  kernelLog.textContent = route.message;
  openApplication(route.app, route.action, route.request);
  console.info(route.message, route);
}

consoleForm.addEventListener('submit', (event) => {
  event.preventDefault();
  runRequest(requestInput.value);
});

for (const command of DEMO_COMMANDS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'quick-command';
  button.textContent = command;
  button.addEventListener('click', () => {
    requestInput.value = command;
    runRequest(command);
  });
  quickCommands.append(button);
}

for (const launcher of appLaunchers) {
  launcher.addEventListener('click', () => {
    const appId = launcher.dataset.app;
    openApplication(appId, APPS[appId].title.toLowerCase());
    kernelLog.textContent = `Shell: opened ${APPS[appId].title}.`;
  });
}

console.info('OmniSeller OS shell and kernel console are ready.');
