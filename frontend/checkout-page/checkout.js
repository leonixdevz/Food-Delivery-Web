/**
 * ─── Checkout Page Logic ───
 *
 * Manages the checkout flow:
 *   - Order summary display with price breakdown
 *   - Payment method selection and info panel toggling
 *   - Delivery address input
 *   - Order creation via API
 *   - Demo payment simulation
 *
 * Depends on: utils.js (loadCart, saveCart, formatPrice, parsePrice)
 */



/* ──────────────────────────────────────────────
 * DOM References
 * ────────────────────────────────────────────── */

// Summary display elements
const subtotalDisplay = document.getElementById('subtotalAmount');
const deliveryFeeDisplay = document.getElementById('deliveryAmount');
const discountDisplay = document.getElementById('discountAmount');
const grandTotalDisplay = document.getElementById('summaryTotal');

// Action buttons
const placeOrderButton = document.getElementById('placeOrderBtn');
const changeAddressButton = document.getElementById('changeAddressBtn');

// Address elements
const selectedAddressDisplay = document.getElementById('selectedAddress');
const addressEditContainer = document.getElementById('addressEdit');
const deliveryAddressInput = document.getElementById('deliveryAddressInput');

// Payment method radio buttons
const paymentMethodRadios = Array.from(document.querySelectorAll('input[name="payment"]'));

// Payment info panels
const simulatedPaymentInfo = document.getElementById('paymentInfoSimulated');
const demoPaymentConfigPanel = document.getElementById('demoPaymentPanel');

// Demo payment form fields
const demoCustomerNameInput = document.getElementById('demoPaymentName');
const demoCardNumberInput = document.getElementById('demoCardNumber');
const demoCardExpiryInput = document.getElementById('demoCardExpiry');
const demoCardCvvInput = document.getElementById('demoCardCvv');
const demoOutcomeSelect = document.getElementById('demoPaymentOutcome');

// Bank transfer section
const bankTransferSection = document.getElementById('bankTransferDetails');
const transferAmountDisplay = document.getElementById('transferAmount');
const paymentProofFileInput = document.getElementById('paymentProofInput');
const paymentProofLabelDisplay = document.getElementById('paymentProofLabel');

/** Stores the filename of the uploaded payment proof (not the file itself). */
let selectedProofFileName = '';

/* ──────────────────────────────────────────────
 * Session & Auth Helpers
 * ────────────────────────────────────────────── */

/** Retrieve the JWT token from localStorage. */
function getUserSessionToken() {
  return window.localStorage.getItem('foodieToken');
}

/** Retrieve the current user object from localStorage. */
function getLoggedInUser() {
  return JSON.parse(window.localStorage.getItem('foodieUser') || 'null');
}

/** Clear stored authentication credentials. */
function clearSessionCredentials() {
  window.localStorage.removeItem('foodieToken');
  window.localStorage.removeItem('foodieUser');
}

/**
 * Generate or retrieve an idempotency key for the current checkout session.
 * This prevents duplicate orders if the user clicks "Place order" multiple times.
 *
 * @returns {string} A UUID or fallback random string.
 */
function getOrGenerateCheckoutKey() {
  const storageKey = 'foodieCheckoutIdempotencyKey';
  let key = window.sessionStorage.getItem(storageKey);

  if (!key) {
    const hasRandomUUID = window.crypto && typeof window.crypto.randomUUID === 'function';
    key = hasRandomUUID
      ? window.crypto.randomUUID()
      : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(storageKey, key);
  }

  return key;
}

/* ──────────────────────────────────────────────
 * Authenticated API Request
 * ────────────────────────────────────────────── */

/**
 * Send an API request with the current user's JWT token.
 * Automatically handles 401 responses by clearing credentials
 * and redirecting to the login page.
 *
 * @param {string} endpoint - The API path (e.g. "/api/orders").
 * @param {Object} options - fetch() options (method, body, etc.).
 * @returns {Promise<Object>} The parsed JSON response.
 * @throws {Error} If the response is not OK.
 */
