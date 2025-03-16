# Vector - NSET Preparation Platform

Vector is a comprehensive platform designed to help students prepare for the Scaler School of Technology's entrance exam (NSET). The platform offers practice tests, resources, and personalized feedback to maximize students' chances of success.

## Features

- **User Authentication**: Secure login and registration system using Firebase Authentication
- **Protected Routes**: Access control for authenticated users
- **Dashboard**: Personalized dashboard showing purchased tests, progress, and upcoming events
- **Test Interface**: Full-screen test environment with anti-cheating measures
- **Results Analysis**: Detailed performance analysis with topic-wise breakdown
- **Solutions Viewer**: Review correct answers and explanations

## Authentication System

The authentication system is built using Firebase Authentication and includes:

- Email/password authentication
- User profile management
- Protected routes for authenticated content
- Password reset functionality

### Authentication Flow

1. Users can sign up with email, password, and display name
2. User data is stored in Firebase Authentication and Firestore
3. Protected routes check authentication status before rendering
4. Navbar and CTA sections adapt based on authentication state

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Firebase Configuration

The application uses Firebase for authentication and data storage. To set up your own Firebase project:

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password) and Firestore
3. Update the Firebase configuration in `src/firebase/firebase.js`

### Testing

The project includes comprehensive tests for the authentication system:

- Unit tests for authentication context
- Component tests for login, signup, and protected routes

Run tests with:
```
npm test
```

Run tests with coverage:
```
npm run test:coverage
```

## Project Structure

```
vector/
├── public/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Login.jsx
│   │   ├── MockTest.jsx
│   │   ├── MockTestStart.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Signup.jsx
│   │   ├── TestResults.jsx
│   │   ├── TestSolutions.jsx
│   │   └── __tests__/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── firebase/
│   │   ├── firebase.js
│   │   └── __tests__/
│   ├── App.jsx
│   └── main.jsx
├── .gitignore
├── babel.config.js
├── jest.config.js
├── jest.setup.js
├── package.json
└── README.md
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
