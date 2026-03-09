import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// The verified "from" domain — update once your domain is verified in Resend
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Xclusive Barber <onboarding@resend.dev>';

interface AppointmentEmailData {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  servicePrice: string;
  barberName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export async function sendCompletedEmail(data: AppointmentEmailData) {
  const { customerEmail, customerName, serviceName, servicePrice, barberName, appointmentDate, appointmentTime } = data;

  return resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Appointment Complete — Thank you, ${customerName}!`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <div style="background: #000; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 2px;">XCLUSIVE BARBER</h1>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="font-size: 26px; font-weight: 300; margin: 0 0 8px;">Thanks for coming in, ${customerName}.</h2>
          <p style="color: #666; margin: 0 0 32px;">Your appointment has been completed. Here's your summary:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 500;">${serviceName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Barber</td>
              <td style="padding: 12px 0; text-align: right;">${barberName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</td>
              <td style="padding: 12px 0; text-align: right;">${appointmentDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Time</td>
              <td style="padding: 12px 0; text-align: right;">${appointmentTime}</td>
            </tr>
            <tr>
              <td style="padding: 16px 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Total</td>
              <td style="padding: 16px 0 0; text-align: right; font-size: 20px; font-weight: 700;">${servicePrice}</td>
            </tr>
          </table>
          <div style="margin-top: 40px; padding: 24px; background: #f9f9f9; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 13px;">We appreciate your business. See you next time!</p>
          </div>
        </div>
        <div style="padding: 24px 32px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #bbb; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Xclusive Barber &mdash; Durban</p>
        </div>
      </div>
    `,
  });
}

export async function sendLateArrivalEmail(data: Omit<AppointmentEmailData, 'servicePrice'>) {
  const { customerEmail, customerName, serviceName, barberName, appointmentDate, appointmentTime } = data;

  return resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Your appointment has been marked as late — ${customerName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <div style="background: #000; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 2px;">XCLUSIVE BARBER</h1>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="font-size: 26px; font-weight: 300; margin: 0 0 8px;">We noticed you were late, ${customerName}.</h2>
          <p style="color: #666; margin: 0 0 32px;">Your appointment has been marked as a late arrival. Please try to be on time for future bookings.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 500;">${serviceName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Barber</td>
              <td style="padding: 12px 0; text-align: right;">${barberName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</td>
              <td style="padding: 12px 0; text-align: right;">${appointmentDate}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Time</td>
              <td style="padding: 12px 0; text-align: right;">${appointmentTime}</td>
            </tr>
          </table>
          <div style="margin-top: 40px; padding: 24px; background: #f9f9f9; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 13px;">Your appointment is still active. Please contact us if you have any questions.</p>
          </div>
        </div>
        <div style="padding: 24px 32px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #bbb; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Xclusive Barber &mdash; Durban</p>
        </div>
      </div>
    `,
  });
}
