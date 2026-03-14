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

interface NewsletterEmailProps {
  fullName: string;
  subject: string;
  bodyHtml: string;
}

export function NewsletterEmail({ fullName, subject, bodyHtml }: NewsletterEmailProps) {
  const firstName = fullName?.split(' ')[0] || 'there';

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Xclusive Barber</Heading>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hey {firstName},</Text>
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              <strong>The Xclusive Barber Team</strong>
            </Text>
            <Text style={footerMuted}>xclusivebarber.co.za</Text>
            <Text style={unsubscribeText}>
              You are receiving this because you opted in to our newsletter.
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

const greeting = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  marginBottom: '16px',
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

const unsubscribeText = {
  color: '#bbbbbb',
  fontSize: '12px',
  margin: '12px 0 0',
};
