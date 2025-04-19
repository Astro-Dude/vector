# Vector - NSET Exam Preparation Platform

A comprehensive web application designed to help students prepare for the **Scaler School of Technology (SST)** NSET entrance examination with mock tests, interview practice, and detailed solutions.

---

## 🚀 Overview

**Vector** provides a complete preparation solution for NSET aspirants:

- Take full-length mock tests simulating the actual NSET exam
- Schedule 1-on-1 mock interviews with current SST students
- Get detailed explanations and solutions to practice questions
- Track your performance and progress over time
- Access curated test series with increasing difficulty levels

---

## 🔑 Features

### Authentication System
- Secure login with Google OAuth integration
- User profile management and session handling
- Protected routes for authenticated users

### Dashboard
- Personalized welcome screen with user information
- View purchased tests and booked interviews
- Access NSET exam syllabus and preparation materials
- Track progress and performance metrics

### Mock Test System
- Full-screen test environment with anti-cheating measures
- Automated timer with countdown and auto-submission
- Question navigation panel with attempt status tracking
- Mark questions for review functionality
- Support for multiple question types (MCQs and text answers)

### Interview Preparation
- Book mock interviews with current SST students
- Schedule management and booking confirmation system
- Interview status tracking (pending, confirmed, completed)
- Google Meet integration for virtual interviews
- Personalized interview feedback

### Payment Integration
- Seamless Razorpay payment gateway integration
- Secure processing for test purchases and interview bookings
- Order management and transaction history
- Responsive error handling for payment failures

### Content Management
- Detailed NSET exam syllabus with topic breakdowns
- Mock tests with varying difficulty levels
- Advanced question rendering with rich text and formatting
- Comprehensive solutions and explanations

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Functions)
- **Payment Gateway**: Razorpay
- **State Management**: React Context API
- **Routing**: React Router v6
- **Hosting**: Firebase Hosting

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Razorpay test account (for payment features)

### Installation

```bash
git clone https://github.com/shauryaverma-astro/vector.git
cd vector

# Install dependencies
npm install
# or
yarn install
```

### Environment Variables

Create a `.env` file in the root directory and add:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

### Start Development Server
```bash
npm run dev
# or
yarn dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## 🔧 Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Google provider)
3. Set up Firestore Database with collections:
   - `users`: User profiles and authentication data
   - `testPurchases`: Records of purchased tests
   - `interviewBookings`: Scheduled interview appointments
   - `settings`: Application-wide configuration

---

## 🚀 Deployment

```bash
# Build production version
npm run build
# or
yarn build

# Deploy to Firebase
firebase deploy
```

---

## 📁 Project Structure

```bash
/src
  /assets              # Static assets (images, icons)
  /components          # React components
  /context             # Context providers (auth, etc.)
  /data                # Test questions and configuration
  /firebase            # Firebase initialization and services
  /hooks               # Custom React hooks
  /services            # API service layers
  /utils               # Utility functions
  App.jsx              # Main application component
  main.jsx             # Entry point
```

---

## 🔍 Key Components

- `Dashboard.jsx`: User dashboard for accessing tests and interviews
- `MockTest.jsx`: Interactive test-taking interface
- `TestResults.jsx`: Results and performance analysis
- `TestSolutions.jsx`: Detailed explanations for test questions
- `Mentors.jsx`: Displays information about SST mentors

---

## 🧪 Test Configuration

Tests are configured in `src/data/testConfig.js`. To add a new test:

1. Create a new question set file in `src/data/`
2. Import and register in `testConfig.js`

# Project Structure
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

Example:
```js
export const testConfigs = {
  'new-test-id': {
    questions: newTestQuestions,
    testName: "New Test Name",
    testDuration: 120,
    totalQuestions: newTestQuestions.length,
    passScore: 35,
    isFree: false,
    price: 99,
    testComponents: components
  },
};
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📬 Contact

For questions, suggestions, or feedback, please reach out to: **vector.scalernset@gmail.com**

Made with ❤️ by [Shaurya Verma](https://www.linkedin.com/in/astro-dude)
