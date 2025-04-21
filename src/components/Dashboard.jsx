import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FirestoreError from "./FirestoreError";
import Name from "../assets/images/Name.png";
import Logo from "../assets/images/Logo.png";
import { testConfigs } from "../data/testConfig";
import {
  getUserPurchasedTests,
  getUserBookedInterviews,
  saveTestPurchase,
  saveMockInterviewBooking,
} from "../services/purchaseService";
import { initiatePayment } from "../utils/razorpay";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { formatPrice } from "../data/testConfig";
import { getAppSettings } from "../services/settingsService";
import ReactDOM from "react-dom";

// Define resources for each topic
const topicResources = {
  "Probability and Statistics": [
    {
      title: "Probability",
      url: "https://www.youtube.com/live/lWqcibMwKtk?si=adAHEiuwkMqzodVl",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-red-600" 
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      )
    },
    {
      title: "Statistics",
      url: "https://www.youtube.com/live/lWqcibMwKtk?si=XB1fRczBWLkmzbOm",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-red-600" 
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      )
    }
  ],
  // Add other topics with empty resource arrays for now
  "Number Theory": [
    {
      title: "Number Theory",
      url: "https://youtube.com/playlist?list=PLLtQL9wSL16iRzTi2aKPiHO1f1UjTTkJD&si=gTGBHPIXdKP9KSkQ",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-red-600" 
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      )
    }
  ],
  "Exponentials and Logarithms": [],
  "Permutation and Combinations": [
    {
      title: "P&C part 1",
      url: "https://www.youtube.com/live/THHeijYTfKs?si=I0OYtgMLHtLoHoLX",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-red-600" 
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      )
    },
    {
      title: "P&C part 2",
      url: "https://www.youtube.com/live/e7Is5-jBNDo?si=tr29glQm0p0mPID3",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-red-600" 
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      )
    }
  ],
  "Ratio and Proportion": [],
  "Sets (Venn Diagrams)": []
};

