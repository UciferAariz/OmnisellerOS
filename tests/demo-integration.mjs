import assert from 'node:assert/strict';
import { routeRequest } from '../kernel/router.js';
import { createMockConnector } from '../connectors/demo.js';
import { createInventoryStore } from '../apps/inventory/inventory-store.js';
import {
  buildGstInvoice,
  getCustomerMessages,
  getUnifiedInventory,
  getUnifiedOrders,
  mockGenerateReply,
} from '../apps/app-services.js';

const store = createInventoryStore({ 'SKU-DEMO-001': 24 });
const connectors = ['amazon', 'flipkart', 'meesho'].map((marketplace) => createMockConnector(marketplace, store));
const [amazon] = connectors;

function expectRoute(command, app) {
  assert.equal(routeRequest(command)?.app, app, `Expected “${command}” to route to ${app}`);
}

// 1. Unified orders
expectRoute("show today's orders", 'order-inbox');
const orders = await getUnifiedOrders(connectors);
assert.equal(orders.length, 3);
assert.deepEqual(new Set(orders.map((order) => order.marketplace)), new Set(['amazon', 'flipkart', 'meesho']));

// 2. Cross-platform stock sync
expectRoute('who is low on stock?', 'inventory');
await amazon.simulateSale('SKU-DEMO-001');
const inventory = await getUnifiedInventory(connectors);
assert.equal(inventory[0].availableStock, 23);
assert.deepEqual(new Set(inventory[0].marketplaces), new Set(['amazon', 'flipkart', 'meesho']));

// 3. GST invoice
expectRoute('generate invoice for order #4521', 'invoice');
const invoice = buildGstInvoice(orders.find((order) => order.id === 'AMAZON-4521'));
assert.equal(invoice.orderId, 'AMAZON-4521');
assert.equal(invoice.total, 943);

// 4. 1-star customer reply
expectRoute('reply to this 1-star Meesho review', 'replies');
const messages = await getCustomerMessages(connectors);
const meeshoReview = messages.find((message) => message.marketplace === 'meesho' && message.rating === 1);
assert.ok(meeshoReview, 'Expected a 1-star Meesho review');
assert.match(mockGenerateReply(meeshoReview), /sorry your experience fell short/i);

console.log('Full OmniSeller demo integration passed');
