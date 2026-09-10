/**
 * ─── Cart Panel (Slide-in Modal) ───
 *
 * Provides the cart sidebar that appears across all pages.
 * This module handles:
 *   - Creating the panel DOM on first use
 *   - Rendering cart items with quantity controls
 *   - Calculating subtotal, discount, and total
 *   - Opening/closing the panel
 *   - Syncing badge counts across tabs
 *
 * Depends on: utils.js (loadCart, saveCart, formatPrice, parsePrice, escapeHtml)
 */



/* ──────────────────────────────────────────────
 * Badge Count
 * ────────────────────────────────────────────── */

/**
 * Update every cart badge element on the page to reflect
 * the total number of items in the cart.
 */
function updateCartCountDisplay() {
  const cart = loadCart();
  const totalItemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  document.querySelectorAll('#cartCount, .cart-count').forEach((badge) => {
    badge.textContent = String(totalItemCount);
  });
}

/* ──────────────────────────────────────────────
 * Panel Creation
 * ────────────────────────────────────────────── */

/**
 * Ensure the cart panel DOM exists in the page.
 * On first call, creates the full panel structure and attaches
 * event listeners for close/continue/checkout buttons.
 * On subsequent calls, returns the existing element.
 *
 * @returns {HTMLElement} The cart panel root element.
 */
function getOrCreateCartPanel() {
  const existing = document.getElementById('foodieCartModal');
  if (existing) return existing;

  const panel = document.createElement('div');
  panel.id = 'foodieCartModal';
  panel.className = 'foodie-cart-modal';
  panel.innerHTML = `
    <div class="foodie-cart-backdrop" data-close-cart="true"></div>
    <aside class="foodie-cart-panel" aria-modal="true" role="dialog" aria-label="Cart panel">
      <div class="foodie-cart-header">
        <div>
          <span class="eyebrow">Your cart</span>
          <h3>Order summary</h3>
        </div>
        <button class="foodie-cart-close" type="button" aria-label="Close cart">✕</button>
      </div>

      <div class="foodie-cart-items"></div>

      <div class="foodie-cart-summary">
        <div class="foodie-cart-row">
          <span>Subtotal</span>
          <strong id="foodieSubtotal">₦0.00</strong>
        </div>
        <div class="foodie-cart-row">
          <span>Delivery</span>
          <strong>₦500</strong>
        </div>
        <div class="foodie-cart-row">
          <span>Discount</span>
          <strong id="foodieDiscount">₦0.00</strong>
        </div>
        <div class="foodie-cart-row foodie-cart-total">
          <span>Total</span>
          <strong id="foodieGrandTotal">₦0.00</strong>
        </div>
      </div>

      <div class="foodie-cart-actions">
        <button class="btn btn-secondary foodie-cart-continue" type="button">Continue shopping</button>
        <button class="btn btn-primary foodie-cart-checkout" type="button">Proceed to checkout</button>
      </div>
    </aside>
  `;

  document.body.appendChild(panel);

  // Wire up panel action buttons
  panel.querySelector('.foodie-cart-close').addEventListener('click', hideCartPanel);
  panel.querySelector('.foodie-cart-continue').addEventListener('click', hideCartPanel);
  panel.querySelector('.foodie-cart-checkout').addEventListener('click', () => {
    hideCartPanel();
    window.location.href = new URL('../checkout-page/checkout.html', window.location.href).toString();
  });
  panel.querySelector('[data-close-cart="true"]').addEventListener('click', hideCartPanel);

  return panel;
}

/* ──────────────────────────────────────────────
 * Panel Rendering
 * ────────────────────────────────────────────── */

/**
 * Calculate price breakdown for a single cart item.
 *
 * @param {Object} item - Cart item with price and quantity.
 * @returns {{ original: number, discount: number, payable: number }}
 */
function calculateItemPricing(item) {
  const unitPrice = parsePrice(item.price);
  const quantity = item.quantity || 1;
  const original = unitPrice * quantity;
  const discount = original * ITEM_DISCOUNT_RATE;
  const payable = original - discount;
  return { original, discount, payable };
}

/**
 * Render a single cart item's HTML row.
 * All user-controlled strings are escaped to prevent XSS.
 *
 * @param {Object} item - Cart item to render.
 * @returns {string} HTML string for the item row.
 */
function renderItemRow(item) {
  const { original, payable } = calculateItemPricing(item);
  const quantity = item.quantity || 1;

  const safeName = escapeHtml(item.name);
  const safeCategory = escapeHtml(item.category || 'Food');
  const safeImage = escapeHtml(item.image || DEFAULT_ITEM_IMAGE);

  return `
    <div class="foodie-cart-item">
      <img src="${safeImage}" alt="${safeName}" />
      <div class="foodie-cart-item-copy">
        <div class="foodie-cart-item-top">
          <h4>${safeName}</h4>
          <button class="foodie-remove-item" type="button" data-remove-name="${safeName}">Remove</button>
        </div>
        <p>${safeCategory}</p>
        <div class="foodie-cart-item-meta">
          <div class="foodie-qty-wrap">
            <button type="button" data-qty-action="decrease" data-item-name="${safeName}">−</button>
            <span>${quantity}</span>
            <button type="button" data-qty-action="increase" data-item-name="${safeName}">+</button>
          </div>
          <strong>${formatPrice(payable)}</strong>
        </div>
      </div>
    </div>
  `;
}

