/**
 * Single in-memory source of truth for SKU stock during the local demo.
 * Connector adapters read from this store, so one sale is reflected everywhere.
 */
export function createInventoryStore(initialStock) {
  const stock = new Map(Object.entries(initialStock));
  const listeners = new Set();

  function emit(change) {
    listeners.forEach((listener) => listener(change));
  }

  function setStock(sku, quantity, source = 'system') {
    if (!stock.has(sku)) throw new Error(`Unknown SKU: ${sku}`);
    if (!Number.isInteger(quantity) || quantity < 0) throw new RangeError('Stock must be a non-negative whole number.');
    const previousQuantity = stock.get(sku);
    stock.set(sku, quantity);
    const change = { sku, previousQuantity, quantity, source, updatedAt: new Date().toISOString() };
    emit(change);
    return change;
  }

  return Object.freeze({
    getStock: (sku) => stock.get(sku),
    list: () => [...stock].map(([sku, availableStock]) => ({ sku, availableStock })),
    setStock,
    decrement: (sku, quantity = 1, source = 'sale') => {
      if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError('Sale quantity must be at least one.');
      return setStock(sku, Math.max(0, stock.get(sku) - quantity), source);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}
