# Foodie. Nigerian Food Delivery Web App

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Pages and Functionality](#pages-and-functionality)
5. [Tech Stack](#tech-stack)
6. [Design System](#design-system)
7. [Getting Started](#getting-started)
8. [Form Validation Rules](#form-validation-rules)
9. [Responsive Behaviour](#responsive-behaviour)
10. [Known Limitations and Todos](#known-limitations-and-todos)

## Overview

Foodie. is a Nigerian food-delivery web application for browsing restaurants, viewing menus, previewing dishes, managing a cart, checking out, and placing orders. The user interface is implemented as a collection of static, multi-page HTML experiences. A Node.js and Express backend serves those files and provides authentication, restaurant, order, payment, and admin APIs.

The catalog currently includes:

- Chicken Republic
- Mama Put Restaurant
- Pizza Hub
- Burger King
- Buka Hut

Restaurant pages are opened with a query parameter such as:

```text
/resturant-page/index.html?restaurant=pizza-hub
```

The frontend first requests `/api/restaurants`. If the API is unavailable, it uses the restaurant catalog in `frontend/resturant-page/script.js` as a local fallback.

## Features

### Customer features

- Browse restaurant cards and search restaurants by name or visible text.
- Open a restaurant detail page using a restaurant slug.
- Browse complete restaurant menus with food, snacks, sides, desserts, and drinks.
- Filter menus by category and mobile price range.
- Open a dish preview page with image, description, price, and category information.
- Add dishes to a persistent browser cart.
- View cart contents in a modal or on the dedicated cart page.
- Increase or decrease item quantities and remove items.
- Apply the built-in 10% discount calculation.
- Calculate a fixed ₦500 delivery charge.
- Continue checkout as a signed-in customer.
- Choose cash, Paystack, card, or bank-transfer payment options where configured.
- View an order confirmation page after a successful non-hosted payment flow.
- Switch between light and dark themes.
- View account information and sign out through the account experience.

### Backend features

- User registration and login with JWT authentication.
- Password hashing through `bcryptjs`.
- Email verification and resend-verification endpoints.
- Password-reset token endpoints.
- Restaurant catalog retrieval with local fallback data.
- Authenticated order creation, listing, and lookup.
- Admin-only restaurant, order, and user management endpoints.
- Paystack payment initialization and verification.
- Static serving of the frontend from the backend server.
- CORS and request logging through Express middleware.

## Project Structure

```text
Food-Delivery-Web-App/
├── package.json                 # Root start and development commands
├── package-lock.json
├── README.md
├── backend/
│   ├── package.json             # Backend scripts and dependencies
│   ├── README.md                # Backend-specific notes
│   ├── .env.example             # Environment variable template
│   ├── data/                    # Local application data directory
│   └── src/
│       ├── index.js             # Express app and server startup
│       ├── config/
│       │   └── db.js            # Sequelize database configuration
│       ├── middleware/
│       │   ├── auth.js           # JWT protection and admin checks
│       │   └── errorHandler.js   # API error handling
│       ├── models/
│       │   ├── Order.js
│       │   ├── Restaurant.js
│       │   └── User.js
│       ├── routes/
│       │   ├── admin.js
│       │   ├── auth.js
│       │   ├── orders.js
│       │   ├── payments.js
│       │   └── restaurants.js
│       └── utils/
│           └── seed.js           # Sample users and restaurant data
└── frontend/
    ├── index.html                # Home page
    ├── script.js                 # Home search, filters, and cart actions
    ├── style.css                 # Shared visual styles and theme variables
    ├── theme.js                  # Light/dark theme persistence
    ├── auth.html                 # Sign-in and sign-up page
    ├── auth.js
    ├── auth.css
    ├── auth-state.js             # Header account state
    ├── auth-toast.css
    ├── account.html              # Signed-in account page
    ├── cart-state.js              # Shared cart modal and cart state
    ├── cart-page/
    │   ├── cart.html
    │   ├── cart.js
    │   └── style.css
    ├── checkout-page/
    │   ├── checkout.html
    │   ├── checkout.js
    │   ├── confirmation.html
    │   ├── paystack-callback.html
    │   └── style.css
    ├── preview-page/
    │   ├── index.html
    │   ├── script.js
    │   └── style.css
    ├── resturant-page/           # Existing project spelling
    │   ├── index.html
    │   ├── script.js
    │   └── style.css
    └── images/                   # Local food and interface assets
```

## Pages and Functionality

### Home page: `frontend/index.html`

The home page presents the Foodie. brand, a hero order action, restaurant listings, category chips, restaurant search, offers, and shared navigation. Restaurant cards link to the restaurant detail page using a `restaurant` query parameter. Menu cards on this page can add items to the cart.

### Authentication: `frontend/auth.html`

The authentication page provides sign-in and sign-up modes in one form.

- Sign-in sends `username` and `password` to `POST /api/auth/login`.
- Sign-up sends `username`, `email`, and `password` to `POST /api/auth/register`.
- Successful authentication stores `foodieUser` and `foodieToken` in `localStorage`.
- A `redirect` query parameter returns the user to the page that required authentication.

### Account: `frontend/account.html`

The account page displays the current signed-in user and provides account-related navigation and sign-out behavior. The authentication token and user record are read from browser storage.

### Restaurant detail: `frontend/resturant-page/index.html`

The restaurant page reads the restaurant slug from the URL, loads the matching restaurant, renders its hero information, builds category links dynamically, and displays the complete menu. Menu cards lead to the preview page. Mobile controls provide category and price filtering.

Supported restaurant slugs are:

```text
chicken-republic
mama-put-restaurant
pizza-hub
burger-king
buka-hut
```

### Dish preview: `frontend/preview-page/index.html`

The preview page receives dish information through URL parameters and session storage. It presents the selected image, name, description, category, and price, and allows the customer to add the item to the cart before continuing.

### Cart: `frontend/cart-page/cart.html`

The dedicated cart page reads `foodieCart` from `localStorage`, displays quantities and totals, and allows the user to remove items or change quantities. The shared cart state also supports a cart modal from the header on other pages.

Cart calculations currently use:

- Subtotal: sum of item price multiplied by quantity.
- Delivery fee: ₦500.
- Discount: 10% of the subtotal.
- Total: subtotal plus delivery minus discount.

### Checkout: `frontend/checkout-page/checkout.html`

Checkout requires an authenticated user before an order can be created. It displays the order summary and payment choices, creates an order through `POST /api/orders`, and then follows the selected payment flow.

- Cash: creates the order and opens confirmation.
- Paystack: initializes a Paystack transaction and uses inline or hosted checkout when configured.
- Bank transfer: creates the order, displays transfer details, and currently redirects to the configured external payment URL.
- Card: is available as a selectable checkout option but requires the relevant backend/payment integration to be completed.

### Confirmation: `frontend/checkout-page/confirmation.html`

The confirmation page displays the order result using checkout query parameters such as subtotal, delivery, discount, total, payment method, and order ID.

### Paystack callback: `frontend/checkout-page/paystack-callback.html`

This page is the hosted Paystack return target. It reads the payment reference, requests verification, and routes the customer to the confirmation experience when verification succeeds.

## Tech Stack

### Frontend

- HTML5 multi-page application.
- CSS3 with custom properties, gradients, transitions, responsive media queries, and light/dark themes.
- Vanilla JavaScript using browser APIs including `fetch`, `localStorage`, `sessionStorage`, `URLSearchParams`, and DOM event listeners.
- Google Fonts: Inter.
- Remote food imagery from Unsplash in selected catalog entries.

### Backend

- Node.js.
- Express 4.
- Sequelize 6.
- SQLite through the `sqlite3` driver in the current database configuration.
- JWT for access tokens.
- `bcryptjs` for password hashing.
- `node-fetch` for Paystack API requests.
- `nodemailer` for optional verification and reset emails.
- `morgan` for HTTP request logging.
- `cors` for cross-origin requests.
- `nodemon` for development restarts.

### Main API endpoints

Public endpoints:

```text
GET  /api/health
GET  /api/restaurants
GET  /api/restaurants/:slug
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify-email/:token
POST /api/auth/resend-verification
POST /api/auth/forgot-password
GET  /api/payments/config
```

Authenticated customer endpoints:

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:orderId
POST /api/payments/paystack
POST /api/payments/verify
```

Authenticated admin endpoints:

```text
GET    /api/admin/restaurants
POST   /api/admin/restaurants
DELETE /api/admin/restaurants/:id
GET    /api/admin/orders
PUT    /api/admin/orders/:orderId/status
GET    /api/admin/users
PUT    /api/admin/users/:id/role
```

Protected requests use:

```text
Authorization: Bearer <jwt-token>
```

## Design System

### Visual direction

Foodie. uses a warm, food-oriented visual language with orange as the primary action color. Large food photography, soft cream surfaces, rounded content panels, pill-shaped controls, and spacious layouts are used to make browsing feel approachable and appetizing.

### Color tokens

The shared stylesheet defines light and dark theme variables including:

```css
--bg
--panel
--surface
--surface-soft
--surface-muted
--text
--muted
--accent
--accent-dark
--accent-soft
--border
--shadow
```

The light theme uses cream, white, brown, and orange tones. The dark theme uses deep charcoal surfaces with warm orange highlights. The selected theme is persisted in `localStorage` under `foodieTheme`.

### Typography

The current interface uses Inter in regular, medium, semibold, bold, and extra-bold weights. Headings use stronger weight and tighter visual hierarchy, while metadata and helper text use the muted color token.

### Components

Common interface patterns include:

- Top navigation bars with brand, location, theme, cart, and account controls.
- Hero sections with food imagery and restaurant metadata.
- Restaurant cards and menu cards.
- Category chips and dynamically generated category links.
- Pill-shaped status, rating, delivery, and cart controls.
- Modal cart panel with quantity controls.
- Checkout summary panels.
- Toast and inline feedback messages.
- Focus states and keyboard-accessible menu image interactions.

### Spacing and shape language

The UI uses generous section spacing, compact metadata groups, rounded cards and panels, and circular or pill controls for quick actions. Shadows are soft and used mainly to separate elevated panels from the warm page backgrounds.

## Getting Started

### Prerequisites

Install the following before starting:

- Node.js 18 or newer recommended.
- npm.
- A local SQLite-compatible environment. The current backend database configuration uses Sequelize with SQLite.
- Paystack credentials only if testing online payment.
- SMTP credentials only if testing email delivery.

### Install dependencies

From the project root:

```bash
npm install
cd backend
npm install
```

### Configure the backend

Create an environment file from the supplied template:

```bash
cd backend
cp .env.example .env
```

Important variables include:

```env
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key
PAYSTACK_CALLBACK_URL=http://localhost:5000/checkout-page/paystack-callback.html
```

SMTP variables are optional and include `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.

### Seed sample data

From the `backend` directory:

```bash
npm run seed
```

The seed script creates sample restaurants and an admin user. The development admin credentials created by the seed script are:

```text
Email: admin@foodie.com
Password: password123
```

Change these credentials before using the application outside local development.

### Start the application

From the project root:

```bash
npm start
```

Or from the `backend` directory:

```bash
npm start
```

For automatic restarts during development:

```bash
npm run dev
```

Open:

```text
http://localhost:5000
```

The backend serves the frontend files directly. If port 5000 is busy, the server attempts the next available port.

### Frontend-only development

The frontend pages are static files and can be opened with a static file server. However, authentication, orders, restaurant API loading, and payments require the Express backend. The recommended workflow is therefore to use the backend server for the complete experience.

## Form Validation Rules

### Sign-in

The sign-in form requires:

- A non-empty username.
- A non-empty password.
- A password with at least 6 characters.

The client displays an inline error before sending invalid input. The server also requires both `username` and `password` and returns an error for invalid credentials.

### Sign-up

The sign-up form requires:

- A non-empty username.
- A non-empty email address.
- A password with at least 6 characters.
- An email matching the client pattern `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/`.

The server lowercases email addresses and rejects duplicate email addresses or usernames.

### Checkout and orders

- The cart must contain at least one item.
- The user must have a valid stored token and user record.
- An order request must contain a non-empty array of items.
- Paystack initialization requires `orderId`, `amount`, and `email`.
- Payment verification requires a payment `reference`.
- Bank-transfer proof currently stores the selected filename; the file itself is not uploaded to the backend.

### Admin role updates

The API accepts only these roles:

```text
user
admin
manager
driver
```

## Responsive Behaviour

The layout is designed for desktop, tablet, and mobile widths.

- Desktop layouts use multi-column restaurant and menu arrangements.
- Restaurant detail pages place restaurant information in a sidebar beside the menu.
- At widths of 768px and below, the mobile filter bar becomes visible and provides category and price selectors.
- Navigation, hero statistics, menu cards, cart controls, and checkout panels wrap or stack as the viewport narrows.
- Images use responsive containers and lazy loading on restaurant menu cards.
- The cart modal uses a dedicated panel and backdrop so it remains usable on small screens.
- Theme, cart, and authentication state persist across page navigation through browser storage.
- Buttons and important controls retain stable dimensions so text and icons do not shift surrounding content.

The restaurant page dynamically builds category links from the selected restaurant’s menu. This means category counts and available filters change according to the restaurant being viewed.

## Known Limitations and Todos

### Known limitations

- The project has three copies of restaurant catalog data: the frontend local fallback, the API fallback, and the seed data. They must be kept synchronized when menus change.
- The backend documentation and `.env.example` still refer to MongoDB through `MONGO_URI`, while the current implementation uses Sequelize with SQLite. The configuration and documentation should be consolidated around one database choice.
- The frontend depends on several remote Unsplash images. Offline use or image-host availability can affect selected menu cards.
- The backend startup can fail in some environments when the SQLite native dependency is incompatible with the installed Node version.
- The checkout card option is present in the UI but does not yet have a complete card payment implementation.
- Bank-transfer checkout redirects to an external Opay URL and does not verify a bank transfer automatically.
- Payment proof captures a filename only; no receipt file is uploaded or stored.
- The API accepts client-calculated subtotal, discount, delivery fee, and total values. Production code should recalculate totals on the server from trusted menu prices.
- Some older menu entries use inconsistent category names, although current restaurant fallback menus provide food and drink coverage.
- There are no automated frontend, API, integration, or end-to-end tests in the repository.
- The seed script deletes existing users and restaurants before recreating sample data. Do not run it against production data.
- Email verification and password reset depend on SMTP configuration. Without SMTP, development responses may expose links in API responses or logs.

### Todos

- Choose and document one production database strategy, then remove stale MongoDB references if SQLite remains the intended database.
- Extract the restaurant catalog into one shared data source to eliminate frontend, API fallback, and seed duplication.
- Add automated tests for authentication, menu loading, cart calculations, checkout, payments, and admin authorization.
- Add server-side price validation and order total calculation.
- Implement real card payment support or remove the incomplete card option.
- Implement secure bank-transfer receipt upload and verification.
- Add restaurant and menu administration screens for the existing admin API.
- Add order history and order-status tracking to the account page.
- Add server-side pagination and search for larger restaurant catalogs.
- Improve accessibility audits for focus management, modal keyboard handling, image alt text, and form error announcements.
- Add a production deployment guide, security checklist, and secret-management instructions.
- Replace placeholder or reused food images with verified restaurant-specific assets.
