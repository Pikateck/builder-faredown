/**
 * Email Service
 * Handles email delivery for booking confirmations, documents, etc.
 */

const nodemailer = require('nodemailer');

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

/**
 * Send booking confirmation email
 */
async function sendBookingConfirmation(customerEmail, bookingData) {
  try {
    const { bookingRef, hotelName, checkInDate, checkOutDate, totalAmount, currency } = bookingData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@faredown.com',
      to: customerEmail,
      subject: `Booking Confirmed: ${bookingRef} - ${hotelName}`,
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear Guest,</p>
        <p>Your booking has been confirmed!</p>
        
        <h3>Booking Details</h3>
        <ul>
          <li><strong>Booking Reference:</strong> ${bookingRef}</li>
          <li><strong>Hotel:</strong> ${hotelName}</li>
          <li><strong>Check-in:</strong> ${checkInDate}</li>
          <li><strong>Check-out:</strong> ${checkOutDate}</li>
          <li><strong>Total Amount:</strong> ${currency} ${totalAmount}</li>
        </ul>
        
        <p>Your voucher and invoice will be sent shortly.</p>
        
        <p>Thank you for booking with Faredown!</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation sent to ${customerEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send booking confirmation: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send document (voucher/invoice) email
 */
async function sendDocument(customerEmail, documentData) {
  try {
    const { bookingRef, documentType, documentNumber, fileUrl } = documentData;

    const subject = documentType === 'invoice' 
      ? `Invoice ${documentNumber} - Booking ${bookingRef}`
      : `Voucher ${documentNumber} - Booking ${bookingRef}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@faredown.com',
      to: customerEmail,
      subject,
      html: `
        <h2>${documentType === 'invoice' ? 'Invoice' : 'Hotel Voucher'}</h2>
        <p>Dear Guest,</p>
        <p>Your ${documentType} for booking <strong>${bookingRef}</strong> is ready.</p>
        
        <p>
          <a href="${fileUrl}" style="background-color: #003580; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Download ${documentType === 'invoice' ? 'Invoice' : 'Voucher'}
          </a>
        </p>
        
        <p>Document Number: ${documentNumber}</p>
        
        <p>Thank you for your business!</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ ${documentType} sent to ${customerEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send ${documentData.documentType}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send generic email
 */
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@faredown.com',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
async function testEmail() {
  try {
    const testMail = {
      from: process.env.EMAIL_FROM || 'noreply@faredown.com',
      to: process.env.EMAIL_TEST_TO || 'test@faredown.com',
      subject: 'Test Email from Faredown',
      html: '<h1>Test Email</h1><p>Email service is working correctly.</p>',
    };

    const info = await transporter.sendMail(testMail);
    console.log(`✅ Test email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Test email failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendBookingConfirmation,
  sendDocument,
  sendEmail,
  testEmail,
};
