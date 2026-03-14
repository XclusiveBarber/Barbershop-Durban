import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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
          <Section style={header}>
            <Heading style={logo}>Xclusive Barber</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Welcome, {firstName}!
            </Heading>
            <Text style={paragraph}>
              Your profile has been created. You&apos;re now part of the
              Xclusive Barber community.
            </Text>
            <Text style={paragraph}>
              You can now browse our services, book an appointment, and manage
              everything from your dashboard.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightText}>
                Ready to book your first cut? Log in and get started at{' '}
                <strong>xclusivebarber.co.za</strong>.
              </Text>
            </Section>

            <Text style={paragraph}>
              If you have any questions, don&apos;t hesitate to reach out.
              We&apos;re happy to help!
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              <strong>The Xclusive Barber Team</strong>
            </Text>
            <Text style={footerMuted}>xclusivebarber.co.za</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px 8px 0 0',
  padding: '24px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '32px',
};

const heading = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const paragraph = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const highlightBox = {
  backgroundColor: '#f0f0f0',
  borderLeft: '4px solid #1a1a1a',
  borderRadius: '4px',
  margin: '20px 0',
  padding: '16px',
};

const highlightText = {
  color: '#333333',
  fontSize: '14px',
  margin: '0',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '0',
};

const footer = {
  backgroundColor: '#ffffff',
  borderRadius: '0 0 8px 8px',
  padding: '24px 32px',
};

const footerText = {
  color: '#444444',
  fontSize: '14px',
  margin: '0 0 4px',
};

const footerMuted = {
  color: '#999999',
  fontSize: '13px',
  margin: '4px 0 0',
};
