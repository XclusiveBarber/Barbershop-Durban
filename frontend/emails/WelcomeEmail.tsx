import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  fullName: string;
}

export function WelcomeEmail({ fullName }: WelcomeEmailProps) {
  const firstName = fullName?.split(' ')[0] || 'there';

  return (
    <Html>
      <Head />
      <Preview>Welcome to Xclusive Barber, {firstName}!</Preview>
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
            <Heading as="h2" style={heading}>Welcome, {firstName}.</Heading>
            <Text style={paragraph}>
              Your profile is set up. You&apos;re now part of the Xclusive
              Barber community.
            </Text>
            <Text style={paragraph}>
              Browse our services, book an appointment, and manage everything
              from your dashboard.
            </Text>

            <Section style={ctaBox}>
              <Text style={ctaLabel}>Ready to book?</Text>
              <Link href="https://xclusivebarber.co.za" style={ctaButton}>
                Book Your Appointment
              </Link>
            </Section>

            <Text style={mutedText}>
              If you have any questions, we&apos;re always happy to help.
            </Text>
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
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const paragraph = {
  color: '#aaaaaa',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 14px',
};

const ctaBox = {
  backgroundColor: '#000000',
  border: '1px solid #333333',
  padding: '24px',
  margin: '30px 0',
  textAlign: 'center' as const,
};

const ctaLabel = {
  color: '#666666',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 16px',
};

const ctaButton = {
  display: 'inline-block',
  padding: '14px 32px',
  backgroundColor: '#9b1c1c',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 'bold' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const mutedText = {
  color: '#555555',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '20px 0 0',
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