async function sendAuthenticatedRequest(endpoint, options = {}) {
  const token = getUserSessionToken();
  const headers = options.headers || {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Automatically stringify JSON bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(endpoint, { ...options, headers });

  let responseBody;
  try {
    responseBody = await response.json();
  } catch (_parseError) {
    responseBody = {};
  }

  // Session expired — redirect to login
  if (response.status === 401) {
    clearSessionCredentials();
    const redirectUrl = `../auth.html?redirect=${encodeURIComponent(window.location.href)}`;
    window.location.href = redirectUrl;
    throw new Error('Your session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(responseBody.message || 'Request failed.');
  }

  return responseBody;
}

/* ──────────────────────────────────────────────
 * Payment Method Selection
 * ────────────────────────────────────────────── */

/** Determine which payment method the user has selected. */
function getChosenPaymentMethod() {
  const selectedRadio = paymentMethodRadios.find((radio) => radio.checked);
  return selectedRadio ? selectedRadio.value : 'demo';
}

/**
 * Show/hide payment info panels based on the selected method.
 */
function togglePaymentInfoPanels() {
  const method = getChosenPaymentMethod();
  const isDemo = method === 'demo' || method === 'simulated';
  if (simulatedPaymentInfo) simulatedPaymentInfo.hidden = !isDemo;
  if (demoPaymentConfigPanel) demoPaymentConfigPanel.hidden = !isDemo;
}

/**
 * No-op for compatibility with older helper calls.
 * This project intentionally uses only a single simulated payment flow.
 */
function toggleBankTransferDetails() {
  if (placeOrderButton) {
    placeOrderButton.textContent = 'Place order';
  }
}

/* ──────────────────────────────────────────────
 * Order Summary Display
 * ────────────────────────────────────────────── */

/**
 * Calculate order totals from the cart and refresh the summary display.
 * Delivery fee is fixed at ₦500; discount is 10% of subtotal.
 */
function refreshOrderSummary() {
  const cart = loadCart();
  const deliveryFee = 500;
  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const discount = subtotal * ITEM_DISCOUNT_RATE;
  const grandTotal = subtotal + deliveryFee - discount;

  if (subtotalDisplay) subtotalDisplay.textContent = formatPrice(subtotal);
  if (deliveryFeeDisplay) deliveryFeeDisplay.textContent = formatPrice(deliveryFee);
  if (discountDisplay) discountDisplay.textContent = formatPrice(discount);
  if (grandTotalDisplay) grandTotalDisplay.textContent = formatPrice(grandTotal);
  if (placeOrderButton) placeOrderButton.disabled = cart.length === 0;

  togglePaymentInfoPanels();
  toggleBankTransferDetails(grandTotal);
}

/* ──────────────────────────────────────────────
 * Confirmation URL Builder
 * ────────────────────────────────────────────── */

/**
 * Build the confirmation page URL with order details as query parameters.
 *
 * @param {Object} params - Order details to encode.
 * @returns {string} The full confirmation.html URL.
 */
function buildConfirmationUrl({ subtotal, deliveryFee, discount, total, payment, orderId, reference, address }) {
  const params = new URLSearchParams();
  params.set('subtotal', String(subtotal));
  params.set('delivery', String(deliveryFee));
  params.set('discount', String(discount));
  params.set('total', String(total));
  params.set('payment', payment);
  params.set('orderId', orderId);
  if (reference) params.set('reference', reference);
  if (address) params.set('address', address);
  return `confirmation.html?${params.toString()}`;
}

/* ──────────────────────────────────────────────
 * Order Placement
 * ────────────────────────────────────────────── */

/**
 * Handle the "Place order" button click.
 * Creates the order via API, then processes the selected payment method.
 */
async function handlePlaceOrder() {
  const cart = loadCart();
  if (cart.length === 0) return;

  const token = getUserSessionToken();
  const user = getLoggedInUser();

  // Redirect to login if not authenticated
  if (!token || !user) {
    window.location.href = `../auth.html?redirect=${encodeURIComponent(window.location.href)}`;
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const deliveryFee = 500;
  const discount = subtotal * ITEM_DISCOUNT_RATE;
  const total = subtotal + deliveryFee - discount;
  const deliveryAddress = deliveryAddressInput ? deliveryAddressInput.value.trim() : '';

  if (!deliveryAddress) {
    alert('Please enter a delivery address.');
    return;
  }

  if (!isDemoCardComplete()) {
    alert('Please enter demo card details to continue.');
    return;
  }

  try {
    const order = await sendAuthenticatedRequest('/api/orders', {
      method: 'POST',
      body: {
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: parsePrice(item.price),
          image: item.image,
          category: item.category,
        })),
        subtotal,
        deliveryFee,
        discount,
        total,
        deliveryAddress,
        paymentMethod: 'simulated',
        idempotencyKey: getOrGenerateCheckoutKey(),
        paymentProofFileName: selectedProofFileName,
        bankTransferDetails: '',
      },
    });

    await processDemoPayment(order, { subtotal, deliveryFee, discount, total, deliveryAddress });
  } catch (error) {
    if (placeOrderButton) {
      placeOrderButton.disabled = false;
      placeOrderButton.textContent = 'Place order';
    }
    alert(error.message || 'Unable to place order. Please try again.');
  }
}

