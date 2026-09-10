function updateThemeButton() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const currentTheme = document.documentElement.dataset.theme || 'light';
  toggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  toggle.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('foodieTheme', theme);
  updateThemeButton();
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme || 'light';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function initMobileNav() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || topbar.querySelector('.mobile-nav-toggle')) return;

  const nav = topbar.querySelector('.nav-links');
  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.className = 'mobile-nav-toggle';
  toggleButton.setAttribute('aria-label', 'Open navigation');
  toggleButton.setAttribute('aria-expanded', 'false');
  toggleButton.innerHTML = '<span></span><span></span><span></span>';
  topbar.insertBefore(toggleButton, topbar.firstChild);

  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  document.body.appendChild(backdrop);

  const panel = document.createElement('aside');
  panel.className = 'mobile-nav-panel';
  panel.setAttribute('aria-label', 'Mobile navigation');
  panel.innerHTML = `
    <div class="mobile-nav-header">
      <div class="brand-wrap">
        <div class="brand-badge">🍽️</div>
        <div>
          <h1>Foodie.</h1>
          <p>Menu</p>
        </div>
      </div>
      <button class="mobile-nav-close" type="button" aria-label="Close navigation">✕</button>
    </div>
    <nav class="mobile-nav-links"></nav>
  `;

  const navLinks = panel.querySelector('.mobile-nav-links');
  const fallbackLinks = [
    { label: 'Home', href: '../index.html' },
    { label: 'Restaurants', href: '../resturant-page/index.html' },
    { label: 'Offers', href: '../index.html#offers' },
    { label: 'Account', href: '../auth.html' },
  ];

  const sourceLinks = nav
    ? Array.from(nav.querySelectorAll('a'))
    : fallbackLinks.map(({ label, href }) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        return link;
      });

  sourceLinks.forEach((link) => {
    const cloned = link.cloneNode(true);
    cloned.classList.add('mobile-nav-item');
    navLinks.appendChild(cloned);
  });

  document.body.appendChild(panel);

  const closeButton = panel.querySelector('.mobile-nav-close');

  function setMobileNavOpen(isOpen) {
    panel.classList.toggle('is-open', isOpen);
    backdrop.classList.toggle('is-visible', isOpen);
    document.body.classList.toggle('mobile-nav-open', isOpen);
    toggleButton.setAttribute('aria-expanded', String(isOpen));
  }

  toggleButton.addEventListener('click', () => {
    setMobileNavOpen(!panel.classList.contains('is-open'));
  });

  closeButton.addEventListener('click', () => setMobileNavOpen(false));
  backdrop.addEventListener('click', () => setMobileNavOpen(false));
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileNavOpen(false));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', toggleTheme);
    updateThemeButton();
  }
  initMobileNav();
});
