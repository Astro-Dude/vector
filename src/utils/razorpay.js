// Improved error handling for Razorpay integration
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log("Razorpay already loaded");
      resolve(true);
      return;
    }
    
    console.log("Loading Razorpay script...");
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      resolve(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Initialize payment with improved logging
export const initiatePayment = async (options, onSuccess, onError) => {
  const res = await loadRazorpayScript();
  
  if (!res) {
    alert('Razorpay SDK failed to load. Please check your connection');
    return;
  }
  
  try {
    console.log("Creating Razorpay payment with options:", {
      ...options,
      key: options.key ? "KEY_PRESENT" : "KEY_MISSING" // Don't log the actual key
    });
    
    const razorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      ...options,
      handler: function (response) {
        console.log("Payment successful:", response);
        onSuccess(response);
      },
    };
    
    const paymentObject = new window.Razorpay(razorpayOptions);
    
    paymentObject.on('payment.failed', function(response) {
      console.error("Payment failed:", response.error);
      onError(response);
    });
    
    console.log("Opening Razorpay payment form");
    paymentObject.open();
  } catch (error) {
    console.error("Error in Razorpay payment initiation:", error);
    alert("Failed to initialize payment. Error: " + error.message);
    onError({ error: { description: error.message } });
  }
}; 