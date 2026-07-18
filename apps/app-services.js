const dateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export async function getUnifiedOrders(connectors) {
  const orders = (await Promise.all(connectors.map((connector) => connector.getOrders()))).flat();
  return orders.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
}

export async function getUnifiedInventory(connectors) {
  const listings = (await Promise.all(connectors.map((connector) => connector.getInventory()))).flat();
  const bySku = new Map();

  for (const item of listings) {
    const existing = bySku.get(item.sku) ?? { sku: item.sku, availableStock: item.availableStock, marketplaces: [] };
    existing.availableStock = Math.min(existing.availableStock, item.availableStock);
    existing.marketplaces.push(item.marketplace);
    bySku.set(item.sku, existing);
  }
  return [...bySku.values()].sort((a, b) => a.availableStock - b.availableStock);
}

export function buildGstInvoice(order) {
  if (!order) throw new Error('An order is required to generate an invoice.');
  const subtotal = order.quantity * order.unitPrice;
  const cgst = Math.round(subtotal * 0.09);
  const sgst = Math.round(subtotal * 0.09);
  return {
    invoiceNumber: `INV-${order.id}`,
    orderId: order.id,
    marketplace: order.marketplace,
    buyerName: order.buyerName,
    sku: order.sku,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    subtotal,
    cgst,
    sgst,
    total: subtotal + cgst + sgst,
    issuedAt: new Date().toISOString(),
  };
}

export async function getCustomerMessages(connectors) {
  const messages = (await Promise.all(connectors.map((connector) => connector.getMessages()))).flat();
  return messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function mockGenerateReply(message) {
  if (message.rating <= 2) {
    return `Hi ${message.customerName}, we are sorry your experience fell short. Please share your order details and our team will make this right.`;
  }
  return `Hi ${message.customerName}, thank you for taking the time to share this feedback. We are delighted to hear from you!`;
}

export const formatCurrency = (amount) => currencyFormatter.format(amount);
export const formatDate = (date) => dateFormatter.format(new Date(date));
