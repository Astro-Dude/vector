import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { sendEmail } from './emailService';

// Save test purchase to Firestore with user details
export const saveTestPurchase = async (userId, testId, testName, paymentId, amount, userDetails) => {
  try {
    console.log(`Saving purchase for user ${userId}`);
    
    // First check if user document exists and create if needed
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log("Creating user document");
      await setDoc(userDocRef, {
        createdAt: serverTimestamp(),
        ...userDetails, // Save user details to the user document as well
      });
    }
    
    // Add to user's purchases collection
    const purchaseRef = collection(db, `users/${userId}/purchases`);
    
    const purchaseData = {
      testId,
      testName,
      purchaseDate: serverTimestamp(),
      paymentId,
      amount,
      type: 'test',
      status: 'active',
      userDetails: {
        name: userDetails.displayName || 'Unknown',
        email: userDetails.email || 'Unknown',
        phone: userDetails.phoneNumber || 'Not provided'
      }
    };
    
    console.log("Saving purchase with data:", purchaseData);
    const docRef = await addDoc(purchaseRef, purchaseData);
    console.log("Purchase saved with ID:", docRef.id);
    
    return true;
  } catch (error) {
    console.error("Error saving test purchase:", error);
    throw error;
  }
};

// Get user's purchased tests - with better error handling
export const getUserPurchasedTests = async (userId) => {
  try {
    console.log(`Fetching purchased tests for user ${userId}`);
    
    // Check if the user document exists
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log("User document doesn't exist, returning empty array");
      return [];
    }
    
    const purchaseRef = collection(db, `users/${userId}/purchases`);
    const q = query(purchaseRef, where("type", "==", "test"));
    const querySnapshot = await getDocs(q);
    
    const tests = [];
    querySnapshot.forEach((doc) => {
      tests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${tests.length} purchased tests`);
    return tests;
  } catch (error) {
    console.error("Error getting purchased tests:", error);
    if (error.code === 'permission-denied') {
      console.error("Permission denied. Check your Firebase rules.");
    }
    return [];
  }
};

// Save mock interview booking with user details
export const saveMockInterviewBooking = async (userId, userDetails, paymentId, amount) => {
  try {
    // Create unique booking ID
    const bookingId = `booking_${Date.now()}`;
    
    // Add to user's purchases collection
    const purchaseRef = doc(db, `users/${userId}/purchases`, bookingId);
    
    await setDoc(purchaseRef, {
      type: 'interview',
      bookingDate: serverTimestamp(),
      paymentId,
      amount,
      status: 'pending',
      userDetails: {
        name: userDetails.displayName || 'Unknown',
        email: userDetails.email || 'Unknown',
        phone: userDetails.phoneNumber || 'Not provided'
      }
    });
    
    // Send email to admin
    await sendEmail({
      to: 'vector.scalernset@gmail.com',
      subject: 'New Mock Interview Booking',
      html: `
        <h2>New Mock Interview Booking</h2>
        <p><strong>User:</strong> ${userDetails.displayName}</p>
        <p><strong>Email:</strong> ${userDetails.email}</p>
        <p><strong>Phone:</strong> ${userDetails.phoneNumber || 'Not provided'}</p>
        <p><strong>Payment ID:</strong> ${paymentId}</p>
        <p><strong>Amount:</strong> ₹${amount/100}</p>
      `
    });
    
    // Send confirmation to user
    await sendEmail({
      to: userDetails.email,
      subject: 'Mock Interview Booking Confirmation',
      html: `
        <h2>Thank you for booking a mock interview!</h2>
        <p>Hello ${userDetails.displayName},</p>
        <p>Your mock interview booking has been received.</p>
        <p>Our team will contact you within 12 hours to confirm the date and time for your interview session.</p>
        <p>Booking details:</p>
        <ul>
          <li>Booking ID: ${bookingId}</li>
          <li>Payment ID: ${paymentId}</li>
          <li>Amount: ₹${amount/100}</li>
        </ul>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Vector NSET Team</p>
      `
    });
    
    return bookingId;
  } catch (error) {
    console.error("Error saving interview booking:", error);
    throw error;
  }
};

// Get user's booked interviews
export const getUserBookedInterviews = async (userId) => {
  try {
    const purchaseRef = collection(db, `users/${userId}/purchases`);
    const q = query(purchaseRef, where("type", "==", "interview"));
    const querySnapshot = await getDocs(q);
    
    const interviews = [];
    querySnapshot.forEach((doc) => {
      interviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return interviews;
  } catch (error) {
    console.error("Error getting booked interviews:", error);
    return [];
  }
}; 