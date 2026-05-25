import nodemailer from 'nodemailer';

// Configure Nodemailer transporter using environment variables
const createTransporter = () => {
  // Check if SMTP options are set in .env, otherwise use mock/log transporter
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for 465, false for other ports
      auth: { user, pass }
    });
  }

  // Fallback mock transporter that prints emails to console
  console.log('✉️ No real SMTP configuration found. E-mail service initialized in LOGGING/MOCK mode.');
  return {
    sendMail: async (mailOptions: any) => {
      console.log('\n======================================================');
      console.log(`✉️ MOCK EMAIL SENT`);
      console.log(`   Till: ${mailOptions.to}`);
      console.log(`   Från: ${mailOptions.from || 'noreply@bokabarber.se'}`);
      console.log(`   Ämne: ${mailOptions.subject}`);
      console.log(`   Innehåll:\n${mailOptions.text || mailOptions.html}`);
      console.log('======================================================\n');
      return { messageId: 'mock_message_id_' + Date.now() };
    }
  } as any;
};

const transporter = createTransporter();
const fromAddress = process.env.SMTP_FROM || 'noreply@bokabarber.se';

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  try {
    const info = await transporter.sendMail({
      from: `BokaBarber <${fromAddress}>`,
      to,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : '')
    });
    console.log(`✉️ E-post skickad framgångsrikt till ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Fel vid sändning av e-post:', error);
    return null;
  }
}

// ----------------------------------------------------
// 1. BOOKING CONFIRMATION EMAIL
// ----------------------------------------------------
export async function sendBookingConfirmationEmail({
  customerEmail,
  customerName,
  shopName,
  serviceName,
  barberName,
  startTime,
  price,
  shopAddress
}: {
  customerEmail: string;
  customerName: string;
  shopName: string;
  serviceName: string;
  barberName: string;
  startTime: Date;
  price: number;
  shopAddress: string;
}) {
  const dateStr = startTime.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <h2 style="color: #c28d4b; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 20px;">Bokningsbekräftelse - ${shopName}</h2>
      <p>Hej <strong>${customerName}</strong>,</p>
      <p>Tack för din bokning! Din tid hos <strong>${shopName}</strong> är nu bekräftad.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #c28d4b;">
        <h3 style="margin-top: 0; color: #0f172a;">Bokningsdetaljer</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #64748b;">Tjänst:</td><td style="padding: 6px 0; font-weight: bold;">${serviceName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Frisör:</td><td style="padding: 6px 0; font-weight: bold;">${barberName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Datum:</td><td style="padding: 6px 0; font-weight: bold; text-transform: capitalize;">${dateStr}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Tid:</td><td style="padding: 6px 0; font-weight: bold;">Kl. ${timeStr}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Pris:</td><td style="padding: 6px 0; font-weight: bold; color: #c28d4b;">${price} kr</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Adress:</td><td style="padding: 6px 0; font-weight: bold;">${shopAddress}</td></tr>
        </table>
      </div>

      <p style="font-size: 0.9rem; color: #64748b;">Betalning sker på plats i salongen. Om du behöver avboka eller boka om din tid, vänligen gör det senast 24 timmar innan besöket.</p>
      
      <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
        Denna e-post skickades automatiskt via BokaBarber.se
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Bekräftelse på din bokning hos ${shopName}`,
    html
  });
}

