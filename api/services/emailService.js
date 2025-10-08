/**
 * Email Service
 * Handles automated email notifications for booking confirmations
 */

const nodemailer = require("nodemailer");
const voucherService = require("./voucherService");

class EmailService {
  constructor() {
    // Email configuration - using SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "support@faredown.com",
        pass: process.env.SMTP_PASS || "app_password_here",
      },
    });

    this.companyDetails = {
      name: "Faredown Travel",
      email: "admin@faredown.com", // Send from admin as requested
      supportEmail: "support@faredown.com",
      phone: "+91-9876543210",
      website: "www.faredown.com",
      address: "Mumbai, Maharashtra, India",
    };
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(bookingData) {
    try {
      const {
        bookingRef,
        guestDetails,
        hotelDetails,
        checkIn,
        checkOut,
        totalAmount,
        currency,
      } = bookingData;

      const customerEmail = guestDetails.contactInfo.email;
      const customerName = `${guestDetails.primaryGuest.firstName} ${guestDetails.primaryGuest.lastName}`;

      // Generate voucher PDF
      const voucherResult =
        await voucherService.generateHotelVoucher(bookingData);

      // Email content
      const subject = `Booking Confirmation - ${bookingRef} | Faredown Travel`;
      const htmlContent = this.generateBookingConfirmationHTML(bookingData);
      const textContent = this.generateBookingConfirmationText(bookingData);

      // Email options
      const mailOptions = {
        from: {
          name: this.companyDetails.name,
          address: this.companyDetails.email,
        },
        to: customerEmail,
        cc: this.companyDetails.email, // Send copy to support
        subject,
        html: htmlContent,
        text: textContent,
        attachments: [
          {
            filename: voucherResult.filename,
            content: voucherResult.pdf,
            contentType: "application/pdf",
          },
        ],
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      console.log("Booking confirmation email sent:", result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipient: customerEmail,
      };
    } catch (error) {
      console.error("Email sending error:", error);
      throw new Error(
        `Failed to send booking confirmation email: ${error.message}`,
      );
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(bookingData, paymentDetails) {
    try {
      const customerEmail = bookingData.guestDetails.contactInfo.email;
      const subject = `Payment Confirmation - ${bookingData.bookingRef} | Faredown Travel`;

      const htmlContent = this.generatePaymentConfirmationHTML(
        bookingData,
        paymentDetails,
      );
      const textContent = this.generatePaymentConfirmationText(
        bookingData,
        paymentDetails,
      );

      const mailOptions = {
        from: {
          name: this.companyDetails.name,
          address: this.companyDetails.email,
        },
        to: customerEmail,
        subject,
        html: htmlContent,
        text: textContent,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        recipient: customerEmail,
      };
    } catch (error) {
      console.error("Payment confirmation email error:", error);
      throw new Error(
        `Failed to send payment confirmation email: ${error.message}`,
      );
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken, firstName = "User") {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev"}/reset-password?token=${resetToken}`;

      const subject = `Reset Your Password - Faredown Travel`;
      const htmlContent = this.generatePasswordResetHTML(
        email,
        resetUrl,
        firstName,
      );
      const textContent = this.generatePasswordResetText(
        email,
        resetUrl,
        firstName,
      );

      const mailOptions = {
        from: {
          name: this.companyDetails.name + " Admin",
          address: this.companyDetails.email, // Send from admin@faredown.com
        },
        to: email,
        subject,
        html: htmlContent,
        text: textContent,
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log("Password reset email sent:", result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipient: email,
      };
    } catch (error) {
      console.error("Password reset email error:", error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendEmailVerification(email, token, firstName = "there") {
    try {
      const baseUrl =
        process.env.APP_PUBLIC_URL ||
        process.env.OAUTH_REDIRECT_BASE ||
        process.env.API_SERVER_URL ||
        process.env.API_BASE_URL?.replace(/\/?api$/, "") ||
        "https://builder-faredown-pricing.onrender.com";

      const verifyUrl = `${baseUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${token}`;
      const subject = "Verify your Faredown account";
      const htmlContent = this.generateVerificationHTML(firstName, verifyUrl);
      const textContent = this.generateVerificationText(firstName, verifyUrl);

      const mailOptions = {
        from: {
          name: this.companyDetails.name + " Support",
          address: this.companyDetails.email,
        },
        to: email,
        subject,
        html: htmlContent,
        text: textContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Verification email sent:", result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        recipient: email,
      };
    } catch (error) {
      console.error("Verification email error:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  generateVerificationHTML(firstName, verifyUrl) {
    return `
      <div style="font-family: Arial, sans-serif; color: #1a1a1a;">
        <h2>Welcome to Faredown, ${firstName}!</h2>
        <p>Thanks for creating an account with us. Please verify your email address to unlock your account and start managing your bookings.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #003580; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Email Address</a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${verifyUrl}</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />
        <p style="font-size: 14px; color: #555;">
          This link will expire in 24 hours. If you didn't sign up for Faredown, you can safely ignore this email.
        </p>
      </div>
    `;
  }

  generateVerificationText(firstName, verifyUrl) {
    return `Welcome to Faredown, ${firstName}!

Please verify your email address by visiting the link below:
${verifyUrl}

This link will expire in 24 hours. If you did not create this account, you can ignore this email.`;
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(bookingData, cancellationDetails) {
    try {
      const customerEmail = bookingData.guestDetails.contactInfo.email;
      const subject = `Booking Cancellation - ${bookingData.bookingRef} | Faredown Travel`;

      const htmlContent = this.generateCancellationHTML(
        bookingData,
        cancellationDetails,
      );
      const textContent = this.generateCancellationText(
        bookingData,
        cancellationDetails,
      );

      const mailOptions = {
        from: {
          name: this.companyDetails.name,
          address: this.companyDetails.email,
        },
        to: customerEmail,
        subject,
        html: htmlContent,
        text: textContent,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        recipient: customerEmail,
      };
    } catch (error) {
      console.error("Cancellation email error:", error);
      throw new Error(`Failed to send cancellation email: ${error.message}`);
    }
  }

  /**
   * Generate booking confirmation HTML email
   */
  generateBookingConfirmationHTML(bookingData) {
    const {
      bookingRef,
      guestDetails,
      hotelDetails,
      roomDetails,
      checkIn,
      checkOut,
      totalAmount,
      currency,
    } = bookingData;

    const customerName = `${guestDetails.primaryGuest.firstName} ${guestDetails.primaryGuest.lastName}`;
    const checkInDate = new Date(checkIn).toLocaleDateString("en-GB");
    const checkOutDate = new Date(checkOut).toLocaleDateString("en-GB");
    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24),
    );

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003580; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .booking-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .success-badge { background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 10px; border-bottom: 1px solid #eee; }
    .details-table td:first-child { font-weight: bold; width: 40%; }
    .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .btn { display: inline-block; background: #003580; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Faredown Travel</h1>
      <p>Your Journey, Our Passion</p>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin: 20px 0;">
        <span class="success-badge">✓ BOOKING CONFIRMED</span>
      </div>
      
      <h2>Hello ${customerName},</h2>
      <p>Thank you for choosing Faredown Travel! Your hotel booking has been confirmed.</p>
      
      <div class="booking-box">
        <h3 style="color: #003580; margin-top: 0;">Booking Details</h3>
        <table class="details-table">
          <tr><td>Booking Reference:</td><td><strong>${bookingRef}</strong></td></tr>
          <tr><td>Hotel:</td><td>${hotelDetails?.name || "Hotel Name"}</td></tr>
          <tr><td>Address:</td><td>${hotelDetails?.address || "Hotel Address"}</td></tr>
          <tr><td>Room Type:</td><td>${roomDetails?.name || "Standard Room"}</td></tr>
          <tr><td>Check-in:</td><td>${checkInDate}</td></tr>
          <tr><td>Check-out:</td><td>${checkOutDate}</td></tr>
          <tr><td>Duration:</td><td>${nights} night${nights !== 1 ? "s" : ""}</td></tr>
          <tr><td>Total Amount:</td><td><strong>${currency === "INR" ? "₹" : currency} ${totalAmount.toLocaleString()}</strong></td></tr>
        </table>
      </div>
      
      <div class="booking-box">
        <h3 style="color: #003580; margin-top: 0;">Important Information</h3>
        <ul>
          <li>Please carry a valid photo ID proof for check-in</li>
          <li>Present the attached voucher at hotel reception</li>
          <li>Check-in time: 3:00 PM | Check-out time: 11:00 AM</li>
          <li>Contact us for any booking modifications or cancellations</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p>Need help? Contact our support team:</p>
        <p><strong>Phone:</strong> ${this.companyDetails.phone}<br>
        <strong>Email:</strong> ${this.companyDetails.email}</p>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; 2025 Faredown Travel. All rights reserved.</p>
      <p>${this.companyDetails.address}</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate booking confirmation text email
   */
  generateBookingConfirmationText(bookingData) {
    const {
      bookingRef,
      guestDetails,
      hotelDetails,
      roomDetails,
      checkIn,
      checkOut,
      totalAmount,
      currency,
    } = bookingData;

    const customerName = `${guestDetails.primaryGuest.firstName} ${guestDetails.primaryGuest.lastName}`;
    const checkInDate = new Date(checkIn).toLocaleDateString("en-GB");
    const checkOutDate = new Date(checkOut).toLocaleDateString("en-GB");
    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24),
    );

    return `
BOOKING CONFIRMED - Faredown Travel

Hello ${customerName},

Thank you for choosing Faredown Travel! Your hotel booking has been confirmed.

BOOKING DETAILS
===============
Booking Reference: ${bookingRef}
Hotel: ${hotelDetails?.name || "Hotel Name"}
Address: ${hotelDetails?.address || "Hotel Address"}
Room Type: ${roomDetails?.name || "Standard Room"}
Check-in: ${checkInDate}
Check-out: ${checkOutDate}
Duration: ${nights} night${nights !== 1 ? "s" : ""}
Total Amount: ${currency === "INR" ? "₹" : currency} ${totalAmount.toLocaleString()}

IMPORTANT INFORMATION
====================
- Please carry a valid photo ID proof for check-in
- Present the attached voucher at hotel reception
- Check-in time: 3:00 PM | Check-out time: 11:00 AM
- Contact us for any booking modifications or cancellations

SUPPORT
=======
Phone: ${this.companyDetails.phone}
Email: ${this.companyDetails.email}

Thank you for choosing Faredown Travel!

--
Faredown Travel
Your Journey, Our Passion
${this.companyDetails.address}

This is an automated email. Please do not reply to this message.
`;
  }

  /**
   * Generate payment confirmation HTML
   */
  generatePaymentConfirmationHTML(bookingData, paymentDetails) {
    // Simplified implementation
    return `<h1>Payment Confirmed</h1><p>Your payment of ${bookingData.currency} ${bookingData.totalAmount} has been received.</p>`;
  }

  /**
   * Generate payment confirmation text
   */
  generatePaymentConfirmationText(bookingData, paymentDetails) {
    // Simplified implementation
    return `Payment Confirmed\n\nYour payment of ${bookingData.currency} ${bookingData.totalAmount} has been received.`;
  }

  /**
   * Generate cancellation HTML
   */
  generateCancellationHTML(bookingData, cancellationDetails) {
    // Simplified implementation
    return `<h1>Booking Cancelled</h1><p>Your booking ${bookingData.bookingRef} has been cancelled.</p>`;
  }

  /**
   * Generate cancellation text
   */
  generateCancellationText(bookingData, cancellationDetails) {
    // Simplified implementation
    return `Booking Cancelled\n\nYour booking ${bookingData.bookingRef} has been cancelled.`;
  }

  /**
   * Generate password reset HTML email
   */
  generatePasswordResetHTML(email, resetUrl, firstName) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003580; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .reset-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .btn { display: inline-block; background: #003580; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Faredown Travel</h1>
      <p>Password Reset Request</p>
    </div>

    <div class="content">
      <div class="reset-box">
        <h2 style="color: #003580; margin-top: 0;">Hello ${firstName},</h2>
        <p>We received a request to reset the password for your Faredown Travel account:</p>
        <p><strong>${email}</strong></p>

        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" class="btn">Reset My Password</a>

        <div class="warning">
          <p><strong>Important:</strong></p>
          <ul style="text-align: left; margin: 10px 0;">
            <li>This link will expire in 1 hour for security reasons</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Your password will remain unchanged until you create a new one</li>
          </ul>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #003580; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p>Need help? Contact our support team:</p>
        <p><strong>Email:</strong> ${this.companyDetails.supportEmail}<br>
        <strong>Phone:</strong> ${this.companyDetails.phone}</p>
      </div>
    </div>

    <div class="footer">
      <p>&copy; 2025 Faredown Travel. All rights reserved.</p>
      <p>${this.companyDetails.address}</p>
      <p>This is an automated email sent from admin@faredown.com</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate password reset text email
   */
  generatePasswordResetText(email, resetUrl, firstName) {
    return `
PASSWORD RESET REQUEST - Faredown Travel

Hello ${firstName},

We received a request to reset the password for your Faredown Travel account: ${email}

To reset your password, click on the following link:
${resetUrl}

IMPORTANT INFORMATION:
- This link will expire in 1 hour for security reasons
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

If you have any questions, please contact our support team:
Email: ${this.companyDetails.supportEmail}
Phone: ${this.companyDetails.phone}

--
Faredown Travel Admin
Your Journey, Our Passion
${this.companyDetails.address}

This is an automated email sent from admin@faredown.com
`;
  }

  /**
   * Test email configuration
   */
  async testEmailConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: "Email service is ready" };
    } catch (error) {
      console.error("Email service test failed:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
