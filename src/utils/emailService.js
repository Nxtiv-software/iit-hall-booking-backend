import nodemailer from "nodemailer";

/**
 * Configure the transporter using environment variables.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain text body.
 * @param {string} html - HTML body.
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"IIT Hall Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Send approval notification to student.
 * @param {string} studentEmail - Student's university email.
 * @param {string} studentName - Student's name.
 * @param {string} requestTitle - Title of the request.
 * @param {string} status - Current status (e.g., "Level 1 Approved", "Final Booking Created").
 * @param {string} comment - Admin's comment.
 */
export const sendApprovalEmail = async (studentEmail, studentName, requestTitle, status, comment) => {
  const subject = `Request Update: ${requestTitle} - ${status}`;
  const text = `Hi ${studentName},\n\nYour request "${requestTitle}" has been updated to: ${status}.\n\nAdmin Comment: ${comment || "No comment provided."}\n\nThank you,\nIIT Hall Booking System`;
  
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
      <h2>Request Update</h2>
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your request "<strong>${requestTitle}</strong>" has been updated.</p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50;">
        <p style="margin: 0;"><strong>Status:</strong> ${status}</p>
        <p style="margin: 10px 0 0 0;"><strong>Admin Comment:</strong> ${comment || "No comment provided."}</p>
      </div>
      <p>You can view more details in the portal.</p>
      <p>Thank you,<br>IIT Hall Booking System</p>
    </div>
  `;

  return await sendEmail(studentEmail, subject, text, html);
};

export default { sendEmail, sendApprovalEmail };
