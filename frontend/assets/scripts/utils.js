/**
 * ─── Shared Frontend Utilities ───
 *
 * Central module for functions used across multiple pages.
 * Load this script BEFORE any page-specific scripts:
 *
 *   <script src="utils.js"></script>
 *
 * Sections:
 *   1. HTML Sanitization
 *   2. Price Formatting
 *   3. Cart Persistence
 */

/* ──────────────────────────────────────────────
 * 1. HTML Sanitization
 * ────────────────────────────────────────────── */

/**
 * Escape a string so it can be safely inserted into an HTML template.
 * Prevents XSS by converting &, <, >, ", and ' to HTML entities.
 *
 * @param {*} str - The value to escape (will be coerced to string).
 * @returns {string} The escaped string, safe for innerHTML use.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

/* ──────────────────────────────────────────────
 * 2. Price Formatting
 * ────────────────────────────────────────────── */

/**
 * Format a number as Nigerian Naira (₦) with locale-aware separators.
 *
 * @param {number} value - The amount to format.
 * @returns {string} Formatted price string, e.g. "₦4,500".
 */
function formatPrice(value) {
  return `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;
}
window.formatPrice = formatPrice;

/**
 * Parse a price string into a raw number.
 * Strips currency symbols, commas, and whitespace.
 *
 * @param {string|number} priceString - e.g. "₦4,500", "4500", or 4500.
 * @returns {number} The numeric value, or 0 if unparseable.
 */
function parsePrice(priceString) {
  return Number(String(priceString).replace(/[^0-9.-]+/g, '')) || 0;
}
window.parsePrice = parsePrice;

/* ──────────────────────────────────────────────
 * 3. Cart Persistence
 * ────────────────────────────────────────────── */

/** localStorage key used to store the cart array. */
const CART_STORAGE_KEY = 'foodieCart';

/** Discount rate applied to every cart item (10%). */
const ITEM_DISCOUNT_RATE = 0.1;
window.ITEM_DISCOUNT_RATE = ITEM_DISCOUNT_RATE;

/** Default food image shown when an item has no image URL. */
const DEFAULT_ITEM_IMAGE =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80';
window.DEFAULT_ITEM_IMAGE = DEFAULT_ITEM_IMAGE;

/**
 * Load the cart array from localStorage.
 * Returns an empty array if the data is missing or corrupt.
 *
 * @returns {Array<{name: string, price: number, quantity: number}>}
 */
function loadCart() {
  try {
    return JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch (_parseError) {
    return [];
  }
}
window.loadCart = loadCart;

/**
 * Save the cart to localStorage, then notify other tabs/pages
 * via a storage event so badge counts stay in sync.
 *
 * @param {Array} cart - The cart array to persist.
 */
function saveCart(cart) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('storage'));

  // Update the cart badge count on the current page if the function exists.
  if (typeof window.updateCartCountDisplay === 'function') {
    window.updateCartCountDisplay();
  }
}
window.saveCart = saveCart;
