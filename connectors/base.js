/**
 * OmniSeller connector contract
 *
 * Every marketplace adapter must expose the same four async functions:
 *
 * - getOrders(): Promise<Order[]>
 * - getInventory(): Promise<InventoryItem[]>
 * - updateStock(sku, quantity): Promise<InventoryItem>
 * - getMessages(): Promise<CustomerMessage[]>
 *
 * `updateStock` receives the absolute shared stock quantity. The inventory
 * service will later own the shared SKU state and call each connector with the
 * resulting quantity, ensuring every marketplace reflects one source of truth.
 *
 * @typedef {Object} Order
 * @property {string} id Unique marketplace order ID.
 * @property {string} marketplace Marketplace identifier, e.g. "amazon".
 * @property {string} sku SKU ID from data/skus.json.
 * @property {string} buyerName Customer name.
 * @property {number} quantity Positive whole-number quantity.
 * @property {number} unitPrice Price per unit in INR.
 * @property {string} orderedAt ISO 8601 date-time.
 * @property {"pending"|"processing"|"shipped"|"delivered"|"cancelled"} status Order status.
 *
 * @typedef {Object} InventoryItem
 * @property {string} sku SKU ID from data/skus.json.
 * @property {string} marketplace Marketplace identifier.
 * @property {number} availableStock Non-negative whole-number quantity.
 * @property {string} updatedAt ISO 8601 date-time.
 *
 * @typedef {Object} CustomerMessage
 * @property {string} id Unique message or review ID.
 * @property {string} marketplace Marketplace identifier.
 * @property {string} customerName Customer name.
 * @property {string} text Customer message or review body.
 * @property {1|2|3|4|5} rating Customer rating.
 * @property {string} createdAt ISO 8601 date-time.
 * @property {string|null} sku Related SKU ID, if known.
 *
 * @typedef {Object} MarketplaceConnector
 * @property {string} marketplace Marketplace identifier.
 * @property {() => Promise<Order[]>} getOrders
 * @property {() => Promise<InventoryItem[]>} getInventory
 * @property {(sku: string, quantity: number) => Promise<InventoryItem>} updateStock
 * @property {() => Promise<CustomerMessage[]>} getMessages
 */

const CONNECTOR_METHODS = ['getOrders', 'getInventory', 'updateStock', 'getMessages'];

/**
 * Fails early when a marketplace module does not meet the shared contract.
 * @param {MarketplaceConnector} connector
 * @returns {MarketplaceConnector}
 */
export function defineConnector(connector) {
  if (!connector || typeof connector.marketplace !== 'string' || !connector.marketplace.trim()) {
    throw new TypeError('A connector must define a non-empty marketplace identifier.');
  }

  for (const method of CONNECTOR_METHODS) {
    if (typeof connector[method] !== 'function') {
      throw new TypeError(`${connector.marketplace} connector must implement ${method}().`);
    }
  }

  return Object.freeze(connector);
}
