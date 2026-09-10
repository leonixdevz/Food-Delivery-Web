/**
 * ─── Authentication Page Logic ───
 *
 * Handles sign-in and sign-up on a single form:
 *   - Toggling between sign-in and sign-up modes
 *   - Form validation (username, email, password)
 *   - API calls to /api/auth/register and /api/auth/login
 *   - Storing credentials in localStorage
 *   - Redirecting after successful authentication
 *
 * Depends on: nothing (self-contained)
 */

/* ──────────────────────────────────────────────
 * DOM References
 * ────────────────────────────────────────────── */

const signInTabButton = document.getElementById('signInTab');
const signUpTabButton = document.getElementById('signUpTab');
const usernameFieldGroup = document.getElementById('nameGroup');
const authForm = document.getElementById('authForm');
const authHelperNote = document.getElementById('authNote');
const authFeedbackMessage = document.getElementById('authFeedback');

/* ──────────────────────────────────────────────
 * Configuration
 * ────────────────────────────────────────────── */

/** The page to redirect to after successful authentication. */
const redirectDestination = new URLSearchParams(window.location.search).get('redirect') || 'index.html';

/** The current authentication mode: 'signin' or 'signup'. */
let currentAuthMode = 'signin';

/* ──────────────────────────────────────────────
 * Form Mode Toggling
 * ────────────────────────────────────────────── */

/**
 * Refresh the form layout to match the current auth mode.
 * Shows/hides the username and email fields, updates button text,
 * and clears any previous feedback messages.
 */
function refreshAuthFormLayout() {
  const isSignUp = currentAuthMode === 'signup';

  signInTabButton.classList.toggle('active', !isSignUp);
  signUpTabButton.classList.toggle('active', isSignUp);
  usernameFieldGroup.hidden = !isSignUp;
  document.getElementById('emailGroup').hidden = !isSignUp;

  authHelperNote.textContent = isSignUp
    ? 'Already have an account? Sign in to continue.'
    : "Don\u2019t have an account yet? Create one now.";
  document.getElementById('submitAuth').textContent = isSignUp ? 'Create account' : 'Sign in';

  authFeedbackMessage.textContent = '';
  authFeedbackMessage.className = 'auth-feedback';
}

signInTabButton.addEventListener('click', () => {
  currentAuthMode = 'signin';
  refreshAuthFormLayout();
});

signUpTabButton.addEventListener('click', () => {
  currentAuthMode = 'signup';
  refreshAuthFormLayout();
});

/* ──────────────────────────────────────────────
 * Feedback Display
 * ────────────────────────────────────────────── */

/**
 * Show a feedback message below the form.
 *
 * @param {'success'|'error'} messageType - Controls the styling.
 * @param {string} messageText - The message to display.
 */
function displayAuthFeedback(messageType, messageText) {
  authFeedbackMessage.textContent = messageText;
  authFeedbackMessage.className = `auth-feedback ${messageType}`;
}

/* ──────────────────────────────────────────────
 * Validation
 * ────────────────────────────────────────────── */

/**
 * Check whether an email address has a valid basic format.
 *
 * @param {string} email - The email to validate.
 * @returns {boolean}
 */
function isValidEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ──────────────────────────────────────────────
 * API Communication
 * ────────────────────────────────────────────── */

/**
 * Send a sign-in or sign-up request to the authentication API.
 *
 * @param {'register'|'login'} endpoint - The API endpoint.
 * @param {Object} payload - The request body (username, password, email).
 * @returns {Promise<Object>} The parsed response (user + token).
 * @throws {Error} If the server returns an error.
 */
async function submitAuthCredentials(endpoint, payload) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (_parseError) {
    responseData = { message: responseText };
  }

  if (!response.ok) {
    throw new Error(responseData?.message || 'Authentication failed.');
  }

  return responseData;
}

/* ──────────────────────────────────────────────
 * Form Submission
 * ────────────────────────────────────────────── */

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const emailInputElement = document.getElementById('authEmail');
  const email = emailInputElement ? emailInputElement.value.trim() : '';

  // Validate required fields
  if (!username || !password || (currentAuthMode === 'signup' && !email)) {
    return displayAuthFeedback('error', 'Please complete all required fields.');
  }

  if (password.length < 6) {
    return displayAuthFeedback('error', 'Password must be at least 6 characters.');
  }

  try {
    const requestPayload = { username, password };
    if (currentAuthMode === 'signup') {
      requestPayload.email = email.toLowerCase();
    }

    const apiEndpoint = currentAuthMode === 'signup' ? 'register' : 'login';
    const authResponse = await submitAuthCredentials(apiEndpoint, requestPayload);

    // Store user data and JWT token for authenticated requests
    window.localStorage.setItem('foodieUser', JSON.stringify(authResponse.user));
    window.localStorage.setItem('foodieToken', authResponse.token);

    const successMessage = currentAuthMode === 'signup'
      ? 'Account created successfully. Redirecting...'
      : 'Signed in successfully. Redirecting...';
    displayAuthFeedback('success', successMessage);

    // Redirect after a brief delay so the user sees the success message
    setTimeout(() => {
      window.location.href = redirectDestination;
    }, 700);
  } catch (error) {
    displayAuthFeedback('error', error.message);
  }
});

/* ──────────────────────────────────────────────
 * Initialization
 * ────────────────────────────────────────────── */

refreshAuthFormLayout();
