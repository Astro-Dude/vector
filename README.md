# Vector - MERN Authentication Setup

This project implements Google OAuth authentication using Passport.js, MongoDB, and React.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your values:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
# Google OAuth Configuration
# Get these from Google Cloud Console: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vector

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback` (for development)
   - Your production URL + `/auth/google/callback`

### 4. MongoDB Setup
Make sure MongoDB is running locally or update `MONGODB_URI` to your MongoDB Atlas connection string.

### 5. Start Backend
```bash
npm run dev
```

## Frontend Setup

### 1. Install Dependencies (if not already done)
```bash
cd frontend
npm install
```

### 2. Environment Variables
The `.env` file is already created with:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Frontend
```bash
npm run dev
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout user

### User
- `GET /api/user` - Get current user info

## How Authentication Works

1. User clicks "Login" or "Get started" button
2. Frontend redirects to `/auth/google`
3. User authenticates with Google
4. Google redirects back to `/auth/google/callback`
5. Backend processes authentication and creates/updates user in MongoDB
6. User is redirected back to frontend
7. Frontend checks authentication status and updates UI

## Features

- ✅ Google OAuth 2.0 authentication
- ✅ MongoDB user storage
- ✅ Session management
- ✅ Protected routes
- ✅ Responsive navbar with auth state
- ✅ Automatic user profile creation
- ✅ Secure logout functionality

## Security Notes

- Change `SESSION_SECRET` in production
- Use HTTPS in production
- Validate redirect URIs in Google Console
- Consider implementing CSRF protection
- Add rate limiting for authentication endpoints