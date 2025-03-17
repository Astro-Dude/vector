// This is a placeholder that would typically use a serverless function
// For actual implementation, you'll need a backend service

// Temporary email service that just logs to console
export const sendEmail = async (emailData) => {
  console.log("========= EMAIL WOULD BE SENT =========");
  console.log("To:", emailData.to);
  console.log("Subject:", emailData.subject);
  console.log("Content:", emailData.html);
  console.log("======================================");
  
  // For development, show an alert with the email details
  if (emailData.to === 'vector.scalernset@gmail.com') {
    alert(`New booking request would be sent to ${emailData.to}\n\nCheck the console for details.`);
  }
  
  return { success: true };
}; 