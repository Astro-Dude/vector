// Function to disable browser inspection tools and user interactions
export const disableInspection = () => {
  // Helper function to check if element is a form element or inside an auth form
  const isFormOrAuth = (el) => {
    // Check if this is a form element
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || 
        el.tagName === 'BUTTON' || el.contentEditable === 'true') {
      return true;
    }
    
    // Check if this element or any parent is a login/auth form
    let current = el;
    while (current) {
      if (current.classList && 
          (current.classList.contains('login-form') || 
           current.classList.contains('auth-form') || 
           current.classList.contains('firebase-auth') ||
           current.id === 'firebaseui_container')) {
        return true;
      }
      // Move up to parent
      current = current.parentElement;
    }
    
    return false;
  };

  // Disable right-click but allow it on form elements
  document.addEventListener('contextmenu', (e) => {
    if (isFormOrAuth(e.target)) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // Disable text selection except on form elements
  document.addEventListener('selectstart', (e) => {
    if (isFormOrAuth(e.target)) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // Disable copy except on form elements
  document.addEventListener('copy', (e) => {
    if (isFormOrAuth(e.target)) {
      return true;
    }
    e.preventDefault();
    return false;
  });
  
  // Disable cut except on form elements
  document.addEventListener('cut', (e) => {
    if (isFormOrAuth(e.target)) {
      return true;
    }
    e.preventDefault();
    return false;
  });
  
  // Disable paste except on form elements
  document.addEventListener('paste', (e) => {
    if (isFormOrAuth(e.target)) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // Disable keyboard shortcuts for debugging
  document.addEventListener('keydown', (e) => {
    // Skip if in a form element
    if (isFormOrAuth(e.target)) {
      return true;
    }
    
    // F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+I
    if (
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) ||
      (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) ||
      (e.ctrlKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73))
    ) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U (view source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      return false;
    }

    // Ctrl+S (save page)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
      e.preventDefault();
      return false;
    }
  });

  // We're removing console protection completely as it may interfere with Firebase auth
  // If needed, you can restore it later with a more permissive implementation
};

// Export the function
export default disableInspection; 