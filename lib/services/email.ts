import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.HOTEL_EMAIL || 'reservations@oliviahotel.com';
const HOTEL_NAME = process.env.HOTEL_NAME || 'Olivia International Hotel';

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
        const { to, guestName, bookingNumber, checkIn, checkOut, roomType, totalAmount } = params;

        const { data, error } = await resend.emails.send({
            from: `${HOTEL_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject: `Booking Confirmation - ${bookingNumber}`,
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0A4D4E 0%, #0A4D4E 100%); color: #FFFEF9; padding: 30px; text-align: center; }
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
                <p>Email: ${FROM_EMAIL} | Phone: ${process.env.HOTEL_PHONE || '+91-XXXXXXXXXX'}</p>
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
              .header { background: linear-gradient(135deg, #0A4D4E 0%, #0A4D4E 100%); color: #FFFEF9; padding: 30px; text-align: center; }
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
                <p>Email: ${FROM_EMAIL} | Phone: ${process.env.HOTEL_PHONE || '+91-XXXXXXXXXX'}</p>
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