/**
 * Refresh the contents of the cart panel — rebuild item rows,
 * recalculate totals, and re-attach quantity/remove listeners.
 */
function refreshCartPanelContents() {
  const panel = getOrCreateCartPanel();
  const items = loadCart();
  const itemsContainer = panel.querySelector('.foodie-cart-items');
  const subtotalElement = panel.querySelector('#foodieSubtotal');
  const discountElement = panel.querySelector('#foodieDiscount');
  const totalElement = panel.querySelector('#foodieGrandTotal');

  if (!itemsContainer || !subtotalElement || !totalElement) return;

  // Empty cart state
  if (!items.length) {
    itemsContainer.innerHTML =
      '<p class="foodie-empty-state">Your cart is empty. Add dishes from the menu to get started.</p>';
    subtotalElement.textContent = '₦0.00';
    if (discountElement) discountElement.textContent = '₦0.00';
    totalElement.textContent = '₦0.00';
    return;
  }

  // Build item rows and accumulate totals
  let runningSubtotal = 0;
  let runningDiscount = 0;

  itemsContainer.innerHTML = items.map((item) => {
    const pricing = calculateItemPricing(item);
    runningSubtotal += pricing.original;
    runningDiscount += pricing.discount;
    return renderItemRow(item);
  }).join('');

  const deliveryFee = 500;
  const grandTotal = runningSubtotal + deliveryFee - runningDiscount;

  subtotalElement.textContent = formatPrice(runningSubtotal);
  if (discountElement) discountElement.textContent = formatPrice(runningDiscount);
  totalElement.textContent = formatPrice(grandTotal);

  // Attach event listeners for quantity +/- and remove buttons
  attachCartItemListeners(itemsContainer);
}

/**
 * Attach click handlers to quantity and remove buttons inside the cart panel.
 * Uses event delegation via data attributes on each button.
 *
 * @param {HTMLElement} container - The items container element.
 */
function attachCartItemListeners(container) {
  // Remove item buttons
  container.querySelectorAll('[data-remove-name]').forEach((button) => {
    button.addEventListener('click', () => {
      const itemName = button.dataset.removeName;
      const updatedCart = loadCart().filter((entry) => entry.name !== itemName);
      saveCart(updatedCart);
      refreshCartPanelContents();
    });
  });

  // Quantity increase/decrease buttons
  container.querySelectorAll('[data-qty-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const itemName = button.dataset.itemName;
      const action = button.dataset.qtyAction;
      const cart = loadCart();
      const targetItem = cart.find((entry) => entry.name === itemName);
      if (!targetItem) return;

      if (action === 'increase') {
        targetItem.quantity = (targetItem.quantity || 1) + 1;
      }
      if (action === 'decrease') {
        targetItem.quantity = Math.max(1, (targetItem.quantity || 1) - 1);
      }

      saveCart(cart);
      refreshCartPanelContents();
    });
  });
}

/* ──────────────────────────────────────────────
 * Panel Open / Close
 * ────────────────────────────────────────────── */

/** Show the cart panel and lock body scrolling. */
function showCartPanel() {
  refreshCartPanelContents();
  const panel = document.getElementById('foodieCartModal');
  if (!panel) return;
  panel.classList.add('is-open');
  document.body.classList.add('cart-modal-open');
}

/** Hide the cart panel and restore body scrolling. */
function hideCartPanel() {
  const panel = document.getElementById('foodieCartModal');
  if (!panel) return;
  panel.classList.remove('is-open');
  document.body.classList.remove('cart-modal-open');
}

/* ──────────────────────────────────────────────
 * Cart Button Bindings
 * ────────────────────────────────────────────── */

/**
 * Find all cart pill buttons on the page and make them open the panel.
 */
function bindCartPillButtons() {
  document.querySelectorAll('button.cart-pill').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      showCartPanel();
    });
  });
}

/* ──────────────────────────────────────────────
 * Global API & Lifecycle
 * ────────────────────────────────────────────── */

// Expose functions needed by other scripts (e.g. addToCart in script.js)
window.updateCartCountDisplay = updateCartCountDisplay;
window.showCartPanel = showCartPanel;
window.hideCartPanel = hideCartPanel;

// Initialize on page load and sync across tabs
window.addEventListener('DOMContentLoaded', () => {
  updateCartCountDisplay();
  bindCartPillButtons();
});

window.addEventListener('storage', () => {
  updateCartCountDisplay();
  const panel = document.getElementById('foodieCartModal');
  const isOpen = panel && document.body.classList.contains('cart-modal-open');
  if (isOpen) {
    refreshCartPanelContents();
  }
});
