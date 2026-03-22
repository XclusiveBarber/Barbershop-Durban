import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface CancellationEmailProps {
  date: string;
  time: string;
}

export function CancellationEmail({ date, time }: CancellationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment on {date} at {time} has been cancelled.</Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Img
              src="https://xclusivebarber.co.za/logo.png"
              alt="Xclusive Barber"
              width="48"
              height="48"
              style={logoImg}
            />
            <Text style={logoText}>XCLUSIVE BARBER</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>Appointment Cancelled</Heading>
            <Text style={paragraph}>Hi there,</Text>
            <Text style={paragraph}>
              Unfortunately, your appointment scheduled for{' '}
              <span style={highlight}>{date}</span> at{' '}
              <span style={highlight}>{time}</span> has been cancelled as the
              barber is no longer available.
            </Text>
            <Text style={paragraph}>
              We sincerely apologize for the inconvenience. Please log in to
              book a new slot at your convenience.
            </Text>

            <Section style={ctaBox}>
              <Text style={ctaText}>
                Visit <span style={ctaLink}>xclusivebarber.co.za</span> to
                book a new appointment.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Davenport — All types of XCLUSIVE haircuts &amp; grooming.</Text>
            <Text style={footerText}>&copy; 2026 Xclusive Barber. xclusivebarber.co.za</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#000000',
  fontFamily: "'Montserrat', Arial, sans-serif",
  margin: '0',
  padding: '0',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#1a1a1a',
  borderLeft: '4px solid #9b1c1c',
  border: '1px solid #333333',
};

const header = {
  backgroundColor: '#000000',
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const logoImg = {
  display: 'block',
  margin: '0 auto 12px',
};

const logoText = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '800',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  margin: '0',
};

const content = {
  padding: '40px',
};

const heading = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const paragraph = {
  color: '#aaaaaa',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 14px',
};

const highlight = {
  color: '#ffffff',
  fontWeight: 'bold' as const,
};

const ctaBox = {
  backgroundColor: '#000000',
  border: '1px solid #333333',
  padding: '16px 20px',
  margin: '24px 0 0',
};

const ctaText = {
  color: '#aaaaaa',
  fontSize: '14px',
  margin: '0',
};

const ctaLink = {
  color: '#9b1c1c',
  fontWeight: 'bold' as const,
};

const footer = {
  borderTop: '1px solid #333333',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  margin: '4px 0',
};
