import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Profile from './pages/Profile';
import InterviewSetup from './pages/interview/InterviewSetup';
import InterviewSession from './pages/interview/InterviewSession';
import InterviewHistory from './pages/interview/InterviewHistory';
import TestSetup from './pages/test/TestSetup';
import TestSession from './pages/test/TestSession';
import TestHistory from './pages/test/TestHistory';
import TestResult from './pages/test/TestResult';
import Admin from './pages/Admin';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/setup"
          element={
            <ProtectedRoute>
              <InterviewSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/session"
          element={
            <ProtectedRoute>
              <InterviewSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/history"
          element={
            <ProtectedRoute>
              <InterviewHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/setup/:testId"
          element={
            <ProtectedRoute>
              <TestSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/session/:testId"
          element={
            <ProtectedRoute>
              <TestSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/history"
          element={
            <ProtectedRoute>
              <TestHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/result/:sessionId"
          element={
            <ProtectedRoute>
              <TestResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
