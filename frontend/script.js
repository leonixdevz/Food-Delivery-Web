/**
 * ─── Home Page Logic ───
 *
 * Handles the main landing page interactions:
 *   - Restaurant search filtering
 *   - Menu category chip toggling
 *   - Adding items to cart from menu cards
 *   - Hero section scroll-to-restaurant
 *
 * Depends on: utils.js (loadCart, saveCart, parsePrice)
 */

/* ──────────────────────────────────────────────
 * DOM References
 * ────────────────────────────────────────────── */

const menuCards = document.querySelectorAll('.menu-card');
const categoryChips = document.querySelectorAll('.chip');
const restaurantCards = document.querySelectorAll('.restaurant-card');
const searchInputElement = document.getElementById('searchInput');
const searchButtonElement = document.getElementById('searchButton');
const cartBadgeElement = document.getElementById('cartCount');
const heroOrderButton = document.getElementById('heroOrderBtn');
const restaurantSectionElement = document.getElementById('restaurants');

/* ──────────────────────────────────────────────
 * Cart Badge
 * ────────────────────────────────────────────── */

/** Update the cart badge count from the current in-memory cart. */
function refreshCartBadge() {
  const cart = loadCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadgeElement) {
    cartBadgeElement.textContent = String(totalItems);
  }
}

/* ──────────────────────────────────────────────
 * Add to Cart
 * ────────────────────────────────────────────── */

/**
 * Add a menu item to the cart.
 * If the item already exists, increments its quantity.
 * Otherwise, adds a new entry.
 *
 * @param {string} itemName - The dish name.
 * @param {string|number} itemPrice - The price (may be formatted string).
 */
function addToCart(itemName, itemPrice) {
  const cart = loadCart();
  const numericPrice = parsePrice(itemPrice);
  const existingItem = cart.find((item) => item.name === itemName);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name: itemName, price: numericPrice, quantity: 1 });
  }

  saveCart(cart);
  refreshCartBadge();

  // Show a toast notification if the toast system is available
  if (typeof window.showCartToast === 'function') {
    const defaultImage = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80';
    window.showCartToast(itemName, numericPrice, defaultImage);
  }
}

/* ──────────────────────────────────────────────
 * Category Chip Filtering
 * ────────────────────────────────────────────── */

/**
 * Set up category chip click handlers.
 * Clicking a chip shows only menu cards matching that category,
 * and hides all others.
 */
function initializeCategoryChips() {
  if (!categoryChips.length) return;

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const selectedFilter = chip.dataset.filter;

      // Update active state on chips
      categoryChips.forEach((otherChip) => otherChip.classList.remove('active'));
      chip.classList.add('active');

      // Show/hide menu cards based on category match
      menuCards.forEach((card) => {
        const isMatch = selectedFilter === 'all' || card.dataset.category === selectedFilter;
        card.style.display = isMatch ? 'block' : 'none';
      });
    });
  });
}

/* ──────────────────────────────────────────────
 * Restaurant Search
 * ────────────────────────────────────────────── */

/**
 * Filter visible restaurant cards by a search query.
 * Matches against the card's visible text content.
 * Shows a "no results" message if nothing matches.
 *
 * @param {string} searchQuery - The text to search for.
 */
function filterRestaurantsByQuery(searchQuery) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  let matchCount = 0;

  restaurantCards.forEach((card) => {
    const cardText = card.textContent.toLowerCase();
    const isMatch = !normalizedQuery || cardText.includes(normalizedQuery);
    card.style.display = isMatch ? 'block' : 'none';
    if (isMatch) matchCount += 1;
  });

  // Toggle the "no results" message
  const noResultsMessage = document.querySelector('.no-results-message');
  if (noResultsMessage) {
    noResultsMessage.style.display = matchCount === 0 ? 'block' : 'none';
  }
}

/** Wire up the search button and Enter key to trigger filtering. */
function initializeSearch() {
  if (!searchButtonElement || !searchInputElement) return;

  searchButtonElement.addEventListener('click', () => {
    filterRestaurantsByQuery(searchInputElement.value);
  });

  searchInputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      filterRestaurantsByQuery(searchInputElement.value);
    }
  });
}

/* ──────────────────────────────────────────────
 * Menu Card Add-to-Cart Buttons
 * ────────────────────────────────────────────── */

/** Attach click handlers to the "Add to cart" button on each menu card. */
function initializeMenuCardButtons() {
  menuCards.forEach((card) => {
    const addButton = card.querySelector('.add-btn');
    if (addButton) {
      addButton.addEventListener('click', () => {
        addToCart(card.dataset.name, card.dataset.price);
      });
    }
  });
}

/* ──────────────────────────────────────────────
 * Hero Scroll Action
 * ────────────────────────────────────────────── */

/** Make the hero "Order Now" button scroll down to the restaurant section. */
function initializeHeroScroll() {
  if (heroOrderButton && restaurantSectionElement) {
    heroOrderButton.addEventListener('click', () => {
      restaurantSectionElement.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/* ──────────────────────────────────────────────
 * Initialization
 * ────────────────────────────────────────────── */

initializeCategoryChips();
initializeSearch();
initializeMenuCardButtons();
initializeHeroScroll();

window.addEventListener('DOMContentLoaded', refreshCartBadge);
