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
          <Section style={header}>
            <Heading style={logo}>Xclusive Barber</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Appointment Cancelled
            </Heading>
            <Text style={paragraph}>Hi there,</Text>
            <Text style={paragraph}>
              Unfortunately, your appointment scheduled for{' '}
              <strong>{date}</strong> at <strong>{time}</strong> has been
              cancelled as the barber is no longer available.
            </Text>
            <Text style={paragraph}>
              We sincerely apologize for the inconvenience. Please log in to
              the app to book a new slot at your earliest convenience.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>Best regards,</Text>
            <Text style={footerText}>
              <strong>The Xclusive Barber Team</strong>
            </Text>
            <Text style={footerMuted}>
              xclusivebarber.co.za
            </Text>
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
  margin: '8px 0 0',
};
