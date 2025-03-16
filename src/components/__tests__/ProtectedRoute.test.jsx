import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Test component for protected content
const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
  test('redirects to login when user is not authenticated', () => {
    // Mock the auth context to return null for currentUser
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false
    });

    // Use MemoryRouter to control the initial location
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Expect to be redirected to the login page
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('renders children when user is authenticated', () => {
    // Mock the auth context to return a user
    useAuth.mockReturnValue({
      currentUser: { uid: '123', email: 'test@example.com' },
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <ProtectedComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Expect the protected content to be rendered
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('displays loading state when auth is loading', () => {
    // Mock the auth context to indicate it's still loading
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <ProtectedComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Expect loading indicator to be shown
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
}); 