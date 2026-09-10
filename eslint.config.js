const js = require('@eslint/js');
const globals = require('globals');

/** Functions defined in frontend/utils.js and exposed on window.
 *  These are declared as globals so other frontend files can reference them
 *  without redeclaring — they come from utils.js loaded via a <script> tag. */
const UTILS_GLOBALS = {
  escapeHtml: 'readonly',
  formatPrice: 'readonly',
  parsePrice: 'readonly',
  loadCart: 'readonly',
  saveCart: 'readonly',
  ITEM_DISCOUNT_RATE: 'readonly',
  DEFAULT_ITEM_IMAGE: 'readonly',
};

module.exports = [
  // ─── Global ignores ───
  {
    ignores: [
      'node_modules/**',
      'backend/node_modules/**',
      'backend/data/**',
      '*.sqlite',
      'a.out',
      'hello',
      'hello.cpp',
      '*.png',
      '*.jpeg',
      '*.jpg',
      '*.gif',
      '*.svg',
    ],
  },

  // ─── Base recommended rules ───
  js.configs.recommended,

  // ─── Root ESLint config file (Node.js / CommonJS) ───
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },

  // ─── Backend: Node.js / CommonJS ───
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },

  // ─── Frontend utils.js (defines globals, no-redeclare allowed) ───
  {
    files: ['frontend/utils.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': 'off', // Used by other files via window
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-redeclare': 'off', // Functions are declared locally AND exposed as globals
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },

  // ─── Frontend: Browser globals + utils.js shared functions ───
  {
    files: ['frontend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...UTILS_GLOBALS,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-alert': 'off',
    },
  },
];
