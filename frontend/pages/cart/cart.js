/**
 * ─── Cart Page Logic ───
 *
 * Full-page cart view with item list, quantity controls,
 * promo code input, and checkout navigation.
 *
 * Depends on: utils.js (loadCart, saveCart, formatPrice, parsePrice, escapeHtml)
 */



/* ──────────────────────────────────────────────
 * DOM References
 * ────────────────────────────────────────────── */

const cartItemsContainer = document.getElementById('cartItems');
const subtotalDisplay = document.getElementById('subtotalTotal');
const discountDisplay = document.getElementById('discountTotal');
const grandTotalDisplay = document.getElementById('grandTotal');
const checkoutButton = document.getElementById('proceedCheckout');
const promoCodeInput = document.getElementById('promoCode');
const applyPromoButton = document.getElementById('applyPromo');

/* ──────────────────────────────────────────────
 * Rendering
 * ────────────────────────────────────────────── */

/**
 * Render the full cart page: item list, quantity controls,
 * and price summary. Shows an empty-state message if the cart is empty.
 */
function renderCartPageContents() {
  const cart = loadCart();
  const deliveryFee = 500;

  if (!cartItemsContainer || !subtotalDisplay || !grandTotalDisplay) return;

  // Empty cart state
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-state">Your cart is empty. Add items to continue.</p>';
    subtotalDisplay.textContent = '₦0.00';
    if (discountDisplay) discountDisplay.textContent = '₦0.00';
    grandTotalDisplay.textContent = '₦0.00';
    if (checkoutButton) checkoutButton.disabled = true;
    return;
  }

  if (checkoutButton) checkoutButton.disabled = false;
  cartItemsContainer.innerHTML = '';

  let runningSubtotal = 0;
  let runningDiscount = 0;

  // Build each cart item row
  cart.forEach((item) => {
    const unitPrice = parsePrice(item.price);
    const quantity = item.quantity || 1;
    const originalTotal = unitPrice * quantity;
    const itemDiscount = originalTotal * ITEM_DISCOUNT_RATE;
    const payableTotal = originalTotal - itemDiscount;
    runningSubtotal += originalTotal;
    runningDiscount += itemDiscount;

    const safeName = escapeHtml(item.name);
    const safeCategory = escapeHtml(item.category || 'Food');
    const safeImage = escapeHtml(item.image || DEFAULT_ITEM_IMAGE);

    const row = document.createElement('div');
    row.className = 'cart-item checkout-item';
    row.innerHTML = `
      <div class="cart-item-image">
        <img src="${safeImage}" alt="${safeName}" />
      </div>
      <div class="cart-item-details">
        <h3>${safeName}</h3>
        <p>${safeCategory}</p>
        <div class="qty-controls">
          <button class="qty-btn" data-action="decrease" data-name="${safeName}">−</button>
          <span>${quantity}</span>
          <button class="qty-btn" data-action="increase" data-name="${safeName}">+</button>
        </div>
      </div>
      <div class="cart-item-meta">
        <strong>${formatPrice(payableTotal)}</strong>
        <small>${formatPrice(originalTotal)} before discount</small>
        <button class="btn remove-btn" data-action="remove" data-name="${safeName}">Remove</button>
      </div>
    `;
    cartItemsContainer.appendChild(row);
  });

  // Update summary totals
  const grandTotal = runningSubtotal + deliveryFee - runningDiscount;
  subtotalDisplay.textContent = formatPrice(runningSubtotal);
  if (discountDisplay) discountDisplay.textContent = formatPrice(runningDiscount);
  grandTotalDisplay.textContent = formatPrice(grandTotal);
}

/* ──────────────────────────────────────────────
 * Item Interaction (quantity +/-, remove)
 * ────────────────────────────────────────────── */

/**
 * Handle clicks on quantity increase, decrease, and remove buttons.
 * Uses event delegation on the cart items container.
 */
function handleCartItemAction(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const itemName = button.dataset.name;
  const cart = loadCart();
  const targetItem = cart.find((entry) => entry.name === itemName);
  if (!targetItem) return;

  if (action === 'increase') targetItem.quantity += 1;
  if (action === 'decrease') targetItem.quantity = Math.max(1, targetItem.quantity - 1);
  if (action === 'remove') {
    const itemIndex = cart.findIndex((entry) => entry.name === itemName);
    cart.splice(itemIndex, 1);
  }

  saveCart(cart);
  renderCartPageContents();
}

/* ──────────────────────────────────────────────
 * Promo Code
 * ────────────────────────────────────────────── */

/**
 * Handle promo code submission.
 * The built-in "FOODIE10" code is accepted but the discount
 * is already applied automatically to every item.
 */
function handlePromoCodeApply() {
  const enteredCode = (promoCodeInput?.value || '').trim().toUpperCase();

  if (enteredCode === 'FOODIE10') {
    if (promoCodeInput) promoCodeInput.disabled = true;
    if (applyPromoButton) applyPromoButton.disabled = true;
    renderCartPageContents();
    alert('This order already gets the 10% automatic discount applied.');
    return;
  }

  alert('Promo code not valid. Try FOODIE10.');
}

/* ──────────────────────────────────────────────
 * Navigation
 * ────────────────────────────────────────────── */

/** Navigate to the checkout page. */
function navigateToCheckout() {
  window.location.href = '/pages/checkout/index.html';
}

/* ──────────────────────────────────────────────
 * Initialization
 * ────────────────────────────────────────────── */

if (cartItemsContainer) {
  cartItemsContainer.addEventListener('click', handleCartItemAction);
}

if (applyPromoButton) {
  applyPromoButton.addEventListener('click', handlePromoCodeApply);
}

if (checkoutButton) {
  checkoutButton.addEventListener('click', navigateToCheckout);
}

window.addEventListener('DOMContentLoaded', renderCartPageContents);
window.addEventListener('storage', renderCartPageContents);
