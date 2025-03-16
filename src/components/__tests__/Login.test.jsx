import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Login from '../Login';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock implementation for useAuth
    useAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue({}),
      signInWithGoogle: jest.fn().mockResolvedValue({}),
      error: ''
    });
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Check if the form elements are rendered
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    
    // Check Google sign-in button is rendered
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  test('submits the form with valid inputs', async () => {
    const mockLogin = jest.fn().mockResolvedValue({});
    useAuth.mockReturnValue({
      login: mockLogin,
      signInWithGoogle: jest.fn().mockResolvedValue({}),
      error: ''
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

    // Check if login was called with the correct arguments
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Check if navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('signs in with Google when Google button is clicked', async () => {
    const mockGoogleSignIn = jest.fn().mockResolvedValue({});
    useAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue({}),
      signInWithGoogle: mockGoogleSignIn,
      error: ''
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click on the Google sign-in button
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    // Check if signInWithGoogle was called
    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
    });

    // Check if navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays validation errors for empty fields', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('displays error message when login fails', async () => {
    // Mock login to reject with an error
    const mockError = new Error('Invalid email or password');
    const mockLogin = jest.fn().mockRejectedValue(mockError);
    
    useAuth.mockReturnValue({
      login: mockLogin,
      signInWithGoogle: jest.fn().mockResolvedValue({}),
      error: 'Invalid email or password'
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('displays error message when Google sign-in fails', async () => {
    // Mock Google sign-in to reject with an error
    const mockError = new Error('Google sign-in failed');
    mockError.code = 'auth/popup-closed-by-user';
    const mockGoogleSignIn = jest.fn().mockRejectedValue(mockError);
    
    useAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue({}),
      signInWithGoogle: mockGoogleSignIn,
      error: 'Sign-in was cancelled'
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click on the Google sign-in button
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/sign-in was cancelled/i)).toBeInTheDocument();
    });
  });

  test('navigates to forgot password page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click on the forgot password link
    fireEvent.click(screen.getByText(/forgot password/i));

    // Check if navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  test('navigates to signup page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click on the signup link
    fireEvent.click(screen.getByText(/sign up/i));

    // Check if navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
}); 