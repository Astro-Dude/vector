const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure email transporter (you'll need SMTP credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

exports.sendInterviewBookingEmails = functions.firestore
  .document('users/{userId}/purchases/{purchaseId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    
    // Only process interview bookings
    if (data.type !== 'interview') return null;
    
    try {
      // Send email to admin
      await transporter.sendMail({
        from: functions.config().email.user,
        to: 'vector.scalernset@gmail.com',
        subject: 'New Mock Interview Booking',
        html: `
          <h2>New Mock Interview Booking</h2>
          <p><strong>User:</strong> ${data.userDetails.name}</p>
          <p><strong>Email:</strong> ${data.userDetails.email}</p>
          <p><strong>Phone:</strong> ${data.userDetails.phone}</p>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Amount:</strong> ₹${data.amount/100}</p>
        `
      });
      
      // Send confirmation to user
      await transporter.sendMail({
        from: functions.config().email.user,
        to: data.userDetails.email,
        subject: 'Mock Interview Booking Confirmation',
        html: `
          <h2>Thank you for booking a mock interview!</h2>
          <p>Hello ${data.userDetails.name},</p>
          <p>Your mock interview booking has been received.</p>
          <p>Our team will contact you within 12 hours to confirm the date and time for your interview session.</p>
          <p>Booking details:</p>
          <ul>
            <li>Booking ID: ${context.params.purchaseId}</li>
            <li>Payment ID: ${data.paymentId}</li>
            <li>Amount: ₹${data.amount/100}</li>
          </ul>
          <p>If you have any questions, please contact us.</p>
          <p>Best regards,<br>Vector NSET Team</p>
        `
      });
      
      return true;
    } catch (error) {
      console.error('Error sending emails:', error);
      return false;
    }
  }); 