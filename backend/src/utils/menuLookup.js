/**
 * ─── Server-Side Menu Price Validation ───
 *
 * Provides a trusted price index for all menu items across restaurants.
 * Used by the order creation route to recalculate totals from server-side
 * prices instead of trusting client-supplied values.
 *
 * Sections:
 *   1. Trusted Menu Catalog (name → price)
 *   2. Price Index Construction
 *   3. Order Total Recalculation
 */

/* ──────────────────────────────────────────────
 * 1. Trusted Menu Catalog
 * ────────────────────────────────────────────── */

/** Fallback menu items per restaurant — the single source of truth for prices. */
const TRUSTED_MENU_CATALOG = [
  {
    slug: 'chicken-republic',
    menu: [
      { name: 'Grilled Chicken Combo', price: 4500 },
      { name: 'Spicy Chicken Bucket', price: 6800 },
      { name: 'Chicken Burger', price: 2800 },
      { name: 'Rice & Chicken Box', price: 3500 },
      { name: 'Coke Bottle', price: 900 },
      { name: '7Up Bottle', price: 900 },
      { name: 'Fanta Bottle', price: 900 },
      { name: 'Iced Tea', price: 700 },
    ],
  },
  {
    slug: 'mama-put-restaurant',
    menu: [
      { name: 'Amala & Ewedu', price: 3800 },
      { name: 'Egusi Soup Combo', price: 4900 },
      { name: 'Jollof Rice Plate', price: 4200 },
      { name: 'Pounded Yam & Vegetable Soup', price: 4500 },
      { name: 'Kunu', price: 1000 },
      { name: 'Fresh Zobo Drink', price: 500 },
      { name: 'Coke Bottle', price: 850 },
      { name: '7Up Bottle', price: 850 },
    ],
  },
  {
    slug: 'pizza-hub',
    menu: [
      { name: 'Pepperoni Pizza', price: 5400 },
      { name: 'Margherita Pizza', price: 4900 },
      { name: 'Chicken Tikka Pizza', price: 6000 },
      { name: 'Chocolate Lava Cake', price: 2600 },
      { name: 'Coke Bottle', price: 850 },
      { name: '7Up Bottle', price: 850 },
      { name: 'Sprite Bottle', price: 850 },
      { name: 'Iced Tea', price: 700 },
    ],
  },
  {
    slug: 'burger-king',
    menu: [
      { name: 'Classic Burger', price: 3000 },
      { name: 'Double Cheese Burger', price: 4200 },
      { name: 'Loaded Fries With Ketchup', price: 1500 },
      { name: 'Jollof Rice Box', price: 3500 },
      { name: 'Coke Bottle', price: 900 },
      { name: '7Up Bottle', price: 900 },
      { name: 'Vanilla Milkshake', price: 1200 },
      { name: 'Iced Tea', price: 700 },
    ],
  },
  {
    slug: 'buka-hut',
    menu: [
      { name: 'Small Chops with Meat', price: 7500 },
      { name: 'Jollof Rice', price: 1500 },
      { name: 'Goat Meat Suya', price: 6200 },
      { name: 'Grilled Chicken Rice Bowl', price: 4200 },
      { name: 'Fresh Zobo Drink', price: 500 },
      { name: 'Kunu', price: 700 },
      { name: 'Coke Bottle', price: 900 },
      { name: '7Up Bottle', price: 900 },
    ],
  },
];

/* ──────────────────────────────────────────────
 * 2. Price Index Construction
 * ────────────────────────────────────────────── */

/** Fixed delivery fee charged on every order (in Naira). */
const DELIVERY_FEE = 500;

/** Discount rate applied to the subtotal (10%). */
const DISCOUNT_RATE = 0.1;

/**
 * Build a flat lookup map of item name → trusted price.
 * If an item appears in multiple restaurants, the first occurrence wins.
 *
 * @returns {Map<string, number>}
 */
function buildMenuItemPriceIndex() {
  const priceIndex = new Map();
  for (const restaurant of TRUSTED_MENU_CATALOG) {
    for (const menuItem of restaurant.menu) {
      if (!priceIndex.has(menuItem.name)) {
        priceIndex.set(menuItem.name, menuItem.price);
      }
    }
  }
  return priceIndex;
}

/** Pre-built price index, constructed once at module load time. */
const menuItemPrices = buildMenuItemPriceIndex();

/* ──────────────────────────────────────────────
 * 3. Order Total Recalculation
 * ────────────────────────────────────────────── */

/**
 * Validate all items against the trusted price index and recalculate
 * the order total from server-side prices.
 *
 * Client-supplied subtotal, deliveryFee, discount, and total are
 * completely ignored — the server is the source of truth.
 *
 * @param {Array<Object>} items - Cart items from the client request.
 * @returns {{ validated: boolean, recalculated: Object|null }}
 *   - validated: true if every item name was found in the price index
 *   - recalculated: the corrected order breakdown, or null if validation failed
 */
function validateAndRecalculateOrderTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { validated: false, recalculated: null };
  }

  let runningSubtotal = 0;

  // Look up the trusted price for each item
  const validatedItems = items.map((item) => {
    const trustedPrice = menuItemPrices.get(item.name);

    if (trustedPrice === undefined) {
      // Mark unknown items so we can detect failures
      return { ...item, _unknown: true };
    }

    const quantity = Number(item.quantity) || 1;
    runningSubtotal += trustedPrice * quantity;
    return { ...item, price: trustedPrice, quantity };
  });

  // If any item was not found in the catalog, reject the order
  const hasUnknownItems = validatedItems.some((item) => item._unknown);
  if (hasUnknownItems) {
    return { validated: false, recalculated: null };
  }

  // Calculate final totals from trusted prices
  const discount = Math.round(runningSubtotal * DISCOUNT_RATE);
  const grandTotal = runningSubtotal + DELIVERY_FEE - discount;

  return {
    validated: true,
    recalculated: {
      items: validatedItems.map(({ _unknown, ...rest }) => rest),
      subtotal: runningSubtotal,
      deliveryFee: DELIVERY_FEE,
      discount,
      total: grandTotal,
    },
  };
}

module.exports = { validateAndRecalculateOrderTotal, DELIVERY_FEE, DISCOUNT_RATE };
