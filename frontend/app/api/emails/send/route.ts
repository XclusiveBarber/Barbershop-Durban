import { Resend } from 'resend';
import { render } from '@react-email/render';
import { CancellationEmail } from '@/emails/CancellationEmail';
import { BookingConfirmationEmail } from '@/emails/BookingConfirmationEmail';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { NewsletterEmail } from '@/emails/NewsletterEmail';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const authToken = req.headers.get('Authorization');
  if (authToken !== `Bearer ${process.env.INTERNAL_EMAIL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, payload, to, subject } = await req.json();

  let emailHtml = '';

  if (type === 'CANCELLATION') {
    emailHtml = await render(
      CancellationEmail({ date: payload.date, time: payload.time })
    );
  } else if (type === 'BOOKING_CONFIRMATION') {
    emailHtml = await render(
      BookingConfirmationEmail({
        date: payload.date,
        time: payload.time,
        services: payload.services,
        barberName: payload.barberName,
        totalPrice: payload.totalPrice,
      })
    );
  } else if (type === 'WELCOME') {
    emailHtml = await render(WelcomeEmail({ fullName: payload.fullName }));
  } else if (type === 'NEWSLETTER') {
    emailHtml = await render(
      NewsletterEmail({
        fullName: payload.fullName,
        subject: subject,
        bodyHtml: payload.bodyHtml,
      })
    );
  } else {
    return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
  }

  const { data, error } = await resend.emails.send({
    from: 'Xclusive Barber <bookings@xclusivebarber.co.za>',
    to,
    subject,
    html: emailHtml,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}