// ----------------------------------------------------
// 2. BOOKING CANCELLATION EMAIL
// ----------------------------------------------------
export async function sendBookingCancellationEmail({
  customerEmail,
  customerName,
  shopName,
  serviceName,
  startTime
}: {
  customerEmail: string;
  customerName: string;
  shopName: string;
  serviceName: string;
  startTime: Date;
}) {
  const dateStr = startTime.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <h2 style="color: #ef4444; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 20px;">Avbokningsbekräftelse - ${shopName}</h2>
      <p>Hej <strong>${customerName}</strong>,</p>
      <p>Detta är en bekräftelse på att din tid för <strong>${serviceName}</strong> hos <strong>${shopName}</strong> den ${dateStr} kl. ${timeStr} har blivit <strong>avbokad</strong>.</p>
      
      <p>Vi hoppas att vi får välkomna dig tillbaka i framtiden! Du kan när som helst besöka vår bokningssida för att hitta en ny ledig tid.</p>
      
      <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
        Denna e-post skickades automatiskt via BokaBarber.se
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Avbokningsbekräftelse - Din tid hos ${shopName} har avbokats`,
    html
  });
}

// ----------------------------------------------------
// 3. SUBSCRIPTION PAYMENT WARNING EMAIL
// ----------------------------------------------------
export async function sendSubscriptionPaymentWarningEmail({
  ownerEmail,
  ownerName,
  shopName,
  gracePeriodEndsAt
}: {
  ownerEmail: string;
  ownerName: string;
  shopName: string;
  gracePeriodEndsAt: Date;
}) {
  const dateStr = gracePeriodEndsAt.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; color: #1e293b; background-color: #fef2f2;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 12px; margin-bottom: 20px;">⚠️ Betalningsfel - Åtgärd krävs!</h2>
      <p>Hej <strong>${ownerName}</strong>,</p>
      <p>Det här är ett viktigt systemmeddelande angående din prenumeration för salongen <strong>${shopName}</strong>.</p>
      <p>Vi kunde tyvärr inte debitera ditt registrerade kort för ditt abonnemang.</p>
      
      <div style="background-color: #fff; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <p style="margin: 0; font-weight: bold; color: #991b1b;">Respitperiod (Grace Period) tillagd:</p>
        <p style="margin: 6px 0 0 0;">Du har fram till den <strong>${dateStr}</strong> på dig att uppdatera dina kortuppgifter innan din salongs bokningar stängs av tillfälligt.</p>
      </div>

      <p>Vänligen logga in på din BokaBarber instrumentpanel och gå till <strong>Inställningar / Abonnemang</strong> för att uppdatera dina betalningsuppgifter via Stripe Billing Portal.</p>
      
      <a href="http://localhost:3000/login" style="display: inline-block; background-color: #dc2626; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 16px;">Uppdatera betalningskort nu</a>

      <div style="margin-top: 30px; border-top: 1px solid #fee2e2; padding-top: 16px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
        BokaBarber SaaS Plattformsadministration
      </div>
    </div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `⚠️ BETALNINGSFEL: Respitperiod för salongen ${shopName}`,
    html
  });
}

// ----------------------------------------------------
// 4. SUBSCRIPTION SUSPENDED EMAIL
// ----------------------------------------------------
export async function sendSubscriptionSuspendedEmail({
  ownerEmail,
  ownerName,
  shopName
}: {
  ownerEmail: string;
  ownerName: string;
  shopName: string;
}) {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fecaca; border-radius: 8px; color: #1e293b; background-color: #fff5f5;">
      <h2 style="color: #b91c1c; border-bottom: 2px solid #fecaca; padding-bottom: 12px; margin-bottom: 20px;">🚨 Din salong har stängts av (Suspenderats)</h2>
      <p>Hej <strong>${ownerName}</strong>,</p>
      <p>Detta är en viktig avisering om att din salong <strong>${shopName}</strong> har stängts av (suspenderats) på grund av utebliven prenumerationsbetalning.</p>
      
      <div style="background-color: #fee2e2; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #b91c1c;">
        <p style="margin: 0; font-weight: bold; color: #7f1d1d;">Följande begränsningar gäller nu:</p>
        <ul style="margin: 6px 0 0 0; padding-left: 20px;">
          <li>Kunder kan inte längre boka tider på din publika rutt under "/royal-cuts".</li>
          <li>Din administration är låst (förutom faktureringssidan).</li>
          <li>Ingen data har raderats, och så fort betalningen är klar återställs din salong omedelbart.</li>
        </ul>
      </div>

      <p>För att återaktivera din salong, logga in och uppdatera ditt kort via Stripe på länken nedan:</p>
      
      <a href="http://localhost:3000/login" style="display: inline-block; background-color: #b91c1c; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 16px;">Lås upp din salong direkt</a>

      <div style="margin-top: 30px; border-top: 1px solid #fecaca; padding-top: 16px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
        BokaBarber SaaS Plattformsadministration
      </div>
    </div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `🚨 AVSTÄNGD: Din salong ${shopName} har stängts av på grund av utebliven betalning`,
    html
  });
}
