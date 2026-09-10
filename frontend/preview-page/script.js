/**
 * ─── Dish Preview Page Logic ───
 *
 * Displays a single menu item with image, description, price,
 * and quantity selector before adding it to the cart.
 *
 * Data source: URL parameters or sessionStorage (set by the restaurant page).
 *
 * Depends on: utils.js (loadCart, saveCart, formatPrice, parsePrice, DEFAULT_ITEM_IMAGE)
 */

/* ──────────────────────────────────────────────
 * DOM References
 * ────────────────────────────────────────────── */

const previewImageContainer = document.getElementById('previewImage');
const previewNameDisplay = document.getElementById('previewName');
const previewCategoryBadge = document.getElementById('previewCategory');
const previewDescriptionText = document.getElementById('previewDescription');
const previewPriceDisplay = document.getElementById('previewPrice');
const previewQuantityDisplay = document.getElementById('previewQuantity');
const previewTotalDisplay = document.getElementById('previewTotal');
const summaryNameDisplay = document.getElementById('summaryName');
const summaryCategoryDisplay = document.getElementById('summaryCategory');
const addToCartButton = document.getElementById('confirmBtn');
const confirmationStatusMessage = document.getElementById('confirmationMessage');
const increaseQuantityButton = document.getElementById('increaseQty');
const decreaseQuantityButton = document.getElementById('decreaseQty');
const backToMenuLink = document.querySelector('.back-link');

/* ──────────────────────────────────────────────
 * State
 * ────────────────────────────────────────────── */

/** The current menu item being previewed. */
let currentPreviewItem = null;

/** The user-selected quantity (starts at 1). */
let selectedQuantity = 1;

/* ──────────────────────────────────────────────
 * API Helpers
 * ────────────────────────────────────────────── */

/**
 * Fetch a restaurant's full data (including menu) by its slug.
 * Returns null if the API call fails.
 *
 * @param {string} restaurantSlug - e.g. "pizza-hub"
 * @returns {Promise<Object|null>} The restaurant object or null.
 */
