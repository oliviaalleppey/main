import { Resend } from 'resend';

let resendClient: Resend | null | undefined;
let warnedMissingResendKey = false;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!warnedMissingResendKey) {
      console.warn('[email] RESEND_API_KEY is not configured. Email delivery is disabled.');
      warnedMissingResendKey = true;
    }
    resendClient = null;
    return resendClient;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

const FROM_EMAIL = process.env.HOTEL_EMAIL || 'reservation@oliviaalleppey.com';
const HOTEL_NAME = process.env.HOTEL_NAME || 'Olivia International';
const RESERVATION_TEAM_EMAIL = process.env.HOTEL_RESERVATION_EMAIL || 'reservation@oliviaalleppey.com';
const FNB_EMAIL = process.env.HOTEL_FNB_EMAIL || 'fnb@oliviaalleppey.com';

/**
 * Send booking confirmation email to guest
 */
export async function sendBookingConfirmation(params: {
  to: string;
  guestName: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalAmount: number;
}) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return { skipped: true };
    }

    const { to, guestName, bookingNumber, checkIn, checkOut, roomType, totalAmount } = params;

    const { data, error } = await resend.emails.send({
      from: `${HOTEL_NAME} <${FROM_EMAIL}>`,
      to: [to],
      bcc: ['reservation@oliviaalleppey.com', 'mail@oliviaalleppey.com'],
      subject: `Booking Confirmation - ${bookingNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary) 100%); color: #FFFEF9; padding: 30px; text-align: center; }
              .content { background: #F8F6F4; padding: 30px; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E8E6E3; }
              .total { font-size: 20px; font-weight: bold; color: #C9A961; }
              .footer { text-align: center; padding: 20px; color: #B8AFA4; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${HOTEL_NAME}</h1>
                <p>Booking Confirmation</p>
              </div>
              <div class="content">
                <p>Dear ${guestName},</p>
                <p>Thank you for choosing ${HOTEL_NAME}. We are delighted to confirm your reservation.</p>
                
                <div class="booking-details">
                  <h2>Booking Details</h2>
                  <div class="detail-row">
                    <span>Booking Number:</span>
                    <strong>${bookingNumber}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Check-in:</span>
                    <strong>${checkIn}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Check-out:</span>
                    <strong>${checkOut}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Room Type:</span>
                    <strong>${roomType}</strong>
                  </div>
                  <div class="detail-row total">
                    <span>Total Amount:</span>
                    <strong>₹${(totalAmount / 100).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                
                <p>We look forward to welcoming you to our luxury property in Alappuzha, Kerala.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
              </div>
              <div class="footer">
                <p>${HOTEL_NAME}<br>Alappuzha, Kerala, India</p>
                <p>Email: ${FROM_EMAIL} | Phone: ${process.env.HOTEL_PHONE || '+91 8075 416 514'}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send booking confirmation:', error);
    throw new Error('Failed to send confirmation email');
  }
}

/**
 * Send inquiry acknowledgment email
 */
export async function sendInquiryAcknowledgment(params: {
  to: string;
  name: string;
  type: string;
}) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return { skipped: true };
    }

    const { to, name, type } = params;

    const { data, error } = await resend.emails.send({
      from: `${HOTEL_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Thank you for your ${type} inquiry`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary) 100%); color: #FFFEF9; padding: 30px; text-align: center; }
              .content { background: #F8F6F4; padding: 30px; }
              .footer { text-align: center; padding: 20px; color: #B8AFA4; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${HOTEL_NAME}</h1>
              </div>
              <div class="content">
                <p>Dear ${name},</p>
                <p>Thank you for your interest in ${HOTEL_NAME} for your ${type}.</p>
                <p>Our team will review your inquiry and get back to you within 24 hours.</p>
                <p>We look forward to making your event truly memorable.</p>
              </div>
              <div class="footer">
                <p>${HOTEL_NAME}<br>Alappuzha, Kerala, India</p>
                <p>Email: ${FROM_EMAIL} | Phone: ${process.env.HOTEL_PHONE || '+91 8075 416 514'}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send inquiry acknowledgment:', error);
    throw new Error('Failed to send acknowledgment email');
  }
}

/**
 * Send event inquiry details to reservations team
 */
export async function sendEventInquiryToReservations(params: {
  name: string;
  company?: string;
  email?: string;
  phone: string;
  eventType: string;
  guestCount?: string;
  preferredDate?: string;
  message?: string;
}) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return { skipped: true };
    }

    const {
      name,
      company,
      email,
      phone,
      eventType,
      guestCount,
      preferredDate,
      message,
    } = params;

    const { data, error } = await resend.emails.send({
      from: `${HOTEL_NAME} <${FROM_EMAIL}>`,
      to: [RESERVATION_TEAM_EMAIL, FNB_EMAIL],
      replyTo: email ? [email] : undefined,
      subject: `New Event Inquiry - ${eventType}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; }
              .container { max-width: 680px; margin: 0 auto; padding: 20px; }
              .header { background: var(--brand-primary); color: #FFFEF9; padding: 24px 28px; }
              .content { background: #F8F6F4; padding: 24px 28px; }
              .card { background: #FFFFFF; border: 1px solid #ECE5D8; border-radius: 8px; padding: 18px; }
              .row { display: flex; justify-content: space-between; gap: 20px; padding: 8px 0; border-bottom: 1px solid #F2EDE4; }
              .row:last-child { border-bottom: 0; }
              .label { color: #5F5A4F; min-width: 180px; }
              .value { color: var(--text-dark); text-align: right; font-weight: 500; }
              .message { margin-top: 16px; padding: 14px; border-radius: 6px; background: #FAF8F2; border: 1px solid #ECE5D8; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin:0;">New Event Inquiry</h2>
                <p style="margin:6px 0 0 0; opacity:0.9;">Submitted from Conference & Events page</p>
              </div>
              <div class="content">
                <div class="card">
                  <div class="row"><span class="label">Name</span><span class="value">${name}</span></div>
                  <div class="row"><span class="label">Company</span><span class="value">${company || '—'}</span></div>
                  <div class="row"><span class="label">Email</span><span class="value">${email || '—'}</span></div>
                  <div class="row"><span class="label">Phone</span><span class="value">${phone}</span></div>
                  <div class="row"><span class="label">Event Type</span><span class="value">${eventType}</span></div>
                  <div class="row"><span class="label">Guests</span><span class="value">${guestCount || '—'}</span></div>
                  <div class="row"><span class="label">Preferred Date</span><span class="value">${preferredDate || '—'}</span></div>
                </div>
                <div class="message"><strong>Message:</strong><br/>${message || '—'}</div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending event inquiry email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send event inquiry email:', error);
    throw new Error('Failed to send event inquiry');
  }
}
