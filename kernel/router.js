/**
 * Rule-based request router for the offline demo.
 *
 * This boundary intentionally keeps natural-language interpretation separate
 * from app behavior. Replace `routeRequest` with a model-backed function later
 * without changing callers or the result shape.
 */

const ROUTES = [
  {
    app: 'invoice',
    appLabel: 'Invoice Generator',
    action: 'generate-invoice',
    patterns: [/\binvoice\b/i, /\bgst\b/i, /\bbill\b/i],
  },
  {
    app: 'order-inbox',
    appLabel: 'Order Inbox',
    action: 'show-orders',
    patterns: [/\border(s)?\b/i, /\bsales?\b/i, /\binbox\b/i],
  },
  {
    app: 'inventory',
    appLabel: 'Inventory',
    action: 'show-inventory',
    patterns: [/\blow\s+stock\b/i, /\binventory\b/i, /\bstock\b/i, /\bsku\b/i],
  },
  {
    app: 'replies',
    appLabel: 'Customer Replies',
    action: 'draft-reply',
    patterns: [/\breply\b/i, /\breview\b/i, /\bmessage\b/i, /\bcustomer\b/i],
  },
];

/**
 * @typedef {{ app: string, appLabel: string, action: string, request: string, message: string }} RouteResult
 */

/**
 * Matches a plain-English request to an app and action.
 * @param {string} request
 * @returns {RouteResult | null}
 */
export function routeRequest(request) {
  const normalizedRequest = String(request ?? '').trim();
  if (!normalizedRequest) return null;

  const route = ROUTES.find(({ patterns }) => patterns.some((pattern) => pattern.test(normalizedRequest)));
  if (!route) return null;

  return {
    app: route.app,
    appLabel: route.appLabel,
    action: route.action,
    request: normalizedRequest,
    message: `Kernel: routing to ${route.appLabel}.`,
  };
}

export const DEMO_COMMANDS = [
  'Show today\'s orders',
  'Who is low on stock?',
  'Generate invoice for order #4521',
  'Reply to this 1-star Meesho review',
];