/**
 * Simulate a payment via the demo endpoint.
 * Waits 2.2 seconds to mimic a real payment gateway, then redirects.
 *
 * @param {Object} order - The created order object.
 * @param {Object} pricing - Price breakdown for the confirmation URL.
 */
function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function isDemoCardComplete() {
  const name = demoCustomerNameInput ? demoCustomerNameInput.value.trim() : '';
  const cardNumber = digitsOnly(demoCardNumberInput ? demoCardNumberInput.value : '');
  const expiry = demoCardExpiryInput ? demoCardExpiryInput.value.trim() : '';
  const cvv = digitsOnly(demoCardCvvInput ? demoCardCvvInput.value : '');
  return name.length >= 2 && cardNumber.length >= 12 && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length >= 3;
}

async function processDemoPayment(order, pricing) {
  placeOrderButton.disabled = true;
  placeOrderButton.textContent = 'Processing demo payment...';

  await new Promise((resolve) => setTimeout(resolve, 2200));

  const demoResponse = await sendAuthenticatedRequest('/api/payments/demo', {
    method: 'POST',
    body: {
      orderId: order.orderId,
      outcome: demoOutcomeSelect ? demoOutcomeSelect.value : 'success',
      channel: 'Demo card',
      name: demoCustomerNameInput ? demoCustomerNameInput.value.trim() : '',
    },
  });

  if (!demoResponse || !demoResponse.reference) {
    alert('The demo payment could not be completed. Please try again.');
    placeOrderButton.disabled = false;
    placeOrderButton.textContent = 'Place order';
    return;
  }

  saveCart([]);
  window.sessionStorage.removeItem('foodieCheckoutIdempotencyKey');

  if (demoResponse.outcome === 'declined') {
    alert(`Demo payment declined. Reference: ${demoResponse.reference}`);
  } else if (demoResponse.outcome === 'pending') {
    alert(`Demo payment is pending. Reference: ${demoResponse.reference}`);
  }

  navigateToConfirmation({
    ...pricing,
    payment: demoResponse.outcome,
    orderId: order.orderId,
    reference: demoResponse.reference,
  });
}

/**
 * Navigate to the confirmation page with order details in the URL.
 *
 * @param {Object} params - Order details to pass via query string.
 */
function navigateToConfirmation(params) {
  window.location.href = buildConfirmationUrl(params);
}

/* ──────────────────────────────────────────────
 * Event Listeners
 * ────────────────────────────────────────────── */

// Refresh summary when payment method changes
paymentMethodRadios.forEach((radio) => {
  radio.addEventListener('change', refreshOrderSummary);
});

// Handle payment proof file selection
if (paymentProofFileInput) {
  paymentProofFileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    selectedProofFileName = files && files[0] ? files[0].name : '';
    if (paymentProofLabelDisplay) {
      paymentProofLabelDisplay.textContent = selectedProofFileName || 'Choose a receipt or screenshot';
    }
  });
}

if (demoCardNumberInput) {
  demoCardNumberInput.addEventListener('input', () => {
    const digits = digitsOnly(demoCardNumberInput.value).slice(0, 16);
    demoCardNumberInput.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
}

if (demoCardExpiryInput) {
  demoCardExpiryInput.addEventListener('input', () => {
    const digits = digitsOnly(demoCardExpiryInput.value).slice(0, 4);
    demoCardExpiryInput.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });
}

if (demoCardCvvInput) {
  demoCardCvvInput.addEventListener('input', () => {
    demoCardCvvInput.value = digitsOnly(demoCardCvvInput.value).slice(0, 4);
  });
}

// Place order button
placeOrderButton.addEventListener('click', handlePlaceOrder);

// Change address button — reveal the address input field
if (changeAddressButton) {
  changeAddressButton.addEventListener('click', () => {
    if (addressEditContainer) addressEditContainer.hidden = false;
    if (deliveryAddressInput) {
      deliveryAddressInput.focus();
      deliveryAddressInput.select();
    }
  });
}

// Sync the displayed address with the input field
if (deliveryAddressInput && selectedAddressDisplay) {
  deliveryAddressInput.addEventListener('input', () => {
    selectedAddressDisplay.textContent = deliveryAddressInput.value.trim() || 'Enter a delivery address';
  });
}

// Initial render
refreshOrderSummary();
