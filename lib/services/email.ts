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
const FOM_EMAIL = process.env.HOTEL_FOM_EMAIL || 'fom@oliviaalleppey.com';
const VP_EMAIL = process.env.HOTEL_VP_EMAIL || 'vp@oliviaalleppey.com';
const HOTEL_PHONE = process.env.HOTEL_PHONE || '+91 8075 416 514';
const HOTEL_PHONE_TEL = HOTEL_PHONE.replace(/\s+/g, '');


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
      bcc: [RESERVATION_TEAM_EMAIL, FOM_EMAIL, 'mail@oliviaalleppey.com'],
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
                <p>Email: <a href="mailto:${FROM_EMAIL}" style="color:#C9A84C;">${FROM_EMAIL}</a> &nbsp;|&nbsp; Phone: <a href="tel:${HOTEL_PHONE_TEL}" style="color:#C9A84C;">${HOTEL_PHONE}</a></p>
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
 * Send new booking alert to hotel staff (reservation + FOM)
 */
export async function sendBookingAlertToStaff(params: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  bookingNumber: string;
  confirmationNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomType: string;
  totalAmount: number;
}) {
  try {
    const resend = getResendClient();
    if (!resend) return { skipped: true };

    const { guestName, guestEmail, guestPhone, bookingNumber, confirmationNumber, checkIn, checkOut, nights, adults, children, roomType, totalAmount } = params;

    const { data, error } = await resend.emails.send({
      from: `${HOTEL_NAME} System <${FROM_EMAIL}>`,
      to: [RESERVATION_TEAM_EMAIL, FOM_EMAIL],
      subject: `New Booking — ${bookingNumber} | ${guestName} | ${checkIn}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1A1A1A; margin: 0; padding: 0; background: #F4F0E8; }
              .container { max-width: 620px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
              .header { background: #0D4A4A; color: #fff; padding: 24px 32px; }
              .header h2 { margin: 0; font-size: 20px; }
              .header p { margin: 6px 0 0; opacity: 0.75; font-size: 13px; }
              .badge { display: inline-block; background: #C9A84C; color: #0D4A4A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 20px; margin-top: 12px; }
              .content { padding: 28px 32px; }
              .card { background: #FAF6EF; border: 1px solid #E8E0D5; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #EDE8DF; }
              .row:last-child { border-bottom: none; }
              .label { color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
              .value { color: #1C1C1C; font-size: 14px; font-weight: 600; text-align: right; }
              .value a { color: #C9A84C; text-decoration: none; }
              .amount { font-size: 18px; color: #0D4A4A; font-weight: 700; }
              .cta-wrap { text-align: center; padding: 8px 0 4px; }
              .cta-btn { display: inline-block; background: #0D4A4A; color: #fff !important; text-decoration: none !important; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 14px 36px; border-radius: 8px; }
              .footer { background: #FAF6EF; border-top: 1px solid #E8E0D5; text-align: center; padding: 16px 32px; font-size: 12px; color: #9CA3AF; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>${HOTEL_NAME}</h2>
                <p>New Direct Booking Received</p>
                <span class="badge">✓ Payment Confirmed</span>
              </div>
              <div class="content">
                <div class="card">
                  <div class="row"><span class="label">Booking No.</span><span class="value">${bookingNumber}</span></div>
                  <div class="row"><span class="label">Confirmation No.</span><span class="value">${confirmationNumber}</span></div>
                  <div class="row"><span class="label">Guest Name</span><span class="value">${guestName}</span></div>
                  <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${guestEmail}">${guestEmail}</a></span></div>
                  <div class="row"><span class="label">Phone</span><span class="value"><a href="tel:${guestPhone.replace(/\s+/g, '')}">${guestPhone}</a></span></div>
                </div>
                <div class="card">
                  <div class="row"><span class="label">Room Type</span><span class="value">${roomType}</span></div>
                  <div class="row"><span class="label">Check-in</span><span class="value">${checkIn}</span></div>
                  <div class="row"><span class="label">Check-out</span><span class="value">${checkOut}</span></div>
                  <div class="row"><span class="label">Nights</span><span class="value">${nights}</span></div>
                  <div class="row"><span class="label">Guests</span><span class="value">${adults} adult${adults !== 1 ? 's' : ''}${children ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}</span></div>
                  <div class="row"><span class="label">Total Paid</span><span class="value amount">₹${(totalAmount / 100).toLocaleString('en-IN')}</span></div>
                </div>
                <div class="cta-wrap">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliviaalleppey.com'}/admin/bookings" class="cta-btn">View in Admin →</a>
                </div>
              </div>
              <div class="footer">
                ${HOTEL_NAME} · Alappuzha, Kerala, India
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending staff booking alert:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send staff booking alert:', error);
    throw new Error('Failed to send staff booking alert');
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
                <p>Email: <a href="mailto:${FROM_EMAIL}" style="color:#C9A84C;">${FROM_EMAIL}</a> &nbsp;|&nbsp; Phone: <a href="tel:${HOTEL_PHONE_TEL}" style="color:#C9A84C;">${HOTEL_PHONE}</a></p>
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

/**
 * Send membership application acknowledgment email to applicant
 */
export async function sendMembershipApplicationAcknowledgment(params: {
  to: string;
  name: string;
}) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return { skipped: true };
    }

    const { to, name } = params;

    const { data, error } = await resend.emails.send({
      from: `${HOTEL_NAME} Memberships <${FROM_EMAIL}>`,
      to: [to],
      subject: `Thank you for your Membership Application`,
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
                <p>Thank you for submitting your application for the Olivia Lifestyle Membership.</p>
                <p>We have received your details successfully. Our membership team is currently reviewing your application and will be in touch with you shortly to finalize your enrollment process.</p>
                <p>We look forward to welcoming you into our exclusive membership program.</p>
              </div>
              <div class="footer">
                <p>${HOTEL_NAME}<br>Alappuzha, Kerala, India</p>
                <p>Email: <a href="mailto:${FROM_EMAIL}" style="color:#C9A84C;">${FROM_EMAIL}</a> &nbsp;|&nbsp; Phone: <a href="tel:${HOTEL_PHONE_TEL}" style="color:#C9A84C;">${HOTEL_PHONE}</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending membership acknowledgment email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send membership acknowledgment email:', error);
    throw new Error('Failed to send acknowledgment email');
  }
}

/**
 * Send membership application details to admin teams
 */
export async function sendMembershipApplicationToAdmins(params: {
  name: string;
  email: string;
  phone: string;
  dob: string;
  city: string;
}) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return { skipped: true };
    }

    const { name, email, phone, dob, city } = params;

    const { data, error } = await resend.emails.send({
      from: `${HOTEL_NAME} System <${FROM_EMAIL}>`,
      to: [RESERVATION_TEAM_EMAIL, FNB_EMAIL, VP_EMAIL],
      replyTo: email ? [email] : undefined,
      subject: `New Membership Application - ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; margin: 0; padding: 0; background: #F4F0E8; }
              .container { max-width: 620px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
              .header { background: #0D4A4A; color: #ffffff; padding: 28px 32px; }
              .header h2 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.01em; }
              .header p { margin: 6px 0 0; opacity: 0.75; font-size: 13px; }
              .badge { display: inline-block; background: #C9A84C; color: #0D4A4A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 20px; margin-top: 12px; }
              .content { padding: 28px 32px; }
              .intro { font-size: 14px; color: #5F5A4F; margin: 0 0 20px; }
              .card { background: #FAF6EF; border: 1px solid #E8E0D5; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
              .row { display: flex; justify-content: space-between; align-items: center; padding: 11px 16px; border-bottom: 1px solid #EDE8DF; }
              .row:last-child { border-bottom: none; }
              .label { color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
              .value { color: #1C1C1C; font-size: 14px; font-weight: 600; text-align: right; }
              .cta-wrap { text-align: center; padding: 8px 0 4px; }
              .cta-btn { display: inline-block; background: #0D4A4A; color: #ffffff !important; text-decoration: none !important; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 14px 36px; border-radius: 8px; margin-bottom: 8px; }
              .cta-sub { font-size: 11px; color: #9CA3AF; margin-top: 8px; }
              .footer { background: #FAF6EF; border-top: 1px solid #E8E0D5; text-align: center; padding: 18px 32px; font-size: 12px; color: #9CA3AF; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>${HOTEL_NAME}</h2>
                <p>New Membership Application — Action Required</p>
                <span class="badge">⚡ Needs Follow-up</span>
              </div>
              <div class="content">
                <p class="intro">A new membership application has been submitted. Review the details below and update the status in the Admin Panel.</p>
                <div class="card">
                  <div class="row"><span class="label">Name</span><span class="value">${name}</span></div>
                  <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${email}" style="color:#C9A84C;text-decoration:none;">${email}</a></span></div>
                  <div class="row"><span class="label">Mobile</span><span class="value"><a href="tel:${phone.replace(/\s+/g, '')}" style="color:#C9A84C;text-decoration:none;">${phone}</a></span></div>
                  <div class="row"><span class="label">Date of Birth</span><span class="value">${dob}</span></div>
                  <div class="row"><span class="label">City</span><span class="value">${city}</span></div>
                </div>
                <div class="cta-wrap">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliviaalleppey.com'}/admin/memberships" class="cta-btn">
                    View Membership Details →
                  </a>
                  <p class="cta-sub">Opens the Admin Panel · Sign-in required</p>
                </div>
              </div>
              <div class="footer">
                ${HOTEL_NAME} · Alappuzha, Kerala, India<br/>
                ${FROM_EMAIL} · <a href="tel:${HOTEL_PHONE_TEL}" style="color:#C9A84C;text-decoration:none;">${HOTEL_PHONE}</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending admin membership email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send admin membership email:', error);
    throw new Error('Failed to send admin membership email');
  }
}

