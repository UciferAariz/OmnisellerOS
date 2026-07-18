import {
  buildGstInvoice,
  formatCurrency,
  formatDate,
  getCustomerMessages,
  getUnifiedInventory,
  getUnifiedOrders,
  mockGenerateReply,
} from './app-services.js';

const create = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
};

const table = (headers, rows) => {
  const element = document.createElement('table');
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach((header) => headerRow.append(create('th', header)));
  head.append(headerRow);
  const body = document.createElement('tbody');
  rows.forEach((row) => {
    const rowElement = document.createElement('tr');
    row.forEach((cell) => rowElement.append(create('td', String(cell))));
    body.append(rowElement);
  });
  element.append(head, body);
  return element;
};

export function createAppController(connectors, { onSimulateSale } = {}) {
  async function render(appId, request = '') {
    const content = document.createDocumentFragment();
    if (appId === 'order-inbox') {
      const orders = await getUnifiedOrders(connectors);
      content.append(create('p', `${orders.length} unified order${orders.length === 1 ? '' : 's'} across all connected marketplaces.`, 'app-summary'));
      content.append(table(['Order', 'Marketplace', 'Buyer', 'SKU', 'Total', 'Status'], orders.map((order) => [
        order.id, order.marketplace, order.buyerName, order.sku, formatCurrency(order.quantity * order.unitPrice), order.status,
      ])));
    } else if (appId === 'inventory') {
      const inventory = await getUnifiedInventory(connectors);
      content.append(create('p', 'Shared inventory view. Every connected marketplace reads the same SKU truth.', 'app-summary'));
      content.append(table(['SKU', 'Shared stock', 'Marketplace listings'], inventory.map((item) => [
        item.sku, item.availableStock, item.marketplaces.join(', '),
      ])));
      if (onSimulateSale) {
        const saleButton = create('button', 'Simulate Amazon sale (-1)', 'simulate-sale');
        saleButton.type = 'button';
        saleButton.addEventListener('click', onSimulateSale);
        content.append(saleButton);
      }
    } else if (appId === 'invoice') {
      const orders = await getUnifiedOrders(connectors);
      const requestedId = request.match(/#?([A-Za-z]+-)?(\d+)/)?.[0];
      const order = orders.find((item) => item.id.includes(requestedId?.replace('#', '') ?? '')) ?? orders[0];
      const invoice = buildGstInvoice(order);
      content.append(create('p', `${invoice.invoiceNumber} - GST invoice generated from ${invoice.marketplace}.`, 'app-summary'));
      content.append(table(['Field', 'Value'], [
        ['Buyer', invoice.buyerName], ['SKU', invoice.sku], ['Quantity', invoice.quantity], ['Subtotal', formatCurrency(invoice.subtotal)],
        ['CGST (9%)', formatCurrency(invoice.cgst)], ['SGST (9%)', formatCurrency(invoice.sgst)], ['Grand total', formatCurrency(invoice.total)],
      ]));
    } else if (appId === 'replies') {
      const messages = await getCustomerMessages(connectors);
      const message = messages.find((item) => item.rating <= 2) ?? messages[0];
      content.append(create('p', `${message.marketplace} review from ${message.customerName} (${message.rating}/5) - ${formatDate(message.createdAt)}`, 'app-summary'));
      content.append(create('blockquote', `“${message.text}”`, 'customer-message'));
      content.append(create('h3', 'Draft reply'));
      content.append(create('p', mockGenerateReply(message), 'draft-reply'));
    } else {
      throw new Error(`Cannot render unknown app: ${appId}`);
    }
    return content;
  }

  return { render };
}
