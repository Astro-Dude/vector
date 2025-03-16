import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';
import MockTestStart from './components/MockTestStart';
import MockTest from './components/MockTest';
import TestResults from './components/TestResults';
import TestSolutions from './components/TestSolutions';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import { Suspense } from 'react';
import { useAuth } from './context/AuthContext';

// Loading component for Suspense
const LoadingFallback = () => <LoadingScreen message="Loading content..." />;

// PublicRoute component for non-authenticated users
const PublicRoute = ({ children }) => {
  const { currentUser, authChecked } = useAuth();
  
  // Show loading spinner while checking auth
  if (!authChecked) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  // Redirect to dashboard if user is already logged in
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Layout component to conditionally render navbar and footer
const Layout = ({ children }) => {
  const location = useLocation();
  
  // Hide navbar and footer on test-related pages, auth pages, and dashboard
  const hideNavFooter = location.pathname.includes('/test/') || 
                        location.pathname.includes('/login') || 
                        location.pathname.includes('/signup') || 
                        location.pathname.includes('/forgot-password') ||
                        location.pathname === '/dashboard';
  
  return (
    <div className="min-h-screen bg-white">
      {!hideNavFooter && <Navbar />}
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </ErrorBoundary>
      {!hideNavFooter && <Footer />}
    </div>
  );
};

// AuthenticatedApp component - what logged-in users see
const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Test Pages */}
      <Route 
        path="/test/:testId/start" 
        element={
          <ProtectedRoute>
            <MockTestStart 
              testId="nset-sample" 
              testName="NSET Free Sample Test" 
              duration={60} 
              questions={21} 
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/test/:testId/questions" 
        element={
          <ProtectedRoute>
            <MockTest />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/test/:testId/results" 
        element={
          <ProtectedRoute>
            <TestResults />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/test/:testId/solutions" 
        element={
          <ProtectedRoute>
            <TestSolutions />
          </ProtectedRoute>
        } 
      />
      
      {/* Route for home page when authenticated */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Fallback for authenticated users */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// UnauthenticatedApp component - what logged-out users see
const UnauthenticatedApp = () => {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={
        <main className="bg-white">
          <Hero />
          <Features />
          <Testimonials />
          <CTA />
        </main>
      } />
      
      {/* Auth Pages */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />
      
      {/* Fallback for unauthenticated users */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const AppContent = () => {
  const { currentUser, authChecked } = useAuth();
  
  if (!authChecked) {
    return <LoadingScreen message="Initializing application..." />;
  }
  
  return currentUser ? <AuthenticatedApp /> : <UnauthenticatedApp />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
            <AppContent />
          </Layout>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
