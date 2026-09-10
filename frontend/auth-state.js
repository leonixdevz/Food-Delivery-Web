/**
 * ─── Profile Header & Toast Notifications ───
 *
 * Manages the topbar profile avatar across all pages:
 *   - Shows user initial if signed in, or generic icon if not
 *   - Shows a logout confirmation toast when clicking the avatar while signed in
 *   - Provides a cart "item added" toast notification
 *
 * Depends on: nothing (self-contained, uses global localStorage)
 */

/* ──────────────────────────────────────────────
 * Logout Confirmation Toast
 * ────────────────────────────────────────────── */

/**
 * Ensure the logout confirmation toast DOM exists.
 * Creates it on first call, returns existing on subsequent calls.
 *
 * @returns {HTMLElement} The toast element.
 */
function getOrCreateLogoutToast() {
  const existing = document.querySelector('.logout-toast');
  if (existing) return existing;

  const toast = document.createElement('div');
  toast.className = 'logout-toast';
  toast.innerHTML = `
    <div class="toast-copy">
      <strong>Stay logged in?</strong>
      <p>Do you want to stay signed in or logout from Foodie?</p>
    </div>
    <div class="toast-actions">
      <button class="btn toast-btn stay-btn" type="button">Stay</button>
      <button class="btn toast-btn logout-btn" type="button">Logout</button>
    </div>
  `;

  document.body.appendChild(toast);
  return toast;
}

/* ──────────────────────────────────────────────
 * Cart "Added" Toast
 * ────────────────────────────────────────────── */

/**
 * Ensure the cart notification toast DOM exists.
 * Creates it on first call, returns existing on subsequent calls.
 *
 * @returns {HTMLElement} The toast element.
 */
function getOrCreateCartToast() {
  const existing = document.querySelector('.cart-toast');
  if (existing) return existing;

  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.innerHTML = `
    <div class="cart-toast-icon">✓</div>
    <div class="cart-toast-product">
      <img class="cart-toast-image" alt="Cart item" />
      <div class="cart-toast-copy">
        <strong>Added to cart</strong>
        <p>Item added</p>
      </div>
      <span class="cart-toast-price">₦0</span>
    </div>
  `;

  document.body.appendChild(toast);
  return toast;
}

/* ──────────────────────────────────────────────
 * Public Toast Functions (called by other scripts)
 * ────────────────────────────────────────────── */

/**
 * Display the "item added to cart" toast with item details.
 * Auto-hides after 2.6 seconds.
 *
 * @param {string} itemName - Name of the added item.
 * @param {number|null} itemPrice - Price of the item.
 * @param {string} imageUrl - Image URL for the item.
 */
function showCartToast(itemName = 'Item', itemPrice = null, imageUrl = '') {
  const toast = getOrCreateCartToast();
  const titleElement = toast.querySelector('strong');
  const messageElement = toast.querySelector('p');
  const priceElement = toast.querySelector('.cart-toast-price');
  const imageElement = toast.querySelector('.cart-toast-image');

  if (titleElement) titleElement.textContent = `${itemName} added`;
  if (messageElement) messageElement.textContent = 'Your item is now in the cart.';
  if (priceElement) {
    priceElement.textContent = itemPrice ? `₦${Number(itemPrice).toLocaleString('en-NG')}` : '₦0';
  }
  if (imageElement) {
    const defaultImage = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80';
    imageElement.src = imageUrl || defaultImage;
    imageElement.alt = itemName;
  }

  // Reset and trigger the show animation
  toast.classList.remove('visible');
  window.clearTimeout(toast._hideTimer);
  requestAnimationFrame(() => toast.classList.add('visible'));

  // Auto-hide after 2.6 seconds
  toast._hideTimer = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 2600);
}

/**
 * Display the logout confirmation toast with "Stay" and "Logout" buttons.
 * Auto-hides after 7 seconds if no action is taken.
 *
 * @param {Object} options - Configuration options.
 * @param {string} [options.homePath] - Where to redirect after logout.
 */
function showLogoutToast(options = {}) {
  const toast = getOrCreateLogoutToast();
  if (toast.classList.contains('visible')) return;

  toast.classList.add('visible');

  const stayButton = toast.querySelector('.stay-btn');
  const logoutButton = toast.querySelector('.logout-btn');

  // Auto-hide timer — dismiss if the user doesn't interact
  const autoHideTimer = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 7000);

  /** Dismiss the toast and cancel the auto-hide timer. */
  function dismissToast() {
    toast.classList.remove('visible');
    window.clearTimeout(autoHideTimer);
  }

  stayButton.addEventListener('click', dismissToast, { once: true });

  logoutButton.addEventListener(
    'click',
    () => {
      // Clear stored credentials
      window.localStorage.removeItem('foodieUser');
      window.localStorage.removeItem('foodieToken');

      // Determine where to redirect after logout
      const profileLink = document.getElementById('profileLink');
      const homePath = options.homePath
        || (profileLink?.dataset?.home)
        || 'index.html';
      window.location.href = homePath;
    },
    { once: true },
  );
}

/* ──────────────────────────────────────────────
 * Profile Avatar State
 * ────────────────────────────────────────────── */

/**
 * Handle a click on the profile avatar when the user is signed in.
 * Shows the logout confirmation toast instead of navigating.
 *
 * @param {Event} event - The click event.
 */
function handleSignedInProfileClick(event) {
  event.preventDefault();
  showLogoutToast();
}

/**
 * Synchronize the profile avatar in the topbar with the current auth state.
 * Shows the user's initial if signed in, or a generic icon if not.
 * Links to the account page or auth page accordingly.
 */
function syncProfileHeaderState() {
  const profileLink = document.getElementById('profileLink');
  const profileNameDisplay = document.getElementById('profileName');
  const storedUser = JSON.parse(window.localStorage.getItem('foodieUser') || 'null');

  if (!profileLink) return;

  const accountPagePath = profileLink.dataset.account || 'account.html';
  const authPagePath = profileLink.dataset.auth || 'auth.html';

  // Remove any previous click handler before re-attaching
  profileLink.removeEventListener('click', handleSignedInProfileClick);

  if (storedUser && storedUser.email) {
    // Signed-in state: show user initial, link to account page
    profileLink.href = accountPagePath;
    profileLink.setAttribute('aria-label', 'View account');

    const displayName = storedUser.username || storedUser.name;
    profileLink.textContent = displayName ? displayName.charAt(0).toUpperCase() : 'U';
    profileLink.classList.add('signed-in');

    if (profileNameDisplay) {
      profileNameDisplay.textContent = displayName || 'Foodie User';
    }

    profileLink.addEventListener('click', handleSignedInProfileClick);
  } else {
    // Signed-out state: show generic icon, link to auth page
    const redirectUrl = `${authPagePath}?redirect=${encodeURIComponent(window.location.href)}`;
    profileLink.href = redirectUrl;
    profileLink.setAttribute('aria-label', 'Sign in or sign up');
    profileLink.textContent = '\uD83D\uDC64';
    profileLink.classList.remove('signed-in');

    if (profileNameDisplay) {
      profileNameDisplay.textContent = '';
    }
  }
}

/* ──────────────────────────────────────────────
 * Global API & Initialization
 * ────────────────────────────────────────────── */

// Expose toast functions for use by other scripts (e.g. script.js, preview-page/script.js)
window.showCartToast = showCartToast;

window.addEventListener('DOMContentLoaded', syncProfileHeaderState);
