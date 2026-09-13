/**
 * ─── Onboarding Page Logic ───
 *
 * Handles username setup after registration:
 *   - Validates username availability
 *   - Updates user profile via API
 *   - Redirects to home after completion
 *
 * Depends on: nothing (self-contained)
 */

/* ──────────────────────────────────────────────
 * DOM References
 * ────────────────────────────────────────────── */

const onboardingForm = document.getElementById('onboardingForm');
const usernameInput = document.getElementById('usernameInput');
const submitButton = document.getElementById('submitOnboarding');
const feedbackMessage = document.getElementById('onboardingFeedback');

/* ──────────────────────────────────────────────
 * Session Helpers
 * ────────────────────────────────────────────── */

/** Retrieve the JWT token from localStorage. */
function getUserToken() {
  return window.localStorage.getItem('foodieToken');
}

/** Retrieve the current user object from localStorage. */
function getUser() {
  return JSON.parse(window.localStorage.getItem('foodieUser') || 'null');
}

/** Update the stored user object. */
function updateStoredUser(user) {
  window.localStorage.setItem('foodieUser', JSON.stringify(user));
}

/* ──────────────────────────────────────────────
 * Feedback Display
 * ────────────────────────────────────────────── */

/**
 * Show a feedback message below the form.
 *
 * @param {'success'|'error'} messageType - Controls the styling.
 * @param {string} messageText - The message to display.
 */
function displayFeedback(messageType, messageText) {
  feedbackMessage.textContent = messageText;
  feedbackMessage.className = `auth-feedback ${messageType}`;
}

/* ──────────────────────────────────────────────
 * Validation
 * ────────────────────────────────────────────── */

/**
 * Check whether a username is valid.
 *
 * @param {string} username - The username to validate.
 * @returns {boolean}
 */
function isValidUsername(username) {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

/* ──────────────────────────────────────────────
 * API Communication
 * ────────────────────────────────────────────── */

/**
 * Update the user's profile with the chosen username.
 *
 * @param {string} username - The chosen username.
 * @returns {Promise<Object>} The updated user object.
 * @throws {Error} If the server returns an error.
 */
async function updateProfile(username) {
  const token = getUserToken();
  const response = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: username })
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData?.message || 'Profile update failed.');
  }

  return responseData;
}

/* ──────────────────────────────────────────────
 * Form Submission
 * ────────────────────────────────────────────── */

onboardingForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();

  // Validate username format
  if (!isValidUsername(username)) {
    return displayFeedback('error', 'Username must be at least 3 characters and contain only letters, numbers, and underscores.');
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Saving...';

  try {
    const updatedUser = await updateProfile(username);
    updateStoredUser(updatedUser);

    displayFeedback('success', 'Profile completed! Redirecting...');

    // Redirect to home after a brief delay
    setTimeout(() => {
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/pages/home/index.html';
      window.location.href = redirect;
    }, 700);
  } catch (error) {
    displayFeedback('error', error.message);
    submitButton.disabled = false;
    submitButton.textContent = 'Complete profile';
  }
});

/* ──────────────────────────────────────────────
 * Initialization
 * ────────────────────────────────────────────── */

// Redirect to auth if not logged in
const user = getUser();
const token = getUserToken();
if (!user || !token) {
  window.location.href = '/pages/auth/login.html';
}

// Pre-fill with generated username if available
if (user && user.username) {
  usernameInput.value = user.username;
}
