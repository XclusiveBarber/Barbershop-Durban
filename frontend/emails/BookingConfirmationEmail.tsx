import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components';

interface BookingConfirmationEmailProps {
  date: string;
  time: string;
  services: string;
  barberName: string;
  totalPrice: string;
}

export function BookingConfirmationEmail({
  date,
  time,
  services,
  barberName,
  totalPrice,
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Booking confirmed — {date} at {time} with {barberName}.</Preview>
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
            <Heading as="h2" style={heading}>Booking Confirmed</Heading>
            <Text style={paragraph}>
              Your appointment has been booked. Here are your details:
            </Text>

            <Section style={detailsBox}>
              <Row style={detailRow}>
                <Column style={detailLabel}>Date</Column>
                <Column style={detailValue}>{date}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Time</Column>
                <Column style={detailValue}>{time}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Services</Column>
                <Column style={detailValue}>{services}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Barber</Column>
                <Column style={detailValue}>{barberName}</Column>
              </Row>
              <Hr style={detailDivider} />
              <Row style={detailRow}>
                <Column style={totalLabel}>Total</Column>
                <Column style={totalValue}>{totalPrice}</Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              Please arrive on time. Cancellations within 2 hours of your
              appointment cannot be accepted per our policy.
            </Text>
            <Text style={paragraph}>We look forward to seeing you.</Text>
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

const detailsBox = {
  backgroundColor: '#000000',
  border: '1px solid #333333',
  padding: '20px 24px',
  margin: '24px 0',
};

const detailRow = {
  marginBottom: '10px',
};

const detailLabel = {
  color: '#9b1c1c',
  fontSize: '11px',
  fontWeight: 'bold' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  width: '40%',
};

const detailValue = {
  color: '#cccccc',
  fontSize: '14px',
};

const detailDivider = {
  borderColor: '#333333',
  margin: '14px 0',
};

const totalLabel = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  width: '40%',
};

const totalValue = {
  color: '#9b1c1c',
  fontSize: '16px',
  fontWeight: '800' as const,
  letterSpacing: '1px',
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
