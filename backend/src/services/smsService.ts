// SMS Service — Twilio
// To activate: npm install twilio  and add these to .env:
//   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//   TWILIO_AUTH_TOKEN=your_auth_token
//   TWILIO_FROM_NUMBER=+46xxxxxxxxx

const isConfigured =
  !!process.env.TWILIO_ACCOUNT_SID &&
  !!process.env.TWILIO_AUTH_TOKEN &&
  !!process.env.TWILIO_FROM_NUMBER;

async function sendSMS(to: string, body: string) {
  if (!to || !to.trim()) return;

  if (!isConfigured) {
    console.log('\n======================================================');
    console.log('📱 MOCK SMS (add Twilio env vars to send for real)');
    console.log(`   Till: ${to}`);
    console.log(`   Meddelande: ${body}`);
    console.log('======================================================\n');
    return;
  }

  try {
    // Uncomment after: npm install twilio
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body });
    console.log(`📱 SMS skickat till ${to}`);
  } catch (err) {
    console.error('❌ Twilio SMS-fel:', err);
  }
}

export async function sendBookingConfirmationSMS({
  phoneNumber, customerName, shopName, serviceName, startTime
}: {
  phoneNumber: string; customerName: string; shopName: string;
  serviceName: string; startTime: Date;
}) {
  const timeStr = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = startTime.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });

  const body =
    `Hej ${customerName}! Din bokning på ${shopName} är bekräftad.\n` +
    `${serviceName} – ${dateStr} kl. ${timeStr}.\n` +
    `Avboka minst 24h i förväg. / BokaBarber`;

  return sendSMS(phoneNumber, body);
}

export async function sendNewBookingNotificationSMS({
  ownerPhone, customerName, serviceName, startTime
}: {
  ownerPhone: string; customerName: string; serviceName: string; startTime: Date;
}) {
  const timeStr = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = startTime.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });

  const body =
    `Ny bokning! ${customerName} har bokat ${serviceName} – ${dateStr} kl. ${timeStr}. / BokaBarber`;

  return sendSMS(ownerPhone, body);
}
