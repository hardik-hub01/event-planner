# Lumina Events - Production Setup Guide

## Project Structure

```
event-planner/
├── frontend/                    # React/Vanilla JS frontend
│   ├── index.html              # Main HTML file
│   ├── js/                      # JavaScript modules
│   │   ├── api.js              # API client
│   │   ├── auth.js             # Authentication manager
│   │   ├── events.js           # Events manager
│   │   ├── bookings.js         # Bookings manager
│   │   └── utils.js            # UI utilities
│   └── css/                     # CSS files (optional, using Tailwind)
├── backend/                     # Node.js Express API
│   ├── server.js               # Main server file
│   ├── package.json            # Dependencies
│   ├── .env.example            # Environment variables template
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── Booking.js          # Booking schema
│   ├── routes/
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── bookings.js         # Booking endpoints
│   │   ├── events.js           # Events endpoints
│   │   └── payments.js         # Payment endpoints
│   └── middleware/
│       └── auth.js             # JWT authentication
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas cloud)
- Stripe account (for payments)

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create .env file:**
```bash
cp .env.example .env
```

3. **Configure environment variables:**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lumina-events
JWT_SECRET=your_super_secret_jwt_key_here
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
FRONTEND_URL=http://localhost:3000
```

4. **Start MongoDB:**
```bash
# macOS/Linux
mongod

# Windows
mongod --dbpath "C:\data\db"
```

5. **Run backend server:**
```bash
npm start
# Or for development with auto-restart:
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. **Update API URL in `/frontend/js/api.js`:**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

2. **Update Stripe publishable key:**
Add to your HTML:
```html
<script src="https://js.stripe.com/v3/"></script>
```

3. **Serve frontend:**
```bash
# Using Python
python3 -m http.server 3000

# Or using Node.js http-server
npm install -g http-server
http-server -p 3000
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/social-login` - Sign in with social provider
- `GET /api/auth/me` - Get current user (requires auth)

### Events
- `GET /api/events/categories` - Get all event categories
- `GET /api/events/categories/:id` - Get specific category
- `GET /api/events/packages` - Get all packages

### Bookings
- `POST /api/bookings` - Create booking (requires auth)
- `GET /api/bookings` - Get user's bookings (requires auth)
- `GET /api/bookings/:id` - Get specific booking (requires auth)
- `PUT /api/bookings/:id` - Update booking (requires auth)
- `DELETE /api/bookings/:id` - Cancel booking (requires auth)

### Payments
- `POST /api/payments/create-intent` - Create payment intent (requires auth)
- `POST /api/payments/confirm` - Confirm payment (requires auth)
- `GET /api/payments/:bookingId` - Get payment status (requires auth)

## Security Features Implemented

✅ **Authentication**
- JWT token-based authentication
- Email/password with bcrypt hashing
- Social login support
- Token expiration (7 days)

✅ **Authorization**
- Protected routes with middleware
- User ownership verification for bookings
- Role-based access control ready

✅ **Data Validation**
- Input validation on all endpoints
- Email format validation
- Password strength requirements
- CORS enabled

✅ **Security Headers**
- Helmet.js for security headers
- HTTPS ready (configure in production)
- XSS protection
- CSRF protection ready

## Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  loginMethod: String (email/Google/Apple/GitHub),
  eventInterest: String,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking
```javascript
{
  userId: ObjectId,
  eventCategory: String,
  packageName: String,
  venue: String,
  guests: Number,
  eventDate: Date,
  totalAmount: Number,
  paymentStatus: String (pending/completed/failed/refunded),
  stripePaymentId: String,
  vendors: Array,
  status: String (confirmed/completed/cancelled),
  bookingRef: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps for Production

1. **Database**
   - ✅ MongoDB connected
   - Use MongoDB Atlas for cloud hosting
   - Set up automated backups

2. **Payments**
   - ✅ Stripe integrated
   - Implement webhook handlers
   - Add Razorpay as alternative gateway

3. **Frontend**
   - ✅ APIs connected
   - Set up build pipeline (Vite/Webpack)
   - Add error handling & loading states
   - Implement real Stripe checkout

4. **Deployment**
   - Set up CI/CD (GitHub Actions, GitLab CI)
   - Deploy backend (Heroku, AWS, DigitalOcean)
   - Deploy frontend (Netlify, Vercel, AWS S3)
   - Configure production environment variables

5. **Monitoring**
   - Add logging (Winston, Morgan)
   - Error tracking (Sentry)
   - Performance monitoring (New Relic)

6. **Testing**
   - Unit tests (Jest)
   - API tests (Postman/REST Client)
   - E2E tests (Cypress/Playwright)

## Troubleshooting

**MongoDB Connection Failed**
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network access for Atlas

**CORS Errors**
- Ensure FRONTEND_URL is correct in .env
- Check browser console for exact error
- Verify API is accepting requests

**Authentication Fails**
- Check JWT_SECRET is set correctly
- Verify token is being sent in Authorization header
- Check token expiration

## Support

For issues or questions, check:
- Backend logs in terminal
- Browser console for frontend errors
- Network tab in DevTools for API responses

---

**Status:** ✅ Production-Ready Foundation
**Last Updated:** March 28, 2026
