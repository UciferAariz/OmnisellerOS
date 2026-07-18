import { defineConnector } from './base.js';
import { createInventoryStore } from '../apps/inventory/inventory-store.js';

const copy = (value) => structuredClone(value);

const marketplaceNames = { amazon: 'Amazon', flipkart: 'Flipkart', meesho: 'Meesho', demo: 'Demo' };

/**
 * Reusable local marketplace adapter. Each instance has marketplace-specific
 * orders/messages but reads the same inventory store as every other adapter.
 */
export function createMockConnector(marketplace, inventoryStore) {
  const label = marketplaceNames[marketplace] ?? marketplace;
  const prefix = marketplace.toUpperCase();

  return defineConnector({
    marketplace,
    async getOrders() {
      return copy([{
        id: `${prefix}-4521`, marketplace, sku: 'SKU-DEMO-001', buyerName: `${label} Customer`,
        quantity: 1, unitPrice: 799, orderedAt: '2026-07-18T09:30:00+05:30', status: 'processing',
      }]);
    },
    async getInventory() {
      return inventoryStore.list().map(({ sku, availableStock }) => ({
        sku, marketplace, availableStock, updatedAt: new Date().toISOString(),
      }));
    },
    async updateStock(sku, quantity) {
      const change = inventoryStore.setStock(sku, quantity, marketplace);
      return { sku, marketplace, availableStock: change.quantity, updatedAt: change.updatedAt };
    },
    async getMessages() {
      return copy([{
        id: `${prefix}-MSG-001`, marketplace, customerName: `${label} Customer`,
        text: marketplace === 'meesho' ? 'The product arrived damaged and I need help.' : 'The packaging was excellent. Thank you!',
        rating: marketplace === 'meesho' ? 1 : 5,
        createdAt: '2026-07-18T08:15:00+05:30', sku: 'SKU-DEMO-001',
      }]);
    },
    // Demo-only sale event; production connectors call the same shared store
    // when their marketplace webhook or API reports an order.
    async simulateSale(sku, quantity = 1) {
      const change = inventoryStore.decrement(sku, quantity, `${marketplace} sale`);
      return { sku, marketplace, availableStock: change.quantity, updatedAt: change.updatedAt };
    },
  });
}

export function createDemoConnector() {
  return createMockConnector('demo', createInventoryStore({ 'SKU-DEMO-001': 24 }));
}
