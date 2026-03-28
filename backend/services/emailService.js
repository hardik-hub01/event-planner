import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@luminaevents.com',
      to: email,
      subject: 'Verify Your Lumina Events Account',
      html: `
        <h2>Welcome to Lumina Events!</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #7c3aed; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@luminaevents.com',
      to: email,
      subject: 'Reset Your Lumina Events Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the link below:</p>
        <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (email, userName, bookingRef, bookingDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@luminaevents.com',
      to: email,
      subject: `Booking Confirmation - ${bookingRef}`,
      html: `
        <h2>Booking Confirmed!</h2>
        <p>Hi ${userName},</p>
        <p>Your event booking has been confirmed.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p><strong>Event:</strong> ${bookingDetails.eventCategory}</p>
          <p><strong>Package:</strong> ${bookingDetails.packageName}</p>
          <p><strong>Date:</strong> ${new Date(bookingDetails.eventDate).toLocaleDateString()}</p>
          <p><strong>Guests:</strong> ${bookingDetails.guests}</p>
          <p><strong>Venue:</strong> ${bookingDetails.venue}</p>
          <p><strong>Total Amount:</strong> ₹${bookingDetails.totalAmount}</p>
        </div>
        <p>You can view your booking status anytime in your dashboard.</p>
        <p>Thank you for choosing Lumina Events!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    throw error;
  }
};