async function fetchRestaurantBySlug(restaurantSlug) {
  try {
    const response = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}`);
    if (!response.ok) throw new Error('Could not fetch restaurant details.');
    return await response.json();
  } catch (_error) {
    console.warn('Restaurant API lookup failed, using fallback data.');
    return null;
  }
}

/* ──────────────────────────────────────────────
 * Image Path Resolution
 * ────────────────────────────────────────────── */

/**
 * Normalize a relative image path into a full URL.
 * Handles paths like "../images/foo.jpeg", "images/foo.jpeg", and absolute URLs.
 *
 * @param {string} rawImagePath - The raw image path from the data source.
 * @returns {string} A resolved, encoded image URL.
 */
function resolveItemImagePath(rawImagePath) {
  if (!rawImagePath) return DEFAULT_ITEM_IMAGE;
  if (/^https?:\/\//i.test(rawImagePath) || rawImagePath.startsWith('data:')) {
    return rawImagePath;
  }

  let cleanPath = rawImagePath
    .replace(/^(\.\.\/|\.\/)/, '')
    .replace(/^images\//, '');

  try {
    cleanPath = decodeURI(cleanPath);
  } catch (_decodeError) {
    // Keep original if decoding fails
  }

  return encodeURI(`../images/${cleanPath}`);
}

/* ──────────────────────────────────────────────
 * Preview Display
 * ────────────────────────────────────────────── */

/** Update the displayed price and total based on the selected quantity. */
function refreshPreviewTotals() {
  if (!currentPreviewItem) return;
  const unitPrice = parsePrice(currentPreviewItem.price);
  previewQuantityDisplay.textContent = String(selectedQuantity);
  previewTotalDisplay.textContent = formatPrice(unitPrice * selectedQuantity);
}

/**
 * Populate all preview fields with the current item's data.
 */
function renderPreviewDetails() {
  if (!currentPreviewItem) return;

  const imageUrl = resolveItemImagePath(currentPreviewItem.image || '');
  const imageElement = previewImageContainer?.querySelector('img');

  if (imageElement) {
    imageElement.src = imageUrl;
    imageElement.alt = currentPreviewItem.name;
  }

  previewNameDisplay.textContent = currentPreviewItem.name;
  previewCategoryBadge.textContent = currentPreviewItem.category
    ? currentPreviewItem.category.toUpperCase()
    : 'Food';
  previewDescriptionText.textContent =
    currentPreviewItem.desc || 'A delicious item ready to preview before adding to your cart.';
  previewPriceDisplay.textContent = formatPrice(parsePrice(currentPreviewItem.price || '0'));
  summaryNameDisplay.textContent = currentPreviewItem.name;
  summaryCategoryDisplay.textContent = `Category: ${currentPreviewItem.category || 'Food'}`;
  confirmationStatusMessage.textContent = 'Preview the selection and choose your quantity before adding it to cart.';
  addToCartButton.disabled = false;

  refreshPreviewTotals();
}

/* ──────────────────────────────────────────────
 * Back Link Setup
 * ────────────────────────────────────────────── */

/** Set the "Back" link to point to the correct restaurant page. */
function configureBackLink() {
  if (!backToMenuLink || !currentPreviewItem) return;

  const restaurantPath = currentPreviewItem.restaurant
    ? `../resturant-page/index.html?restaurant=${encodeURIComponent(currentPreviewItem.restaurant)}`
    : '../resturant-page/index.html';

  backToMenuLink.href = restaurantPath;
  backToMenuLink.textContent = currentPreviewItem.restaurant
    ? '← Back to restaurant'
    : '← Back to menu';
}

/* ──────────────────────────────────────────────
 * Data Loading
 * ────────────────────────────────────────────── */

/**
 * Load the preview item data from sessionStorage or URL parameters.
 * Optionally refreshes the data from the API to get the latest price.
 */
async function initializePreviewPage() {
  const urlParams = new URLSearchParams(window.location.search);
  let item = null;

  // Try sessionStorage first (set by the restaurant page's "Add to cart" flow)
  const storedItem = window.sessionStorage.getItem('previewItem');
  if (storedItem) {
    try {
      item = JSON.parse(storedItem);
    } catch (_parseError) {
      item = null;
    }
  }

  // Fall back to URL parameters
  if (!item && urlParams.has('name')) {
    item = {
      name: urlParams.get('name'),
      price: urlParams.get('price'),
      image: urlParams.get('image'),
      category: urlParams.get('category'),
      desc: urlParams.get('desc'),
      restaurant: urlParams.get('restaurant'),
    };
  }

  // No item found — show error state
  if (!item || !item.name) {
    confirmationStatusMessage.textContent = 'No preview item selected. Return to menu and choose a food or drink.';
    addToCartButton.disabled = true;
    if (backToMenuLink) backToMenuLink.href = '../resturant-page/index.html';
    return;
  }

  // Try to get the latest price from the restaurant API
  if (item.restaurant) {
    const restaurant = await fetchRestaurantBySlug(item.restaurant);
    if (restaurant && Array.isArray(restaurant.menu)) {
      const matchingMenuItem = restaurant.menu.find((menuItem) => menuItem.name === item.name);
      if (matchingMenuItem) {
        item = {
          ...item,
          price: matchingMenuItem.price,
          image: matchingMenuItem.image || item.image,
          category: matchingMenuItem.category || item.category,
          desc: matchingMenuItem.desc || item.desc,
        };
      }
    }
  }

  currentPreviewItem = item;
  selectedQuantity = 1;

  configureBackLink();
  renderPreviewDetails();
}

/* ──────────────────────────────────────────────
 * Add to Cart
 * ────────────────────────────────────────────── */

/**
 * Add the previewed item to the cart with the selected quantity.
 * Shows a toast notification and updates the confirmation message.
 */
function addItemToCartFromPreview() {
  if (!currentPreviewItem) return;

  const cart = loadCart();
  const existingItem = cart.find((item) => item.name === currentPreviewItem.name);

  if (existingItem) {
    existingItem.quantity += selectedQuantity;
  } else {
    cart.push({
      name: currentPreviewItem.name,
      price: parsePrice(currentPreviewItem.price),
      image: currentPreviewItem.image,
      category: currentPreviewItem.category,
      quantity: selectedQuantity,
    });
  }

  saveCart(cart);

  // Update the status message
  confirmationStatusMessage.textContent = `${currentPreviewItem.name} has been added to your cart.`;

  // Show cart toast notification
  if (typeof window.showCartToast === 'function') {
    const itemPrice = parsePrice(currentPreviewItem.price || '0');
    const itemImage = currentPreviewItem.image || DEFAULT_ITEM_IMAGE;
    window.showCartToast(currentPreviewItem.name, itemPrice, itemImage);
  }
}

/* ──────────────────────────────────────────────
 * Event Listeners
 * ────────────────────────────────────────────── */

increaseQuantityButton.addEventListener('click', () => {
  selectedQuantity += 1;
  refreshPreviewTotals();
});

decreaseQuantityButton.addEventListener('click', () => {
  if (selectedQuantity > 1) {
    selectedQuantity -= 1;
    refreshPreviewTotals();
  }
});

addToCartButton.addEventListener('click', addItemToCartFromPreview);

/* ──────────────────────────────────────────────
 * Initialization
 * ────────────────────────────────────────────── */

initializePreviewPage();
