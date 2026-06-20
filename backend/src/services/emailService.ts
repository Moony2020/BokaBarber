import nodemailer from 'nodemailer';

const escapeHTML = (str: string) => {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  console.log('✉️  No SMTP config found — running in mock/log mode.');
  return {
    sendMail: async (opts: any) => {
      console.log('\n======================================================');
      console.log('✉️  MOCK EMAIL');
      console.log(`   Till:  ${opts.to}`);
      console.log(`   Ämne:  ${opts.subject}`);
      console.log('======================================================\n');
      return { messageId: 'mock_' + Date.now() };
    }
  } as any;
};

const transporter = createTransporter();
const FROM = `BokaBarber <${process.env.SMTP_FROM || 'noreply@bokabarber.se'}>`;

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`✉️  E-post skickad till ${to} — ${info.messageId}`);
  } catch (err) {
    console.error('❌ SMTP-fel:', err);
  }
}

// ----------------------------------------------------
// 1. BOOKING CONFIRMATION → customer
// ----------------------------------------------------
export async function sendBookingConfirmationEmail({
  customerEmail, customerName, shopName, serviceName,
  barberName, startTime, price, shopAddress
}: {
  customerEmail: string; customerName: string; shopName: string;
  serviceName: string; barberName: string; startTime: Date;
  price: number; shopAddress: string;
}) {
  const dateStr = startTime.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e0d0;">
      <div style="background:linear-gradient(135deg,#c5a059,#8a6b20);padding:32px 28px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:-0.5px;">BokaBarber</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Din bokning är bekräftad ✓</p>
      </div>
      <div style="padding:32px 28px;">
        <p style="font-size:16px;color:#1c1b1f;">Hej <strong>${escapeHTML(customerName)}</strong>,</p>
        <p style="color:#4e4639;line-height:1.6;">Din tid hos <strong>${escapeHTML(shopName)}</strong> är bokad och bekräftad. Vi ser fram emot att välkomna dig!</p>
        <div style="background:#faf9f6;border-radius:10px;padding:24px;margin:24px 0;border-left:4px solid #c5a059;">
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:8px 0;color:#7f7667;width:120px;">Tjänst</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">${escapeHTML(serviceName)}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Barberare</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">${escapeHTML(barberName)}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Datum</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;text-transform:capitalize;">${dateStr}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Tid</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">Kl. ${timeStr}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Pris</td><td style="padding:8px 0;font-weight:700;color:#c5a059;">${price} kr</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Adress</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">${escapeHTML(shopAddress)}</td></tr>
          </table>
        </div>
        <p style="font-size:13px;color:#7f7667;line-height:1.6;">Betalning sker på plats. Behöver du avboka, vänligen gör det minst 24 timmar i förväg.</p>
      </div>
      <div style="background:#faf9f6;padding:16px 28px;text-align:center;font-size:12px;color:#a09a8e;border-top:1px solid #e8e0d0;">
        Skickat automatiskt via BokaBarber.se
      </div>
    </div>`;

  return sendEmail({ to: customerEmail, subject: `Bokningsbekräftelse – ${shopName}`, html });
}

// ----------------------------------------------------
// 2. NEW BOOKING NOTIFICATION → shop owner
// ----------------------------------------------------
export async function sendNewBookingNotificationToOwner({
  ownerEmail, ownerName, shopName, customerName, customerPhone,
  serviceName, barberName, startTime, price
}: {
  ownerEmail: string; ownerName: string; shopName: string;
  customerName: string; customerPhone: string; serviceName: string;
  barberName: string; startTime: Date; price: number;
}) {
  const dateStr = startTime.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e0d0;">
      <div style="background:linear-gradient(135deg,#1c1b1f,#3a3328);padding:28px;text-align:center;">
        <h1 style="color:#c5a059;margin:0;font-size:22px;">Ny bokning inkommen</h1>
        <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">${escapeHTML(shopName)}</p>
      </div>
      <div style="padding:32px 28px;">
        <p style="font-size:15px;color:#1c1b1f;">Hej <strong>${escapeHTML(ownerName)}</strong>, du har fått en ny bokning!</p>
        <div style="background:#faf9f6;border-radius:10px;padding:24px;margin:20px 0;border-left:4px solid #1c1b1f;">
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:8px 0;color:#7f7667;width:130px;">Kund</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">${escapeHTML(customerName)}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Telefon</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">${escapeHTML(customerPhone)}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Tjänst</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">${escapeHTML(serviceName)}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Barberare</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">${escapeHTML(barberName)}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Datum</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;text-transform:capitalize;">${dateStr}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Tid</td><td style="padding:8px 0;font-weight:700;color:#1c1b1f;">Kl. ${timeStr}</td></tr>
            <tr><td style="padding:8px 0;color:#7f7667;">Pris</td><td style="padding:8px 0;font-weight:700;color:#c5a059;">${price} kr</td></tr>
          </table>
        </div>
      </div>
      <div style="background:#faf9f6;padding:16px 28px;text-align:center;font-size:12px;color:#a09a8e;border-top:1px solid #e8e0d0;">
        BokaBarber Admin – ${escapeHTML(shopName)}
      </div>
    </div>`;

  return sendEmail({ to: ownerEmail, subject: `Ny bokning: ${customerName} – Kl. ${timeStr}`, html });
}

