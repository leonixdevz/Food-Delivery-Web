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

// Order items list (food thumbnails)
const orderItemsList = document.getElementById('orderItemsList');
const orderItemsCount = document.getElementById('orderItemsCount');

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

// Bank transfer section (legacy ids; these elements no longer exist on the page)
const bankTransferSection = document.getElementById('bankTransferDetails');
const transferAmountDisplay = document.getElementById('transferAmount');
const paymentProofFileInput = document.getElementById('paymentProofInput');
const paymentProofLabelDisplay = document.getElementById('paymentProofLabel');
const opayAccountBankNameDisplay = document.getElementById('opayBankName');

// OPay payment elements
const opayPaymentPanel = document.getElementById('opayPaymentPanel');
const opayBankNameDisplay = document.getElementById('opayBankName');
const opayAccountNameDisplay = document.getElementById('opayAccountName');
const opayAccountNumberDisplay = document.getElementById('opayAccountNumber');
const opayAmountDisplay = document.getElementById('opayAmount');
const copyOpayNumberButton = document.getElementById('copyOpayNumberBtn');
const openOpayAppButton = document.getElementById('openOpayAppBtn');
const opayPaidButton = document.getElementById('opayPaidBtn');
const opayConfigWarning = document.getElementById('opayConfigWarning');
const opayStepsList = document.getElementById('opaySteps');

/** OPay account details fetched from the server (null until loaded). */
let opayAccountConfig = null;
/** The order created for the current OPay payment attempt. */
let opayPendingOrder = null;
/** Pricing snapshot for the confirmation URL after OPay payment. */
let opayPricing = null;
/** Timer handle for the OPay auto-verification poll. */
let opayPollTimer = null;
/** The initiate response for the current OPay attempt (mode, account details). */
let opayInitiateResponse = null;

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
    const redirectUrl = `/pages/auth/login.html?redirect=${encodeURIComponent(window.location.href)}`;
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
  const isOpay = method === 'opay';
  if (simulatedPaymentInfo) simulatedPaymentInfo.hidden = !isDemo;
  if (demoPaymentConfigPanel) demoPaymentConfigPanel.hidden = !isDemo;
  if (opayPaymentPanel) opayPaymentPanel.hidden = !isOpay;
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
 * Resolve a cart item's image path to a served URL.
 * Handles absolute URLs, data URIs, and project-relative paths such as
 * "/assets/images/Jollof Rice With Chicken.jpeg" (saved by the menu page).
 *
 * @param {string} rawImagePath - The raw image path from the cart item.
 * @returns {string} A resolved, encoded image URL.
 */
function resolveItemImagePath(rawImagePath) {
  if (!rawImagePath) return DEFAULT_ITEM_IMAGE;
  if (/^https?:\/\//i.test(rawImagePath) || rawImagePath.startsWith('data:')) {
    return rawImagePath;
  }

  let cleanPath = rawImagePath.trim().replace(/^(\.\.\/|\.)/, '').replace(/^\//, '');

  try {
    cleanPath = decodeURI(cleanPath);
  } catch (_decodeError) {
    // Keep original if decoding fails
  }

  if (cleanPath.startsWith('assets/images/')) {
    return `/${encodeURI(cleanPath)}`;
  }

  return `/assets/images/${encodeURI(cleanPath)}`;
}

/**
 * Render the order items card with a thumbnail, name, category, and
 * line total for every item in the cart.
 */
function renderOrderItems() {
  if (!orderItemsList) return;

  const cart = loadCart();

  if (orderItemsCount) {
    const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    orderItemsCount.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
  }

  if (cart.length === 0) {
    orderItemsList.innerHTML = '<p class="empty-state">Your cart is empty. Add items to continue.</p>';
    return;
  }

  orderItemsList.innerHTML = cart
    .map((item) => {
      const unitPrice = parsePrice(item.price);
      const quantity = item.quantity || 1;
      const lineTotal = unitPrice * quantity;
      const safeName = escapeHtml(item.name);
      const safeCategory = escapeHtml(item.category || 'Food');
      const safeImage = escapeHtml(resolveItemImagePath(item.image));

      return `
        <div class="order-item">
          <img class="order-item-image" src="${safeImage}" alt="${safeName}" loading="lazy" />
          <div class="order-item-details">
            <h4>${safeName}</h4>
            <p>${safeCategory}</p>
            <span class="order-item-qty">Qty ${quantity}</span>
          </div>
          <strong class="order-item-price">${formatPrice(lineTotal)}</strong>
        </div>
      `;
    })
    .join('');
}

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

  renderOrderItems();
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

/**
 * Navigate to the confirmation page with order details in the URL.
 *
 * @param {Object} params - Order details to pass via query string.
 */
function navigateToConfirmation(params) {
  window.location.href = buildConfirmationUrl(params);
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
    window.location.href = `/pages/auth/login.html?redirect=${encodeURIComponent(window.location.href)}`;
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

  const chosenMethod = getChosenPaymentMethod();
  const isOpayPayment = chosenMethod === 'opay';

  // Demo card details are only required for the simulated card flow
  if (!isOpayPayment && !isDemoCardComplete()) {
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
        paymentMethod: isOpayPayment ? 'opay' : 'simulated',
        idempotencyKey: getOrGenerateCheckoutKey(),
        paymentProofFileName: selectedProofFileName,
        bankTransferDetails: '',
      },
    });

    if (isOpayPayment) {
      await processOpayPayment(order, { subtotal, deliveryFee, discount, total, deliveryAddress });
    } else {
      await processDemoPayment(order, { subtotal, deliveryFee, discount, total, deliveryAddress });
    }
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