const Dashboard = () => {
  const {
    currentUser,
    userProfile,
    logout,
    firestoreConnected,
    getUserProfile,
  } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [purchasedTests, setPurchasedTests] = useState([]);
  const [bookedInterviews, setBookedInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [currentPurchaseItem, setCurrentPurchaseItem] = useState(null);
  const [appSettings, setAppSettings] = useState({
    interviewBookingsEnabled: true,
    interviewBookingsMessage: "",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [interviewCodeCopied, setInterviewCodeCopied] = useState(false);
  const interviewCodeRef = useRef(null);
  const referralCode = "SHAUE061";
  const [openResourceTopic, setOpenResourceTopic] = useState(null);

  // Load user's purchased tests and booked interviews
  useEffect(() => {
    const loadUserPurchases = async () => {
      if (currentUser) {
        try {
          const tests = await getUserPurchasedTests(currentUser.uid);
          setPurchasedTests(tests);

          const interviews = await getUserBookedInterviews(currentUser.uid);
          setBookedInterviews(interviews);
        } catch (error) {
          console.error("Error loading user purchases", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserPurchases();
  }, [currentUser]);

  // Load app settings once when component mounts + add refresh ability
  useEffect(() => {
    loadAppSettings();
  }, []);

  const loadAppSettings = async () => {
    setIsRefreshing(true);

    try {
      const settings = await getAppSettings();
      setAppSettings(settings);
    } catch (error) {
      // Set default settings on error
      setAppSettings({
        interviewBookingsEnabled: true,
        interviewBookingsMessage: "",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sample upcoming events
  const upcomingEvents = [
    // { id: 'event-1', title: 'NSET Preparation Webinar', date: 'June 15, 2024', time: '6:00 PM IST', status: 'upcoming' },
    // { id: 'event-2', title: 'Mock Interview Session', date: 'June 20, 2024', time: '5:00 PM IST', status: 'upcoming' },
    // { id: 'event-3', title: 'Q&A with NSET Toppers', date: 'June 25, 2024', time: '7:00 PM IST', status: 'upcoming' },
  ];

  // Handle retry when Firestore connection fails
  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      if (currentUser) {
        await getUserProfile(currentUser.uid);
      }
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleSyllabus = () => {
    setShowSyllabus(!showSyllabus);
    setMenuOpen(false); // Close the menu when selecting syllabus
  };

  const handleStartTest = (testId) => {
    navigate(`/test/${testId}/start`);
  };

  // Handle purchase of test series
  const handlePurchase = async (testId) => {
    if (!currentUser) {
      alert("Please log in to purchase tests");
      navigate("/login");
      return;
    }

    const testConfig = testConfigs[testId];
    if (!testConfig) return;

    // Directly use the numeric price value (no need to parse)
    const priceValue = (testConfig.price || 0) * 100; // Convert to paise

    // Get user profile details
    let phoneNumber = userProfile?.phoneNumber || "";

    // If no phone number found, prompt user for phone
    if (!phoneNumber) {
      setCurrentPurchaseItem({
        type: "test",
        id: testId,
        price: priceValue,
        name: testConfig.testName,
      });
      setShowPhonePrompt(true);
      return;
    }

    // If we already have the phone, proceed directly
    handleTestPurchaseWithPhone(testId, phoneNumber);
  };

  // Handle booking mock interview
  const handleBookInterview = () => {
    if (!appSettings.interviewBookingsEnabled) {
      // Don't proceed if bookings are disabled
      return;
    }

    if (!currentUser) {
      alert("Please log in to book an interview");
      navigate("/login");
      return;
    }

    // Set current purchase to interview
    setCurrentPurchaseItem({
      type: "interview",
      price: 39900, // 599 in paise
      name: "1:1 Mock Interview Session",
    });

    // Check if we have phone number
    if (!userProfile?.phoneNumber) {
      setShowPhonePrompt(true);
    } else {
      proceedWithInterviewBooking(userProfile.phoneNumber);
    }
  };

  // Proceed with interview booking after getting phone
  const proceedWithInterviewBooking = async (phone) => {
    try {
      // Show loading state
      setIsLoading(true);
      setShowPhonePrompt(false);

      // Create user details object
      const userDetails = {
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        phoneNumber: phone || "",
      };

      // Create order options for Razorpay
      const options = {
        amount: 39900, // 599 in paise
        currency: "INR",
        name: "Vector",
        description: "Mock Interview Session Booking",
        image: "https://your-logo-url.com/logo.png", // Replace with your logo URL
        prefill: {
          name: userDetails.displayName,
          email: userDetails.email,
          contact: userDetails.phoneNumber,
        },
        notes: {
          userId: currentUser.uid,
          type: "interview",
        },
        theme: {
          color: "#3399cc",
        },
      };

      // Initialize payment
      await initiatePayment(
        options,
        async (response) => {
          // Payment success handler
          try {
            await saveMockInterviewBooking(
              currentUser.uid,
              userDetails, // Pass complete user details object
              response.razorpay_payment_id,
              39900
            );

            // Reload bookings
            const interviews = await getUserBookedInterviews(currentUser.uid);
            setBookedInterviews(interviews);

            alert(
              "Interview booking successful! You will be contacted within 12 hours to confirm the appointment."
            );
          } catch (error) {
            console.error("Error processing interview booking", error);
            alert(
              "Your payment was successful, but we had trouble processing your booking. Please contact support."
            );
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          // Payment failure handler
          console.error("Payment failed", error);
          alert(
            "Payment failed: " + (error.error?.description || "Unknown error")
          );
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Error initializing payment", error);
      alert("Error initializing payment. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle phone number submission
  const handlePhoneSubmit = (e) => {
    e.preventDefault();

    // Validate phone number (10 digits)
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    // Close the phone prompt modal
    setShowPhonePrompt(false);

    // Handle different purchase types
    if (currentPurchaseItem) {
      if (currentPurchaseItem.type === "interview") {
        proceedWithInterviewBooking(phoneNumber);
      } else if (currentPurchaseItem.type === "test") {
        // Continue with test purchase using the collected phone number
        handleTestPurchaseWithPhone(currentPurchaseItem.id, phoneNumber);
      }
    }
  };

  // New function to handle test purchase after collecting phone
  const handleTestPurchaseWithPhone = async (testId, phone) => {
    const testConfig = testConfigs[testId];
    if (!testConfig) return;

    // Directly use the numeric price
    const priceValue = (testConfig.price || 0) * 100; // Convert to paise

    try {
      // Show loading state
      setIsLoading(true);

      // Create user details object
      const userDetails = {
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        phoneNumber: phone,
      };

      // Create order options for Razorpay
      const options = {
        amount: priceValue,
        currency: "INR",
        name: "Vector NSET",
        description: `Purchase: ${testConfig.testName}`,
        image: "https://your-logo-url.com/logo.png", // Replace with your logo URL
        prefill: {
          name: userDetails.displayName,
          email: userDetails.email,
          contact: userDetails.phoneNumber,
        },
        notes: {
          testId: testId,
          userId: currentUser.uid,
          type: "test",
        },
        theme: {
          color: "#3399cc",
        },
      };

      // Initialize payment
      await initiatePayment(
        options,
        async (response) => {
          // Payment success handler
          try {
            await saveTestPurchase(
              currentUser.uid,
              testId,
              testConfig.testName,
              response.razorpay_payment_id,
              priceValue,
              userDetails // Pass user details to the function
            );

            // Reload purchases
            const tests = await getUserPurchasedTests(currentUser.uid);
            setPurchasedTests(tests);

            alert("Purchase successful! You can now access the test.");
          } catch (error) {
            console.error("Error processing purchase", error);
            alert(
              "Your payment was successful, but we had trouble updating your account. Please contact support."
            );
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          // Payment failure handler
          console.error("Payment failed", error);
          alert(
            "Payment failed: " + (error.error?.description || "Unknown error")
          );
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Error initializing payment", error);
      alert("Error initializing payment. Please try again.");
      setIsLoading(false);
    }
  };

  // Update the check for whether bookings are enabled
  const bookingsEnabled = appSettings.interviewBookingsEnabled === true;

  // Show Firestore error component only if connection fails completely and it's not retrying
  if (!firestoreConnected && !isRetrying && !userProfile) {
    return <FirestoreError onRetry={handleRetry} />;
  }

  // Replace your existing rendering logic for the booking button with this simpler version
  const showBookingButton = appSettings.interviewBookingsEnabled !== false;

  const copyInterviewCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setInterviewCodeCopied(true);
      setTimeout(() => setInterviewCodeCopied(false), 2000);
    });
  };

  const InterviewCodeTooltip = () => {
    if (!interviewCodeCopied || !interviewCodeRef.current) return null;

    const rect = interviewCodeRef.current.getBoundingClientRect();

    const style = {
      position: "fixed",
      top: `${rect.bottom + 8}px`,
      left: `${rect.left + rect.width / 2}px`,
      transform: "translateX(-50%)",
      backgroundColor: "#1F2937",
      color: "white",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "0.75rem",
      fontWeight: "500",
      zIndex: 9999,
      whiteSpace: "nowrap",
    };

    return ReactDOM.createPortal(
      <div style={style}>Copied!</div>,
      document.body
    );
  };

  const toggleResourcePopup = (topic) => {
    if (openResourceTopic === topic) {
      setOpenResourceTopic(null);
    } else {
      setOpenResourceTopic(topic);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header/Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left side with menu icon and logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="flex items-center">
                <Link to="/">
                  <img src={Logo} alt="Logo" className="h-10" />
                </Link>
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <img src={Name} alt="Vector" className="h-20" />
                </Link>
              </div>
            </div>

            {/* Empty div to maintain flex spacing */}
            <div className="flex-1"></div>

            {/* Profile on right */}
            <div className="relative">
              <button
                onClick={toggleProfile}
                className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {currentUser?.displayName?.charAt(0) || "U"}
                </div>
                <span className="ml-2 text-gray-700 hidden sm:inline">
                  {currentUser?.displayName || "User"}
                </span>
                <svg
                  className="ml-1 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-xl bg-white ring-1 ring-gray-200 focus:outline-none z-10 overflow-hidden">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser?.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {currentUser?.email || ""}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-3 py-2.5 mt-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md group transition-colors duration-150"
                    >
                      <svg
                        className="mr-2 h-5 w-5 text-red-500 group-hover:text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu - appears when menu icon is clicked */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Completely transparent overlay - just for click handling */}
          <div
            className="fixed inset-0 bg-transparent"
            onClick={toggleMenu}
            aria-hidden="true"
          ></div>

          {/* Menu panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="p-4 flex items-center justify-between">
              <span className="text-xl font-bold text-blue-600">Menu</span>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <nav className="py-4">
                <div className="px-2 space-y-1">
                  <Link
                    to="/"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-600"
                  >
                    Home
                  </Link>
                  <button
                    onClick={toggleSyllabus}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-600"
                  >
                    Syllabus
                  </button>
                  {/* Additional menu items can be added here later */}
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Phone number prompt modal */}
      {showPhonePrompt && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Enter Your Phone Number
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              We need your phone number to contact you for scheduling the
              interview.
            </p>
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 10-digit number"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPhonePrompt(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome section - only visible on home page */}
          {!showSyllabus && (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {currentUser?.displayName || "Student"}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Your one-stop platform for NSET preparation. Access mock
                  tests, study resources, and more.
                </p>
              </div>
            </div>
          )}

          {/* Syllabus section - only visible when toggled */}
          {showSyllabus ? (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  NSET Exam Syllabus
                </h2>

                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  {/* Logical Reasoning section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-blue-700 mb-3">
                      Logical Reasoning
                    </h3>
                    <p className="text-gray-700 mb-4">
                      The Logical Reasoning section has questions that will test
                      your ability to read and analyse visual representations of
                      data. It will also test your ability to think logically.
                      You may also need to structure data that appears
                      unstructured. This section requires the candidate to have
                      sound skills in logical reasoning and data representation.
                    </p>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Topics covered:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Series, Blood Relations, & Family Tree</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Simple & Compound Interest</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Direction Sense</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Puzzles</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Seating Arrangement</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Venn Diagram</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Data Sufficiency</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Pie Charts</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Bar and Line Graphs</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Coding-Decoding</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Sets and Caselets</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Clocks and Calendars</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Syllogism</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Percentages</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Profit and Loss</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Speed, Time and Distance</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Work and Time</span>
                      </div>
                    </div>
                  </div>

                  {/* Mathematics section */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-3">
                      Mathematics
                    </h3>
                    <p className="text-gray-700 mb-4">
                      The mathematics section evaluates the candidate's
                      knowledge and problem-solving skills. It gauges their
                      quantitative aptitude and ability to apply mathematical
                      concepts to solve problems.
                    </p>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Topics covered:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 text-blue-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-700">Number Theory</span>
                        </div>
                        <button
                          onClick={() => toggleResourcePopup("Number Theory")}
                          className="ml-2 inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full transition-colors duration-150"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            />
                          </svg>
                          Resources
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 text-blue-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-700">Exponentials and Logarithms</span>
                        </div>
                        <button
                          onClick={() => toggleResourcePopup("Exponentials and Logarithms")}
                          className="ml-2 inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full transition-colors duration-150"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            />
                          </svg>
                          Resources
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 text-blue-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-700">Probability and Statistics</span>
                        </div>
                        <button
                          onClick={() => toggleResourcePopup("Probability and Statistics")}
                          className="ml-2 inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full transition-colors duration-150"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            />
                          </svg>
                          Resources
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 text-blue-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-700">Permutation and Combinations</span>
                        </div>
                        <button
                          onClick={() => toggleResourcePopup("Permutation and Combinations")}
                          className="ml-2 inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full transition-colors duration-150"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            />
                          </svg>
                          Resources
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 text-blue-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-700">Ratio and Proportion</span>
                        </div>
                        <button
                          onClick={() => toggleResourcePopup("Ratio and Proportion")}
                          className="ml-2 inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full transition-colors duration-150"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            />
                          </svg>
                          Resources
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 text-blue-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-700">Sets (Venn Diagrams)</span>
                        </div>
                        <button
                          onClick={() => toggleResourcePopup("Sets (Venn Diagrams)")}
                          className="ml-2 inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full transition-colors duration-150"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            />
                          </svg>
                          Resources
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Dashboard grid - only visible when syllabus is not shown */
            <>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden shadow rounded-lg mb-6 text-white">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">
                        Book Your Scaler NSET Exam
                      </h3>
                      <ul className="mt-2 space-y-1">
                        <li className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-300 mr-2 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-white">
                            Register for the official Scaler NSET exam
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-300 mr-2 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-white">
                            Get 50% discount on registration fee using our
                            referral code
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-300 mr-2 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-white">
                            Secure your spot for the next NSET intake
                          </span>
                        </li>
                      </ul>
                      <div className="mt-4 bg-white/10 p-3 rounded-md">
                        <p className="text-sm text-white">
                          Use the
                          <button
                            ref={interviewCodeRef}
                            onClick={copyInterviewCode}
                            className="font-bold bg-white/20 px-2 py-0.5 rounded mx-1 hover:bg-white/30 transition-colors cursor-pointer flex items-center inline-flex"
                          >
                            {referralCode}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          referral code during registration for a{" "}
                          <span className="font-bold underline">
                            50% discount
                          </span>{" "}
                          on the registration fee!
                        </p>
                      </div>
                    </div>
                    <div>
                      <a
                        href="https://www.scaler.com/school-of-technology/application/?rce=4dd65cf3cf67&rcy=1&utm_source=SST_student_referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-indigo-700 transition-all duration-200"
                      >
                        Book NSET Exam
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              {/* Mock Interview Section */}

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Interview Preparation
                    </h2>
                    <button
                      onClick={loadAppSettings}
                      className="text-xs text-gray-500 flex items-center"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <span>Refreshing...</span>
                      ) : (
                        <>
                          <svg
                            className="h-3 w-3 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>

                  {/* Interview Content */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-800">
                        1:1 Mock Interview Session
                      </h3>
                      <ul className="mt-2 space-y-1">
                        <li className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-600">
                            Practice with real SST students who have
                            successfully cleared the NSET exam
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-600">
                            Get personalized feedback on your interview
                            performance
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-600">
                            Improve your interview skills and confidence
                          </span>
                        </li>
                      </ul>

                      {/* Special Offer Box - NEW */}
                      <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 p-3 border border-green-200 rounded-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-bold text-green-800">
                              🔥 LIMITED TIME OFFER 🔥
                            </h4>
                            <p className="mt-1 text-sm text-green-700">
                              Get <span className="font-bold">100% REFUND</span>{" "}
                              on your mock interview if you have used my
                              referral code
                              <button
                                ref={interviewCodeRef}
                                onClick={copyInterviewCode}
                                className="font-bold bg-white text-green-700 px-1.5 py-0.5 rounded mx-1 hover:bg-green-100 transition-colors cursor-pointer flex items-center inline-flex"
                              >
                                {referralCode}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 ml-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                              to register for NSET!
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          30 min
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          With SST Students
                        </span>
                      </div>

                      {/* Message when bookings are disabled */}
                      {!bookingsEnabled &&
                        appSettings.interviewBookingsMessage && (
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-sm text-amber-800">
                              <span className="flex items-center">
                                <svg
                                  className="h-4 w-4 text-amber-600 mr-1.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {appSettings.interviewBookingsMessage ||
                                  "Due to high demand, interview bookings are temporarily disabled."}
                              </span>
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="flex items-center mb-1">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹399
                        </span>
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Refundable!
                        </span>
                      </div>
                      <p className="text-s text-gray-600 mb-2 line-through">
                        ₹599
                      </p>
                      {showBookingButton ? (
                        <button
                          onClick={handleBookInterview}
                          className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Book Now
                        </button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-gray-400 bg-gray-200 cursor-not-allowed"
                        >
                          Temporarily Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Add this new section above the Test Series section */}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Resources/Test Series section */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Test Series & Resources
                    </h2>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {/* Test Series */}
                      {Object.keys(testConfigs).map((testId) => {
                        const test = testConfigs[testId];
                        // Check if test is already purchased
                        const isPurchased = purchasedTests.some(
                          (pt) => pt.testId === testId
                        );

                        return (
                          <div
                            key={testId}
                            className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4"
                          >
                            <div>
                              <h3 className="text-md font-medium text-gray-900">
                                {test.testName}
                              </h3>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                  {test.testDuration} min
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {test.totalQuestions} Questions
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-md font-medium text-gray-900">
                                <span className="line-through">₹169</span><span> </span>
                                {test.isFree ? (
                                  "Free"
                                ) : (
                                  <> {formatPrice(test.price)}</>
                                )}
                              </span>
                              {isPurchased || test.isFree ? (
                                <button
                                  onClick={() => handleStartTest(testId)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Start Test
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePurchase(testId)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Purchase
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Purchased/Events section */}
                <div className="space-y-6">
                  {/* Purchased Tests */}
                  {/* <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Your Purchased Tests</h2>
                      
                      <div className="max-h-[30vh] overflow-y-auto pr-2">
                        {purchasedTests.length > 0 ? (
                          <div className="space-y-4">
                            {purchasedTests.map((test) => (
                              <div key={test.id} className="border rounded-lg p-4 flex justify-between items-center">
                                <div>
                                  <h3 className="text-md font-medium text-gray-900">{test.testName}</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Purchased on {test.purchaseDate?.toDate?.() 
                                      ? new Date(test.purchaseDate.toDate()).toLocaleDateString() 
                                      : 'Recent'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleStartTest(test.testId)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Start Test
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">You haven't purchased any tests yet.</p>
                            <p className="mt-2 text-sm text-gray-500">
                              Check out our test series and purchase one to start your preparation.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div> */}

                  {/* Booked Interviews */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Your Mock Interviews
                      </h2>

                      <div className="max-h-[30vh] overflow-y-auto pr-2">
                        {bookedInterviews.length > 0 ? (
                          <div className="space-y-4 py-4">
                            {bookedInterviews.map((interview) => (
                              <div
                                key={interview.id}
                                className="border rounded-lg p-4"
                              >
                                <h3 className="text-md font-medium text-gray-900">
                                  Mock Interview Session
                                </h3>
                                <div className="mt-2">
                                  {/* Status badge with appropriate colors */}
                                  <div className="flex items-center">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        interview.status === "confirmed"
                                          ? "bg-green-100 text-green-800"
                                          : interview.status === "completed"
                                          ? "bg-blue-100 text-blue-800"
                                          : interview.status === "cancelled"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {interview.status === "confirmed"
                                        ? "Confirmed"
                                        : interview.status === "completed"
                                        ? "Completed"
                                        : interview.status === "cancelled"
                                        ? "Cancelled"
                                        : "Pending Confirmation"}
                                    </span>
                                  </div>

                                  {/* Booking date info */}
                                  <p className="mt-2 text-sm text-gray-500">
                                    Booked on{" "}
                                    {interview.bookingDate?.toDate?.()
                                      ? new Date(
                                          interview.bookingDate.toDate()
                                        ).toLocaleDateString()
                                      : "Recent"}
                                  </p>

                                  {/* Show scheduled date if available */}
                                  {interview.scheduledDate &&
                                    interview.status !== "cancelled" && (
                                      <p className="mt-2 text-sm font-medium text-gray-900">
                                        {interview.status === "completed"
                                          ? "Completed on: "
                                          : "Scheduled for: "}
                                        {new Date(
                                          interview.scheduledDate.toDate()
                                        ).toLocaleString()}
                                      </p>
                                    )}

                                  {/* Show Google Meet link if status is confirmed (not for completed or cancelled) */}
                                  {interview.status === "confirmed" &&
                                    interview.meetLink && (
                                      <div className="mt-3 bg-blue-50 p-3 rounded-md">
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                          Google Meet Link:
                                        </p>
                                        <a
                                          href={interview.meetLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                          </svg>
                                          Join Google Meet
                                        </a>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Click to join the meeting at the
                                          scheduled time
                                        </p>
                                      </div>
                                    )}

                                  {/* Status-specific messages */}
                                  {interview.status === "pending" &&
                                    !interview.scheduledDate && (
                                      <p className="mt-2 text-sm text-gray-500">
                                        You will be contacted within 12 hours to
                                        schedule your interview.
                                      </p>
                                    )}

                                  {interview.status === "completed" && (
                                    <p className="mt-2 text-sm text-gray-600">
                                      Thank you for participating in the mock
                                      interview. We hope it was helpful for your
                                      preparation!
                                    </p>
                                  )}

                                  {interview.status === "cancelled" && (
                                    <p className="mt-2 text-sm text-gray-600">
                                      This interview booking has been cancelled.
                                      If you have any questions, please contact
                                      us.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">
                              You haven't booked any mock interviews yet.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                              Book a mock interview to practice for the actual
                              NSET interview.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* No footer as requested */}
      <div className="mt-8 text-right">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {debugMode ? "Hide Debug Info" : "Show Debug Info"}
        </button>

        {debugMode && (
          <div className="mt-2 p-4 border border-gray-200 rounded bg-gray-50 text-left">
            <h3 className="text-lg font-medium text-gray-900">
              Debug Information
            </h3>
            <div className="mt-2 space-y-2">
              <p className="text-sm">
                <strong>Raw interviewBookingsEnabled:</strong>{" "}
                {String(appSettings.interviewBookingsEnabled)}
              </p>
              <p className="text-sm">
                <strong>Type:</strong>{" "}
                {typeof appSettings.interviewBookingsEnabled}
              </p>
              <p className="text-sm">
                <strong>bookingStatusString:</strong>{" "}
                {appSettings.bookingStatusString || "Not set"}
              </p>
              <p className="text-sm">
                <strong>Is disabled (===false):</strong>{" "}
                {appSettings.interviewBookingsEnabled === false
                  ? "true"
                  : "false"}
              </p>
              <p className="text-sm">
                <strong>Is disabled (string check):</strong>{" "}
                {appSettings.bookingStatusString === "DISABLED"
                  ? "true"
                  : "false"}
              </p>
              <p className="text-sm">
                <strong>Message:</strong> "
                {appSettings.interviewBookingsMessage}"
              </p>
              <p className="text-sm">
                <strong>Last updated:</strong>{" "}
                {appSettings.lastUpdated?.toLocaleString?.() || "Unknown"}
              </p>
              <button
                onClick={loadAppSettings}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                Refresh Settings
              </button>
            </div>
          </div>
        )}
      </div>
      <InterviewCodeTooltip />
      {Object.keys(topicResources).map(topic => (
        <ResourcePopup
          key={topic}
          topic={topic}
          resources={topicResources[topic]}
          isOpen={openResourceTopic === topic}
          onClose={() => setOpenResourceTopic(null)}
        />
      ))}
    </div>
  );
};

const ResourcePopup = ({ topic, resources, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  // Reference for detecting clicks outside the popup
  const popupRef = useRef(null);
  
  // Close if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div 
        ref={popupRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 pointer-events-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{topic} Resources</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3">
          {resources.length > 0 ? (
            resources.map((resource, index) => (
              <a 
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
              >
                {resource.icon}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                </div>
              </a>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No resources available yet. Check back later!</p>
          )}
        </div>
        
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
