import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useSST } from "../context/SSTBotContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import Name from "../assets/images/Name.png";
import Logo from "../assets/images/Logo.png";
import { testConfigs, TEST_IDS } from "../data/testConfig";
import FirestoreError from "./FirestoreError";
import TestHistory from "./TestHistory";
import { getAppSettings } from "../services/settingsService";
import {
  getUserPurchasedTests,
  getUserBookedInterviews,
  saveTestPurchase,
  saveMockInterviewBooking,
} from "../services/purchaseService";
import { initiatePayment } from "../utils/razorpay";
import { formatPrice } from "../data/testConfig";

const Dashboard = () => {
  const {
    currentUser,
    userProfile,
    logout,
    firestoreConnected,
    getUserProfile,
    needsPhoneNumber,
    updatePhoneNumber
  } = useAuth();

  const { toggleBot } = useSST();
  const { theme } = useTheme();
  
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
  const [interviewCodeCopied, setInterviewCodeCopied] = useState(false);
  const interviewCodeRef = useRef(null);
  const referralCode = "SHAUE061";
  const [openResourceTopic, setOpenResourceTopic] = useState(null);
  const [showTestHistory, setShowTestHistory] = useState(false);

  // Define topic resources
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
    setShowTestHistory(false); // Turn off test history when toggling syllabus
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

  // Check if we need to prompt for phone number when component mounts or when needsPhoneNumber changes
  useEffect(() => {
    if (needsPhoneNumber || (userProfile && userProfile.needsPhoneNumber)) {
      setShowPhonePrompt(true);
      // No need to set currentPurchaseItem since we're just collecting the phone
    }
  }, [needsPhoneNumber, userProfile]);

  // Handle phone number submission - updated to save phone to user profile
  const handlePhoneSubmit = (e) => {
    e.preventDefault();

    // Validate phone number (10 digits)
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    // Always update the user's phone number in their profile
    if (currentUser) {
      updatePhoneNumber(currentUser.uid, phoneNumber)
        .then(success => {
          if (!success) {
            console.warn("Failed to update phone number in profile");
          }
        })
        .catch(err => {
          console.error("Error updating phone number:", err);
        });
    }

    // Close the phone prompt modal
    setShowPhonePrompt(false);

    // Handle different purchase types if this was triggered by a purchase
    if (currentPurchaseItem) {
      if (currentPurchaseItem.type === "interview") {
        proceedWithInterviewBooking(phoneNumber);
      } else if (currentPurchaseItem.type === "test") {
        // Continue with test purchase using the collected phone number
        handleTestPurchaseWithPhone(currentPurchaseItem.id, phoneNumber);
      }
    }
    
    // Clear the current purchase item if it was just for phone collection
    setCurrentPurchaseItem(null);
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

  // Toggle test history popup
  const toggleTestHistory = () => {
    setShowTestHistory(!showTestHistory);
    setShowSyllabus(false); // Turn off syllabus when toggling test history
    setMenuOpen(false);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Simplified Header/Navbar */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 shadow-md' : 'bg-white shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left side with menu icon and logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMenu}
                className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-blue-600'} focus:outline-none`}
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
                  <div className={`${theme === 'dark' ? 'logo-dark-filter' : ''}`}>
                    <img src={Logo} alt="Logo" className="h-10" />
                  </div>
                </Link>
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <div className={`${theme === 'dark' ? 'logo-name-dark-filter' : ''}`}>
                    <img src={Name} alt="Vector" className="h-20" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Empty div to maintain flex spacing */}
            <div className="flex-1"></div>

            {/* Theme toggle and profile on right */}
            <div className="flex items-center space-x-4">
              <ThemeToggle className={theme === 'dark' ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-blue-600'} />
              
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className={`max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {currentUser?.displayName?.charAt(0) || "U"}
                  </div>
                  <span className={`ml-2 hidden sm:inline ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentUser?.displayName || "User"}
                  </span>
                  <svg
                    className={`ml-1 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
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
                  <div className={`origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-xl ${theme === 'dark' ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} ring-1 focus:outline-none z-10 overflow-hidden`}>
                    <div className="p-2">
                      <div className={`px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {currentUser?.displayName || "User"}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                          {currentUser?.email || ""}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className={`flex w-full items-center px-3 py-2.5 mt-1 text-sm font-medium text-red-600 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-red-50'} rounded-md group transition-colors duration-150`}
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
          <div className={`relative flex-1 flex flex-col max-w-xs w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-xl transform transition-transform duration-300 ease-in-out`}>
            <div className={`p-4 flex items-center justify-between ${theme === 'dark' ? 'border-b border-gray-700' : ''}`}>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Menu</span>
              <button
                onClick={toggleMenu}
                className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-blue-600'} focus:outline-none`}
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
                    className={`block px-3 py-2 rounded-md text-base font-medium ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700 hover:text-white' : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'}`}
                  >
                    Home
                  </Link>
                  <button
                    onClick={toggleSyllabus}
                    className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700 hover:text-white' : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'}`}
                  >
                    Syllabus
                  </button>
                  <button
                    onClick={toggleTestHistory}
                    className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700 hover:text-white' : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'}`}
                  >
                    Test History
                  </button>
                  <button
                    onClick={toggleBot}
                    className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700 hover:text-white' : 'text-gray-900 hover:bg-gray-100 hover:text-blue-600'}`}
                  >
                    <div className="flex items-center">
                      SST AI Bot
                      <span className={`ml-2 px-1.5 py-0.5 ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} text-xs font-medium rounded`}>New</span>
                    </div>
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
              {currentPurchaseItem ? "Enter Your Phone Number" : "Complete Your Profile"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {currentPurchaseItem 
                ? "We need your phone number to contact you for scheduling the interview." 
                : "Please provide your phone number to complete your profile. This helps us provide better support and updates about your tests and interview sessions."}
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
                  {currentPurchaseItem ? "Cancel" : "Later"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {currentPurchaseItem ? "Continue" : "Save"}
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
      <main className={`py-10 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome section - only visible on home page */}
          {!showSyllabus && !showTestHistory && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow rounded-lg mb-6`}>
              <div className="px-4 py-5 sm:p-6">
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Welcome, {currentUser?.displayName || "Student"}
                </h1>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Your one-stop platform for NSET preparation. Access mock
                  tests, study resources, and more.
                </p>
              </div>
            </div>
          )}

          {/* Syllabus section - only visible when toggled */}
          {showSyllabus ? (
            <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} overflow-hidden shadow rounded-lg mb-6`}>
              <div className="px-4 py-5 sm:p-6">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                  NSET Exam Syllabus
                </h2>

                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  {/* Logical Reasoning section */}
                  <div className="mb-8">
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'} mb-3`}>
                      Logical Reasoning
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                      The Logical Reasoning section has questions that will test
                      your ability to read and analyse visual representations of
                      data. It will also test your ability to think logically.
                      You may also need to structure data that appears
                      unstructured. This section requires the candidate to have
                      sound skills in logical reasoning and data representation.
                    </p>
                    <h4 className={`text-md font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'} mb-2`}>
                      Topics covered:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Direction sense</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Series, Blood Relations, & Family Tree</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Simple & Compound Interest</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Puzzles</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Seating Arrangement</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Venn Diagram</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Data Sufficiency</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Pie Charts</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Bar and Line Graphs</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Coding-Decoding</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Sets and Caselets</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Clocks and Calendars</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Syllogism</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Percentages</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Profit and Loss</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Speed, Time and Distance</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                        <span className={theme === 'dark' ? 'text-gray-300' : ''}>Work and Time</span>
                      </div>
                    </div>
                  </div>

                  {/* Mathematics section */}
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'} mb-3`}>
                      Mathematics
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                      The mathematics section evaluates the candidate's
                      knowledge and problem-solving skills. It gauges their
                      quantitative aptitude and ability to apply mathematical
                      concepts to solve problems.
                    </p>
                    <h4 className={`text-md font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'} mb-2`}>
                      Topics covered:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Number Theory</span>
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
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Exponentials and Logarithms</span>
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
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Probability and Statistics</span>
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
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Permutation and Combinations</span>
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
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Ratio and Proportion</span>
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
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} mr-2`}
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
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Sets (Venn Diagrams)</span>
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
          ) : showTestHistory ? (
            <TestHistory />
          ) : (
            // ... existing dashboard content (test series, etc.) ...
            // Keep all the existing dashboard content here
            <>
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-gradient-to-r from-blue-600 to-indigo-700'} overflow-hidden shadow rounded-lg mb-6 text-white`}>
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
                            Use our special referral code for 50% OFF on
                            registration fee
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
                            Pay only ₹500 instead of ₹1000
                          </span>
                        </li>
                      </ul>

                      <div className="mt-3 flex items-center">
                        <div className={`py-1 px-2 ${theme === 'dark' ? 'bg-blue-800' : 'bg-blue-500'} rounded mr-2`}>
                          <p className="text-xs font-bold text-white">
                            SHAUE061
                          </p>
                        </div>
                        <span className="text-xs text-blue-100">
                          Use this referral code at checkout
                        </span>
                      </div>
                    </div>

                    <div>
                      <a
                        href="https://www.scaler.com/school-of-technology/application/?rce=4dd65cf3cf67&rcy=1&utm_source=SST_student_referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${theme === 'dark' ? 'text-indigo-900 bg-gray-100 hover:bg-white' : 'text-indigo-700 bg-white hover:bg-indigo-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-indigo-700 transition-all duration-200`}
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

              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} overflow-hidden shadow rounded-lg mb-6`}>
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Interview Preparation
                    </h2>
                    <button
                      onClick={loadAppSettings}
                      className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} flex items-center`}
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
                      <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>
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
                          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
                          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
                          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Improve your interview skills and confidence
                          </span>
                        </li>
                      </ul>

                      {/* Special Offer Box - NEW */}
                      <div className={`mt-4 ${theme === 'dark' ? 'bg-gray-700 border-green-900' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'} p-3 border rounded-md`}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg
                              className={`h-5 w-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`}
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
                            <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-800'}`}>
                              🔥 LIMITED TIME OFFER 🔥
                            </h4>
                            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                              Get <span className="font-bold">100% REFUND</span>{" "}
                              on your mock interview if you have used my
                              referral code
                              <button
                                ref={interviewCodeRef}
                                onClick={copyInterviewCode}
                                className={`font-bold ${theme === 'dark' ? 'bg-gray-800 text-green-400' : 'bg-white text-green-700'} px-1.5 py-0.5 rounded mx-1 hover:bg-green-100 transition-colors cursor-pointer flex items-center inline-flex`}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} mr-2`}>
                          30 min
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
                          With SST Students
                        </span>
                      </div>

                      {/* Message when bookings are disabled */}
                      {!bookingsEnabled &&
                        appSettings.interviewBookingsMessage && (
                          <div className={`mt-3 p-2 ${theme === 'dark' ? 'bg-yellow-900 border-yellow-800' : 'bg-amber-50 border-amber-200'} border rounded-md`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-amber-800'}`}>
                              <span className="flex items-center">
                                <svg
                                  className={`h-4 w-4 ${theme === 'dark' ? 'text-yellow-500' : 'text-amber-600'} mr-1.5`}
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
                        <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹399
                        </span>
                        <span className={`ml-2 px-2 py-0.5 ${theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'} text-xs font-medium rounded-full`}>
                          Refundable!
                        </span>
                      </div>
                      <p className={`text-s ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2 line-through`}>
                        ₹599
                      </p>
                      {showBookingButton ? (
                        <button
                          onClick={handleBookInterview}
                          className={`inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          Book Now
                        </button>
                      ) : (
                        <button
                          disabled
                          className={`inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm ${theme === 'dark' ? 'text-gray-500 bg-gray-700' : 'text-gray-400 bg-gray-200'} cursor-not-allowed`}
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
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow rounded-lg`}>
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
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
                            className={`border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4`}
                          >
                            <div>
                              <h3 className={`text-md font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {test.testName}
                              </h3>
                              <div className={`mt-1 flex items-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} mr-2`}>
                                  {test.testDuration} min
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                                  {test.totalQuestions} Questions
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-md font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                <span className={`line-through ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>₹169</span><span> </span>
                                {test.isFree ? (
                                  "Free"
                                ) : (
                                  <> {formatPrice(test.price)}</>
                                )}
                              </span>
                              {isPurchased || test.isFree ? (
                                <button
                                  onClick={() => handleStartTest(testId)}
                                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${theme === 'dark' ? 'focus:ring-offset-gray-800' : ''}`}
                                >
                                  Start Test
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePurchase(testId)}
                                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${theme === 'dark' ? 'focus:ring-offset-gray-800' : ''}`}
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
                  <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow rounded-lg`}>
                    <div className="px-4 py-5 sm:p-6">
                      <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                        Your Mock Interviews
                      </h2>

                      <div className="max-h-[30vh] overflow-y-auto pr-2">
                        {bookedInterviews.length > 0 ? (
                          <div className="space-y-4 py-4">
                            {bookedInterviews.map((interview) => (
                              <div
                                key={interview.id}
                                className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}
                              >
                                <h3 className={`text-md font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  Mock Interview Session
                                </h3>
                                <div className="mt-2">
                                  {/* Status badge with appropriate colors */}
                                  <div className="flex items-center">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        interview.status === "confirmed"
                                          ? theme === 'dark' ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                                          : interview.status === "completed"
                                          ? theme === 'dark' ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-800"
                                          : interview.status === "cancelled"
                                          ? theme === 'dark' ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"
                                          : theme === 'dark' ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800"
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
                                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
                                      <p className={`mt-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
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
                                      <div className={`mt-3 ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'} p-3 rounded-md`}>
                                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'} mb-1`}>
                                          Google Meet Link:
                                        </p>
                                        <a
                                          href={interview.meetLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`text-sm ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} flex items-center`}
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
                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                          Click to join the meeting at the
                                          scheduled time
                                        </p>
                                      </div>
                                    )}

                                  {/* Status-specific messages */}
                                  {interview.status === "pending" &&
                                    !interview.scheduledDate && (
                                      <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        You will be contacted within 12 hours to
                                        schedule your interview.
                                      </p>
                                    )}

                                  {interview.status === "completed" && (
                                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Thank you for participating in the mock
                                      interview. We hope it was helpful for your
                                      preparation!
                                    </p>
                                  )}

                                  {interview.status === "cancelled" && (
                                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
                          <div className={`text-center py-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              You haven't booked any mock interviews yet.
                            </p>
                            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
      <div className={`mt-8 text-center text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
        &copy; {new Date().getFullYear()} Vector. All rights reserved.
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
      
      {/* CSS for logo filters in dark mode */}
      <style jsx="true">{`
        .logo-dark-filter {
          filter: invert(0.8) sepia(0.5) hue-rotate(5deg) saturate(5) brightness(1.2);
          /* Creates a warm sunlight effect by inverting, adding sepia, slight hue-rotation to orange */
        }
        
        .logo-name-dark-filter {
          filter: invert(0.8) sepia(0.6) hue-rotate(325deg) saturate(4) brightness(1.4) drop-shadow(0 0 5px rgba(255, 165, 0, 0.7));
          /* Creates golden sun glow effect with orange drop shadow */
        }
      `}</style>
    </div>
  );
};

const ResourcePopup = ({ topic, resources, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  // Reference for detecting clicks outside the popup
  const popupRef = useRef(null);
  const { theme } = useTheme();
  
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
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-md p-4 pointer-events-auto`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{topic} Resources</h3>
          <button 
            onClick={onClose}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
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
                className={`flex items-center p-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-md transition-colors`}
              >
                {resource.icon}
                <div className="ml-3">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{resource.title}</p>
                </div>
              </a>
            ))
          ) : (
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No resources available yet. Check back later!</p>
          )}
        </div>
        
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md text-sm`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
