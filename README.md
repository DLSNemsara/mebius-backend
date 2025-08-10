# Mebius Backend

This repository contains the backend code for the **Mebius eCommerce** project. It is built with Node.js, Express, and MongoDB to provide a scalable, secure, and efficient e-commerce backend with integrated payment processing.

## Features

### **E-commerce Core**

- **Product Management**: Complete CRUD operations for products and categories
- **Shopping Cart**: Persistent cart management with user authentication
- **Order Processing**: Comprehensive order lifecycle management
- **User Management**: Authentication and authorization with Clerk integration
- **Wishlist System**: User wishlist management and persistence

### **Payment Gateway Integration**

- **Stripe Integration**: Secure payment processing with PaymentIntents
- **Multiple Payment Methods**: Support for credit/debit cards and COD
- **Webhook Handling**: Real-time payment status updates
- **Payment Security**: PCI-compliant payment processing
- **Order Payment Tracking**: Complete payment status management

### **Security & Authentication**

- **Clerk Integration**: Modern authentication and user management
- **JWT Token Validation**: Secure API endpoint protection
- **CORS Configuration**: Cross-origin resource sharing setup
- **Input Validation**: Comprehensive request validation and sanitization
- **Error Handling**: Global error handling with proper HTTP status codes

### **Data Management**

- **MongoDB Integration**: Scalable NoSQL database with Mongoose ODM
- **Data Models**: Structured schemas for products, orders, users, and reviews
- **Review System**: User-generated product reviews and ratings
- **Search & Filtering**: Advanced product discovery capabilities

## Technologies Used

- **Node.js** for the backend runtime environment
- **Express.js** for the web application framework
- **MongoDB & Mongoose** for database management and ODM
- **Stripe** for payment processing and webhooks
- **Clerk** for authentication and user management
- **Dotenv** for environment variable management
- **CORS** for cross-origin resource sharing
- **Helmet** for security headers

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB database (local or cloud)
- Stripe account for payment processing
- Clerk account for authentication

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/DLSNemsara/mebius-backend.git
   ```

2. **Navigate to the project directory:**

   ```sh
   cd mebius-backend
   ```

3. **Install dependencies:**

   ```sh
   npm install
   ```

4. **Set up environment variables:**
   Create a `.env` file in the root directory:

   ```env
   PORT=8000
   MONGO_URI=your_mongodb_connection_string
   STRIPE_SECRET_KEY=your_stripe_secret_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

5. **Start the development server:**

   ```sh
   npm run dev
   ```

6. **Verify the server is running:**
   Navigate to `http://localhost:8000/api/health`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Environment Configuration

### Development

- Local MongoDB instance
- Development Stripe keys
- Local Clerk configuration
- CORS enabled for localhost frontend

### Production

- Cloud MongoDB (MongoDB Atlas)
- Production Stripe keys
- Production Clerk configuration
- CORS configured for deployed frontend

## Project Structure

```
src/
├── api/                 # API routes and middleware
│   ├── middleware/      # Custom middleware functions
│   └── routes/          # Route definitions
├── application/         # Business logic layer
├── domain/             # Data models and interfaces
├── infrastructure/      # External services and database
└── index.ts            # Application entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/verify` - Verify Clerk JWT tokens

### Products

- `GET /api/products` - Get all products with filtering
- `GET /api/products/:id` - Get product by ID
- `GET /api/categories` - Get all categories

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id` - Update order status

### Wishlist

- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist` - Add product to wishlist
- `DELETE /api/wishlist/:productId` - Remove product from wishlist

### Reviews

- `POST /api/reviews` - Create product review
- `GET /api/reviews/:productId` - Get product reviews

### Payment

- `POST /api/payment/webhook` - Stripe webhook endpoint

## Stripe Integration

The backend integrates with Stripe for secure payment processing:

1. **Payment Intent Creation**: Creates PaymentIntents for card payments
2. **Webhook Handling**: Processes Stripe webhooks for payment updates
3. **Order Status Updates**: Automatically updates order status based on payment events
4. **Metadata Management**: Links Stripe payments to internal orders

### Stripe Dashboard Setup

- Configure webhook endpoint: `https://your-domain.com/api/payment/webhook`
- Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copy webhook signing secret to environment variables

## Authentication Flow

1. **Frontend Authentication**: Clerk handles user sign-up/sign-in
2. **JWT Token**: Clerk provides JWT tokens for authenticated requests
3. **Backend Verification**: Backend verifies tokens using Clerk's public key
4. **Protected Routes**: API endpoints check authentication before processing

## Deployment

The backend is deployed on **Render**:

- Automatic deployments from main branch
- Environment variable configuration
- MongoDB Atlas integration
- SSL certificate management

## Testing

### API Testing

- Use Postman or similar tools for endpoint testing
- Test authentication flows
- Verify payment webhook handling
- Check error handling scenarios

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

For any inquiries or feedback, please contact us at [sinelnemsara19@gmail.com](mailto:sinelnemsara19@gmail.com).

---

**Mebius Backend** - Secure E-commerce API
