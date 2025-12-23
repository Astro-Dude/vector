# Vector

AI-powered interview and test preparation platform built with the MERN stack.

## Features

- **Google OAuth Authentication** - Secure login with Google accounts
- **AI Mock Interviews** - Practice interviews with AI-powered feedback, audio recording, and credit-based system
- **Practice Tests** - MCQ and input-based tests with timed sessions and detailed results
- **Payment Integration** - Razorpay payments with coupon and referral discount support
- **Referral System** - Earn rewards by referring new users
- **Admin Dashboard** - Manage users, content, purchases, and view analytics

## Tech Stack

### Backend
- Node.js + Express.js (TypeScript)
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- Razorpay SDK
- OpenAI / Groq SDK for AI features
- Supabase for file storage

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router v7
- Spline (3D graphics)

## Project Structure

```
vector/
├── backend/
│   ├── src/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── services/      # External integrations
│   │   ├── config/        # Configuration
│   │   └── server.ts      # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── contexts/      # React contexts
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud Console account
- Razorpay account

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   # Server
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/vector

   # Session
   SESSION_SECRET=your-session-secret

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Razorpay
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret

   # AI Services (choose one)
   OPENAI_API_KEY=your-openai-api-key
   # or
   GROQ_API_KEY=your-groq-api-key

   # Supabase (for file storage)
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:5000/auth/google/callback`
   - Production: `https://your-domain.com/auth/google/callback`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| GET | `/auth/status` | Check authentication status |
| GET | `/auth/purchases` | Get user's purchases and credits |
| POST | `/auth/logout` | Logout user |

### Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payment/key` | Get Razorpay public key |
| POST | `/api/payment/create-order` | Create payment order |
| POST | `/api/payment/verify` | Verify payment and create purchase |
| POST | `/api/payment/validate-code` | Validate coupon/referral code |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interview/balance` | Get interview credits balance |
| GET | `/api/interview/session` | Get session info before starting |
| POST | `/api/interview/start` | Start new interview session |
| POST | `/api/interview/answer` | Submit answer and get feedback |
| POST | `/api/interview/end-early` | End interview early |
| GET | `/api/interview/history` | Get interview history |
| GET | `/api/interview/result/:sessionId` | Get specific interview result |

### Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/test/:itemId` | Get test details and questions |
| POST | `/api/test/start` | Start test session |
| POST | `/api/test/submit` | Submit test answers |
| GET | `/api/test/history` | Get test history |
| GET | `/api/test/result/:id` | Get specific test result |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/search` | Search users by email |
| GET | `/api/admin/purchases` | List all purchases |
| GET | `/api/admin/stats` | Get dashboard statistics |
| POST | `/api/admin/assign` | Assign items/credits to user |
| GET/POST/PUT/DELETE | `/api/admin/items` | Manage items |
| GET/POST/PUT/DELETE | `/api/admin/questions` | Manage interview questions |
| GET/POST/PUT/DELETE | `/api/admin/test-questions` | Manage test questions |
| GET/POST/PUT/DELETE | `/api/admin/coupons` | Manage coupons |
| GET/PUT | `/api/admin/referral-settings` | Manage referral settings |
| GET/POST/DELETE | `/api/admin/admins` | Manage admin users |

## Security Notes

- Change `SESSION_SECRET` to a strong random value in production
- Use HTTPS in production
- Configure CORS to only allow your frontend domain
- Validate Razorpay webhook signatures
- Keep API keys secure and never commit them to version control

## License

**All Rights Reserved**

This is a private project. No part of this codebase may be copied, modified, distributed, or used in any form without explicit written permission from the owner.
