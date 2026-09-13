/**
 * ─── Authentication Guard ───
 *
 * Protects pages that require authentication.
 * Redirects to login if user is not signed in.
 * Call checkAuth() at the start of protected pages.
 */

/**
 * Check if user is authenticated.
 * Redirects to login page if not authenticated.
 *
 * @param {string} [loginPath='../../auth/login.html'] - Path to login page
 * @returns {Object|null} The authenticated user object, or null if redirecting
 */
function checkAuth(loginPath = '/pages/auth/login.html') {
  const user = JSON.parse(window.localStorage.getItem('foodieUser') || 'null');
  const token = window.localStorage.getItem('foodieToken');

  if (!user || !token) {
    // Not authenticated - redirect to login with return URL
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${loginPath}?redirect=${returnUrl}`;
    return null;
  }

  return user;
}

/**
 * Get the current authenticated user without redirecting.
 *
 * @returns {Object|null} The user object or null if not authenticated
 */
function getAuthUser() {
  return JSON.parse(window.localStorage.getItem('foodieUser') || 'null');
}

/**
 * Get the current auth token.
 *
 * @returns {string|null} The JWT token or null if not authenticated
 */
function getAuthToken() {
  return window.localStorage.getItem('foodieToken');
}

/**
 * Check if user is authenticated (boolean check).
 *
 * @returns {boolean} True if authenticated, false otherwise
 */
function isAuthenticated() {
  const user = getAuthUser();
  const token = getAuthToken();
  return !!(user && token);
}
