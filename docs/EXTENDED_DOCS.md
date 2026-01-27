# Extended Documentation

## 📂 Folder Structure
- `config/`: Configuration for Uploads, Mailer.
- `models/`: Mongoose Schemas.
- `routes/`: API Route handlers.
- `middleware/`: Auth middleware.

## 🔑 Key API Endpoints

### Auth
- `POST /api/auth/google`: Login with Google ID Token.
- `GET /api/auth/me`: Get current user details.

### Products
- `GET /api/products`: List approved products.
- `GET /api/products?vendor=VENDOR_ID`: Filter products by vendor.
- `POST /api/products`: Add product (Vendor).
- `GET /api/products/:id`: Product details.

### Vendor (Public)
- `GET /api/vendor/:id/profile`: Get public vendor shop details.

### Orders
- `POST /api/orders`: Place order (returns array of created orders).
- `GET /api/orders/my`: User's order history.
- `PUT /api/orders/:id/status`: Update status (Vendor/Admin).

### Upload
- `POST /api/upload/product`: Upload image (returns URL).

## 🛠 Setup Guide

### 1. Google Auth
- Go to Google Cloud Console.
- Create Credentials > OAuth Client ID.
- Add `GOOGLE_CLIENT_ID` to `.env`.

### 2. ImageKit
- Sign up at ImageKit.io.
- Get Keys from Dashboard.
- Add to `.env`.

### 3. Payments
- **Stripe**: Add `STRIPE_SECRET`.
- **Khalti**: Add `KHALTI_SECRET`.
- **eSewa**: Add `ESEWA_MERCHANT_CODE`.

## 🚀 Deployment
Ready for deployment on Render, Railway, or VPS.
Ensure MongoDB Atlas URI is used in `MONGODB_URI` for production.
