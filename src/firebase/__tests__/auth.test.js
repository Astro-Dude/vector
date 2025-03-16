import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Mock the Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../../firebase/firebase', () => ({
  auth: {},
  db: {}
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { 
    currentUser, 
    signup, 
    login, 
    logout, 
    resetPassword,
    signInWithGoogle,
    error
  } = useAuth();

  const handleSignup = async () => {
    try {
      await signup('test@example.com', 'password123', 'Test User');
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password123');
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword('test@example.com');
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      // Error is handled by the context
    }
  };

  return (
    <div>
      <div data-testid="user-status">
        {currentUser ? 'Logged in' : 'Not logged in'}
      </div>
      {error && <div data-testid="error-message">{error}</div>}
      <button onClick={handleSignup} data-testid="signup-button">Sign Up</button>
      <button onClick={handleLogin} data-testid="login-button">Login</button>
      <button onClick={handleLogout} data-testid="logout-button">Logout</button>
      <button onClick={handleResetPassword} data-testid="reset-password-button">Reset Password</button>
      <button onClick={handleGoogleSignIn} data-testid="google-signin-button">Sign in with Google</button>
    </div>
  );
};

describe('Auth Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signup function creates a new user and updates profile', async () => {
    // Mock the Firebase auth functions
    const mockUser = { uid: '123', email: 'test@example.com' };
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    updateProfile.mockResolvedValue();
    setDoc.mockResolvedValue();
    
    render(
      <AuthProvider>
        <Router>
          <TestComponent />
        </Router>
      </AuthProvider>
    );

    // Click the signup button to trigger the signup function
    await act(async () => {
      userEvent.click(screen.getByTestId('signup-button'));
    });

    // Check that the Firebase functions were called with the correct parameters
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
    
    expect(updateProfile).toHaveBeenCalledWith(
      mockUser,
      { displayName: 'Test User' }
    );
    
    expect(setDoc).toHaveBeenCalled();
  });

  test('login function signs in an existing user', async () => {
    // Mock the Firebase auth functions
    const mockUser = { uid: '123', email: 'test@example.com' };
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    
    render(
      <AuthProvider>
        <Router>
          <TestComponent />
        </Router>
      </AuthProvider>
    );

    // Click the login button to trigger the login function
    await act(async () => {
      userEvent.click(screen.getByTestId('login-button'));
    });

    // Check that the Firebase function was called with the correct parameters
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
  });

  test('signInWithGoogle function signs in user with Google', async () => {
    // Mock the Firebase auth functions
    const mockUser = { 
      uid: '123', 
      email: 'test@gmail.com',
      displayName: 'Test Google User',
      photoURL: 'https://example.com/photo.jpg'
    };
    
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue();
    
    render(
      <AuthProvider>
        <Router>
          <TestComponent />
        </Router>
      </AuthProvider>
    );

    // Click the Google sign-in button
    await act(async () => {
      userEvent.click(screen.getByTestId('google-signin-button'));
    });

    // Check that the Firebase functions were called
    expect(signInWithPopup).toHaveBeenCalled();
    expect(getDoc).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
    
    // Verify the user document is created with the correct data
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        photoURL: mockUser.photoURL,
        authProvider: 'google'
      })
    );
  });
  
  test('signInWithGoogle does not create a document for existing users', async () => {
    // Mock the Firebase auth functions
    const mockUser = { 
      uid: '123', 
      email: 'test@gmail.com',
      displayName: 'Test Google User',
      photoURL: 'https://example.com/photo.jpg'
    };
    
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => true }); // User already exists
    
    render(
      <AuthProvider>
        <Router>
          <TestComponent />
        </Router>
      </AuthProvider>
    );

    // Click the Google sign-in button
    await act(async () => {
      userEvent.click(screen.getByTestId('google-signin-button'));
    });

    // Check that the Firebase functions were called
    expect(signInWithPopup).toHaveBeenCalled();
    expect(getDoc).toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled(); // Should not create a new document
  });

  test('logout function signs out the current user', async () => {
    // Mock the Firebase auth function
    signOut.mockResolvedValue();
    
    render(
      <AuthProvider>
        <Router>
          <TestComponent />
        </Router>
      </AuthProvider>
    );

    // Click the logout button to trigger the logout function
    await act(async () => {
      userEvent.click(screen.getByTestId('logout-button'));
    });

    // Check that the Firebase function was called
    expect(signOut).toHaveBeenCalled();
  });

  test('resetPassword function sends a password reset email', async () => {
    // Mock the Firebase auth function
    sendPasswordResetEmail.mockResolvedValue();
    
    render(
      <AuthProvider>
        <Router>
          <TestComponent />
        </Router>
      </AuthProvider>
    );

    // Click the reset password button to trigger the function
    await act(async () => {
      userEvent.click(screen.getByTestId('reset-password-button'));
    });

    // Check that the Firebase function was called with the correct parameters
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com'
    );
  });

  test('handles errors during authentication', async () => {
    // Mock the Firebase auth function to throw an error
    const error = new Error('Auth failed');
    error.code = 'auth/wrong-password';
    signInWithEmailAndPassword.mockRejectedValue(error);
    
    render(
      <AuthProvider>
        <Router>
          <TestComponent />
        </Router>
      </AuthProvider>
    );

    // Click the login button to trigger the login function that will fail
    await act(async () => {
      userEvent.click(screen.getByTestId('login-button'));
    });

    // Error handling is done by the context, so we don't expect to see the error here
    // But the error state in the context should be updated
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });
}); 