/* ──────────────────────────────────────────────
 * OPay Payment (manual transfer)
 * ────────────────────────────────────────────── */

/**
 * Fetch the merchant OPay account details from the server and fill the panel.
 */
async function loadOpayConfig() {
  if (!opayAccountNumberDisplay) return;
  try {
    const response = await fetch('/api/payments/opay/config');
    if (!response.ok) throw new Error('Unable to load OPay details.');
    opayAccountConfig = await response.json();

    if (opayBankNameDisplay) opayBankNameDisplay.textContent = opayAccountConfig.bankName || 'OPay';
    if (opayAccountNameDisplay) opayAccountNameDisplay.textContent = opayAccountConfig.accountName || 'Foodie.';
    if (opayAccountNumberDisplay) opayAccountNumberDisplay.textContent = opayAccountConfig.accountNumber || '—';

    const configured = Boolean(opayAccountConfig.isConfigured && opayAccountConfig.accountNumber);
    if (copyOpayNumberButton) copyOpayNumberButton.disabled = !configured;
    if (openOpayAppButton) openOpayAppButton.disabled = !configured;
    if (opayConfigWarning) opayConfigWarning.hidden = configured;
  } catch (_error) {
    if (opayConfigWarning) opayConfigWarning.hidden = false;
  }
}

/**
 * Initiate the OPay flow for a freshly created order: mark the order as
 * pending an OPay transfer on the server, then reveal the account details,
 * the copy button, and the OPay app deep link.
 *
 * @param {Object} order - The created order object.
 * @param {Object} pricing - Price breakdown for the confirmation URL.
 */
async function processOpayPayment(order, pricing) {
  placeOrderButton.disabled = true;
  placeOrderButton.textContent = 'Getting OPay details...';

  const opayResponse = await sendAuthenticatedRequest('/api/payments/opay/initiate', {
    method: 'POST',
    body: { orderId: order.orderId },
  });

  placeOrderButton.disabled = false;
  placeOrderButton.textContent = 'Place order';

  opayPendingOrder = order;
  opayPricing = pricing;

  opayInitiateResponse = opayResponse;

  // Fill in the live amount and account details
  if (opayAmountDisplay) opayAmountDisplay.textContent = formatPrice(opayResponse.amount);
  if (opayResponse.account && opayResponse.account.accountNumber && opayAccountNumberDisplay) {
    opayAccountNumberDisplay.textContent = opayResponse.account.accountNumber;
  }
  if (opayResponse.account && opayAccountBankNameDisplay) {
    opayAccountBankNameDisplay.textContent = opayResponse.account.bankName || 'OPay';
  }
  if (opayResponse.account && opayAccountNameDisplay) {
    opayAccountNameDisplay.textContent = opayResponse.account.accountName || 'Foodie.';
  }
  if (copyOpayNumberButton) copyOpayNumberButton.disabled = false;
  if (openOpayAppButton) openOpayAppButton.disabled = false;

  // Auto mode: verified by OPay webhook — poll status instead of trusting user confirmation.
  if (opayResponse.mode === 'auto') {
    if (opayPaidButton) opayPaidButton.hidden = true;
    if (opayStepsList) {
      opayStepsList.innerHTML = `
        <li>Transfer the exact total to the <strong>unique account number</strong> below.</li>
        <li>We detect your payment automatically — keep this page open.</li>
        <li>You'll be redirected as soon as OPay confirms the transfer.</li>
      `;
    }
    startOpayStatusPolling(order.orderId);
  } else {
    // Manual mode: user confirms after transferring
    if (opayPaidButton) opayPaidButton.hidden = false;
    if (opayStepsList) {
      opayStepsList.innerHTML = `
        <li>Copy the account number and transfer the exact total.</li>
        <li>Open the OPay app to complete the transfer.</li>
        <li>Come back and tap <strong>I have paid</strong>.</li>
      `;
    }
  }

  if (opayPaymentPanel) opayPaymentPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Poll the OPay payment status every 5 seconds (auto mode only).
 * The server cross-checks the OPay status API, so the order completes even
 * when the webhook cannot reach a localhost dev server.
 */
function startOpayStatusPolling(orderId) {
  stopOpayStatusPolling();

  opayPollTimer = window.setInterval(async () => {
    try {
      const response = await sendAuthenticatedRequest(`/api/payments/opay/status/${encodeURIComponent(orderId)}`);
      if (response.paymentStatus === 'Successful') {
        stopOpayStatusPolling();
        finishOpayAutoPayment();
      } else if (response.paymentStatus === 'Declined') {
        stopOpayStatusPolling();
        alert('The OPay transfer was declined or expired. Please try again with a new order.');
      }
    } catch (_pollError) {
      // Transient network/server errors — keep polling
    }
  }, 5000);
}

function stopOpayStatusPolling() {
  if (opayPollTimer) {
    window.clearInterval(opayPollTimer);
    opayPollTimer = null;
  }
}

/** Complete the checkout after auto-verification succeeds. */
function finishOpayAutoPayment() {
  saveCart([]);
  window.sessionStorage.removeItem('foodieCheckoutIdempotencyKey');

  navigateToConfirmation({
    ...opayPricing,
    payment: 'success',
    orderId: opayPendingOrder ? opayPendingOrder.orderId : '',
    reference: opayInitiateResponse ? opayInitiateResponse.reference : '',
  });
}

window.addEventListener('beforeunload', stopOpayStatusPolling);

/**
 * Copy the merchant OPay account number to the clipboard.
 * Uses the async Clipboard API with a hidden-textarea fallback.
 */
async function copyOpayAccountNumber() {
  const accountNumber = opayAccountNumberDisplay ? opayAccountNumberDisplay.textContent.trim() : '';
  if (!accountNumber || accountNumber === '—') {
    alert('Place the order first to get the OPay account number.');
    return;
  }

  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(accountNumber);
      copied = true;
    }
  } catch (_clipboardError) {
    copied = false;
  }

  if (!copied) {
    // Fallback for non-secure contexts (e.g. http://localhost on some browsers)
    const scratch = document.createElement('textarea');
    scratch.value = accountNumber;
    scratch.setAttribute('readonly', '');
    scratch.style.position = 'fixed';
    scratch.style.opacity = '0';
    document.body.appendChild(scratch);
    scratch.select();
    try {
      copied = document.execCommand('copy');
    } catch (_fallbackError) {
      copied = false;
    }
    document.body.removeChild(scratch);
  }

  if (copied) {
    const originalText = copyOpayNumberButton.textContent;
    copyOpayNumberButton.textContent = '✅ Copied!';
    setTimeout(() => {
      copyOpayNumberButton.textContent = originalText;
    }, 1800);
  } else {
    window.prompt('Copy the OPay account number:', accountNumber);
  }
}

