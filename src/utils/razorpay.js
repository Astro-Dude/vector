// Improved error handling for Razorpay integration
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log("Razorpay already loaded");
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
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
    const razorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      ...options,
      handler: function (response) {
        onSuccess(response);
      },
    };
    
    const paymentObject = new window.Razorpay(razorpayOptions);
    
    paymentObject.on('payment.failed', function(response) {
      onError(response);
    });
    
    paymentObject.open();
  } catch (error) {
    alert("Failed to initialize payment. Error: " + error.message);
    onError({ error: { description: error.message } });
  }
}; 