// ----------------------------------------------------
// 3. BOOKING CANCELLATION → customer
// ----------------------------------------------------
export async function sendBookingCancellationEmail({
  customerEmail, customerName, shopName, serviceName, startTime
}: {
  customerEmail: string; customerName: string; shopName: string;
  serviceName: string; startTime: Date;
}) {
  const dateStr = startTime.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #fecaca;">
      <div style="background:#ef4444;padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Avbokning bekräftad</h1>
      </div>
      <div style="padding:32px 28px;">
        <p style="font-size:15px;color:#1c1b1f;">Hej <strong>${escapeHTML(customerName)}</strong>,</p>
        <p style="color:#4e4639;line-height:1.6;">Din tid för <strong>${escapeHTML(serviceName)}</strong> hos <strong>${escapeHTML(shopName)}</strong> den ${dateStr} kl. ${timeStr} har avbokats.</p>
        <p style="color:#4e4639;line-height:1.6;">Vi hoppas att vi får välkomna dig tillbaka snart!</p>
      </div>
      <div style="background:#faf9f6;padding:16px 28px;text-align:center;font-size:12px;color:#a09a8e;border-top:1px solid #fecaca;">
        Skickat automatiskt via BokaBarber.se
      </div>
    </div>`;

  return sendEmail({ to: customerEmail, subject: `Avbokning bekräftad – ${shopName}`, html });
}

// ----------------------------------------------------
// 4. SUBSCRIPTION PAYMENT WARNING → owner
// ----------------------------------------------------
export async function sendSubscriptionPaymentWarningEmail({
  ownerEmail, ownerName, shopName, gracePeriodEndsAt
}: {
  ownerEmail: string; ownerName: string; shopName: string; gracePeriodEndsAt: Date;
}) {
  const dateStr = gracePeriodEndsAt.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fef2f2;border-radius:12px;overflow:hidden;border:1px solid #fee2e2;">
      <div style="background:#dc2626;padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">⚠️ Betalningsfel – Åtgärd krävs</h1>
      </div>
      <div style="padding:32px 28px;">
        <p style="font-size:15px;color:#1c1b1f;">Hej <strong>${escapeHTML(ownerName)}</strong>,</p>
        <p style="color:#4e4639;line-height:1.6;">Vi kunde inte debitera ditt kort för prenumerationen på <strong>${escapeHTML(shopName)}</strong>.</p>
        <div style="background:#fff;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #dc2626;">
          <p style="margin:0;font-weight:700;color:#991b1b;">Respitperiod gäller till: ${dateStr}</p>
          <p style="margin:8px 0 0;color:#4e4639;">Uppdatera ditt kort innan dess för att undvika att salongen stängs av.</p>
        </div>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;margin-top:8px;">Uppdatera betalningskort</a>
      </div>
      <div style="padding:16px 28px;text-align:center;font-size:12px;color:#a09a8e;border-top:1px solid #fee2e2;">BokaBarber SaaS Administration</div>
    </div>`;

  return sendEmail({ to: ownerEmail, subject: `⚠️ Betalningsfel – Respitperiod för ${shopName}`, html });
}

// ----------------------------------------------------
// 5. SUBSCRIPTION SUSPENDED → owner
// ----------------------------------------------------
export async function sendSubscriptionSuspendedEmail({
  ownerEmail, ownerName, shopName
}: {
  ownerEmail: string; ownerName: string; shopName: string;
}) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff5f5;border-radius:12px;overflow:hidden;border:1px solid #fecaca;">
      <div style="background:#b91c1c;padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🚨 Salong avstängd</h1>
      </div>
      <div style="padding:32px 28px;">
        <p style="font-size:15px;color:#1c1b1f;">Hej <strong>${escapeHTML(ownerName)}</strong>,</p>
        <p style="color:#4e4639;line-height:1.6;">Salongen <strong>${escapeHTML(shopName)}</strong> har stängts av på grund av utebliven betalning.</p>
        <div style="background:#fee2e2;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #b91c1c;">
          <ul style="margin:0;padding-left:20px;color:#7f1d1d;">
            <li>Kunder kan inte boka tider</li>
            <li>All data bevaras intakt</li>
            <li>Salongen återaktiveras omedelbart vid betalning</li>
          </ul>
        </div>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;margin-top:8px;">Återaktivera salongen</a>
      </div>
      <div style="padding:16px 28px;text-align:center;font-size:12px;color:#a09a8e;border-top:1px solid #fecaca;">BokaBarber SaaS Administration</div>
    </div>`;

  return sendEmail({ to: ownerEmail, subject: `🚨 Salong avstängd – ${shopName}`, html });
}