/**
 * Open the OPay app via an Android intent deep link.
 * Falls back to the Play Store listing when the app is not installed.
 */
function openOpayApp() {
  const packageName = 'team.opay.pay';
  const intentUrl = `intent://launch/#Intent;scheme=opay;package=${packageName};S.browser_fallback_url=${encodeURIComponent(`https://play.google.com/store/apps/details?id=${packageName}`)};end`;

  // Android browsers handle the intent (opening the app or the fallback URL).
  window.location.href = intentUrl;

  // On non-Android platforms the navigation is usually ignored — offer the store page.
  setTimeout(() => {
    if (!document.hidden && !/android/i.test(navigator.userAgent)) {
      window.open(`https://play.google.com/store/apps/details?id=${packageName}`, '_blank', 'noopener');
    }
  }, 1200);
}

/**
 * Confirm the OPay transfer after the user says they have paid.
 * Marks the order Successful on the server, clears the cart, and
 * navigates to the confirmation page.
 */
async function confirmOpayPayment() {
  if (!opayPendingOrder) {
    alert('Place the order first, then transfer and confirm.');
    return;
  }

  // Auto mode never shows this button; the server rejects it as defense in depth.
  if (opayInitiateResponse && opayInitiateResponse.mode === 'auto') {
    return;
  }

  if (!window.confirm('Did you complete the transfer of the exact total to the OPay account shown?')) {
    return;
  }

  opayPaidButton.disabled = true;
  opayPaidButton.textContent = 'Confirming payment...';

  try {
    const confirmResponse = await sendAuthenticatedRequest('/api/payments/opay/confirm', {
      method: 'POST',
      body: { orderId: opayPendingOrder.orderId },
    });

    saveCart([]);
    window.sessionStorage.removeItem('foodieCheckoutIdempotencyKey');

    navigateToConfirmation({
      ...opayPricing,
      payment: 'success',
      orderId: opayPendingOrder.orderId,
      reference: confirmResponse.reference,
    });
  } catch (error) {
    opayPaidButton.disabled = false;
    opayPaidButton.textContent = 'I have paid — confirm payment';
    alert(error.message || 'Unable to confirm the OPay payment. Please try again.');
  }
}

/* ──────────────────────────────────────────────
 * Event Listeners
 * ────────────────────────────────────────────── */

// Refresh summary when payment method changes
paymentMethodRadios.forEach((radio) => {
  radio.addEventListener('change', refreshOrderSummary);
});

// Re-render items if the cart changes in another tab
window.addEventListener('storage', renderOrderItems);

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

// OPay buttons
if (copyOpayNumberButton) {
  copyOpayNumberButton.addEventListener('click', copyOpayAccountNumber);
}
if (openOpayAppButton) {
  openOpayAppButton.addEventListener('click', openOpayApp);
}
if (opayPaidButton) {
  opayPaidButton.addEventListener('click', confirmOpayPayment);
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
loadOpayConfig();
