# Foodie. Nigerian Food Delivery Web App

## 1. Project Title
Foodie. – A Nigerian Food Delivery Web Application

## 2. Introduction
Foodie. is a web-based food ordering and delivery application designed to provide users with an easy and engaging way to browse restaurants, view menus, add meals to a cart, and place orders online. The system was developed to simulate a real food delivery platform while keeping the project manageable and suitable for an OND final-year project.

The project focuses on delivering an end-to-end experience that includes browsing, authentication, cart handling, order placement, and a simulated payment flow. It uses a Node.js backend with SQLite database storage and a static frontend built with HTML, CSS, and JavaScript.

## 3. Problem Statement
In many local food businesses, customers often struggle with fragmented ordering processes, poor online access, and lack of digital order tracking. Many small food services still rely on manual ordering methods, which can be slow and inefficient.

This project addresses that problem by creating a digital platform that allows customers to:
- browse restaurant menus,
- select food items,
- place orders online,
- complete checkout securely through a simulated payment method,
- and receive confirmation of their order.

## 4. Aim and Objectives
### Aim
To design and implement a working food delivery web application that supports online ordering and order processing for a Nigerian food business.

### Objectives
1. To design a user-friendly interface for ordering food online.
2. To implement customer authentication and account management.
3. To manage a shopping cart and order totals.
4. To create a backend API for restaurants, orders, and payments.
5. To store data in a local database using SQLite.
6. To simulate a payment flow for academic demonstration.
7. To ensure the application is easy to run and present for project evaluation.

## 5. Scope of the Project
The system covers the following core modules:
- Customer registration and login
- Restaurant listing and menu display
- Cart management
- Delivery address collection
- Checkout process
- Order generation and storage
- Demo payment simulation
- Admin order view and status management

The project does not include live third-party payment integration such as Paystack production checkout, real rider tracking, or real-time courier logistics. Instead, it uses a demo payment process suitable for academic demonstration.

## 6. Methodology
The project was implemented using a modular approach:

### Frontend
The frontend was built using HTML, CSS, and JavaScript for a multi-page web application. It includes pages for:
- homepage,
- restaurant listing,
- menu preview,
- account and authentication,
- cart,
- checkout,
- confirmation.

### Backend
The backend was built using Node.js and Express. It exposes APIs for:
- user authentication,
- restaurant data access,
- order creation and retrieval,
- demo payment processing,
- admin operations.

### Database
SQLite was used to persist user and order data locally, making the project easy to run without external database hosting.

## 7. System Features
### Customer Features
- Search and browse restaurants
- View menu items and prices
- Add items to cart
- Increase or reduce quantity
- Remove items from cart
- View subtotal, discount, and delivery fee
- Enter delivery information
- Proceed to checkout
- Complete a simulated payment
- View order confirmation

### Admin Features
- View all orders
- Update order status
- View all registered users
- Manage restaurant records

## 8. Project Architecture
The application follows a simple three-layer architecture:

1. Presentation Layer
   - HTML/CSS/JavaScript frontend pages
2. Application Layer
   - Express server and routes
3. Data Layer
   - SQLite database and Sequelize models

This architecture makes the project easy to understand and present during viva or project defense.

## 9. Technologies Used
- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- Sequelize
- SQLite
- JWT (JSON Web Token)
- bcryptjs
- npm

## 10. Implementation Summary
The application begins when a user opens the homepage and browses restaurants. A customer can sign in or create an account, select meals, add them to a cart, and proceed to checkout.

On checkout, the system:
1. validates the user session,
2. gathers the cart contents,
3. computes the total cost,
4. saves the order into the database,
5. processes a demo payment,
6. updates the payment status,
7. displays a confirmation page.

The app is designed to mirror a realistic e-commerce food ordering workflow while staying suitable for an academic project.

## 11. Payment Method
The system uses a simulated payment method instead of a live production payment gateway. This is intentional for academic and testing purposes. The payment flow validates the order and marks the status as either Paid or Failed based on a demo transaction.

## 12. Challenges Encountered
During development, a few key issues were identified and resolved:
- stale SQLite schema mismatch during checkout testing,
- missing database columns after model changes,
- ensuring proper token validation for authenticated routes,
- keeping the project simple enough for an OND-level presentation without sacrificing functionality.

These challenges were solved by resetting the database and updating the connection logic to automatically add missing columns when necessary.

## 13. Testing and Verification
The project was tested using live HTTP requests against the running backend. The verification confirmed that:
- the health endpoint responded successfully,
- new users could register,
- JWT authentication worked,
- orders could be created,
- demo payment processing succeeded,
- payment status changed to Paid.

This confirms that the major workflow is working end-to-end.

## 14. Project Outcome
The result is a functional food ordering system that demonstrates the core features of a modern delivery app. It is suitable for presentation, demonstration, and academic evaluation because it combines frontend experience, backend logic, database integration, authentication, and order processing in one coherent project.

## 15. Conclusion
Foodie. successfully demonstrates how a food delivery web application can be developed using modern web technologies while remaining practical and manageable for an OND final-year project. The project combines usability, business logic, and technical implementation in a way that is suitable for presentation and future enhancement.

## 16. Future Enhancements
Possible improvements for future versions include:
- live Paystack or Flutterwave integration,
- rider tracking,
- email confirmation for orders,
- admin dashboard with charts,
- real-time notifications,
- delivery status updates,
- deployment to a cloud platform.

## 17. Final Statement
This project is a strong OND-level food delivery application because it reflects real-world e-commerce and ordering workflows while remaining focused, understandable, and technically implementable.
