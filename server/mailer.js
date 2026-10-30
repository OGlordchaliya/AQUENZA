const nodemailer = require('nodemailer');

class Mailer {
  constructor() {
    this.refresh();
  }

  refresh() {
    this.host = process.env.SMTP_HOST || 'smtp.gmail.com';
    this.port = parseInt(process.env.SMTP_PORT || '465', 10);
    this.secure = process.env.SMTP_SECURE !== 'false';
    this.user = process.env.SMTP_USER || 'aquenza.service@gmail.com';
    this.pass = process.env.SMTP_APP_PASSWORD || '';
    this.from = process.env.EMAIL_FROM || `AQUENZA Website <${this.user}>`;
    this.to = process.env.EMAIL_TO || 'aquenza.service@gmail.com';

    this.isConfigured = Boolean(this.user && this.pass && this.pass.trim().length > 0);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.pass
        }
      });
    } else {
      this.transporter = null;
    }
  }

  getStatus() {
    this.refresh();
    return {
      configured: this.isConfigured,
      host: this.host,
      port: this.port,
      secure: this.secure,
      user: this.user,
      destination: this.to,
      provider: 'Gmail SMTP',
      missing: this.isConfigured ? null : ['SMTP_APP_PASSWORD']
    };
  }

  async sendEnquiryNotification(enquiry) {
    this.refresh();
    if (!this.isConfigured) {
      console.log(`[Mailer Mock/Log] SMTP App Password pending. Enquiry ref: ${enquiry.reference_id} saved in database.`);
      return {
        sent: false,
        reason: 'SMTP_APP_PASSWORD not yet configured in hosting environment variables.'
      };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
        <div style="background: #002B49; color: #FFFFFF; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; letter-spacing: 2px;">AQUENZA</h2>
          <p style="margin: 4px 0 0; color: #00B4D8; font-size: 13px; font-weight: bold; letter-spacing: 1.5px;">NEW WEBSITE SUPPLY ENQUIRY</p>
        </div>
        <div style="padding: 24px; background: #FFFFFF; color: #1E293B; line-height: 1.6;">
          <div style="background: #EFF6FF; border-left: 4px solid #0052CC; padding: 12px 16px; margin-bottom: 20px;">
            <strong>Reference ID:</strong> ${enquiry.reference_id}<br>
            <strong>Date Received:</strong> ${new Date(enquiry.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; width: 40%; color: #64748B;">Client Name:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">${enquiry.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Contact Phone:</td>
              <td style="padding: 10px 0;"><a href="tel:${enquiry.phone}" style="color: #0052CC; font-weight: bold; text-decoration: none;">${enquiry.phone}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Client Email:</td>
              <td style="padding: 10px 0;">${enquiry.email || 'Not provided'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Bottle Size:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #0052CC;">${enquiry.bottle_size}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Requested Quantity:</td>
              <td style="padding: 10px 0; font-weight: bold;">${enquiry.quantity}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Custom Branding:</td>
              <td style="padding: 10px 0;">${enquiry.custom_branding}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Digital QR Solution:</td>
              <td style="padding: 10px 0;">${enquiry.qr_required}</td>
            </tr>
          </table>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <div style="font-weight: bold; color: #475569; font-size: 13px; margin-bottom: 6px;">Client Note / Message:</div>
            <div style="color: #334155; font-style: italic;">"${enquiry.message || 'No additional message provided.'}"</div>
          </div>

          <div style="text-align: center;">
            <a href="https://wa.me/91${enquiry.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(enquiry.name)}%2C%20thank%20you%20for%20contacting%20AQUENZA%20regarding%20your%20water%20supply%20enquiry%20(${enquiry.reference_id})." style="background: #25D366; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reply via WhatsApp
            </a>
          </div>
        </div>
        <div style="background: #F1F5F9; color: #64748B; font-size: 12px; padding: 16px; text-align: center;">
          AQUENZA Coordination Service — Bijnor, Uttar Pradesh<br>
          Automated notification from official website portal: <a href="https://aquenza.onrender.com" style="color: #0052CC;">aquenza.onrender.com</a>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: `[AQUENZA Enquiry] ${enquiry.bottle_size} (${enquiry.quantity}) from ${enquiry.name} [Ref: ${enquiry.reference_id}]`,
        text: `New Enquiry from ${enquiry.name} (${enquiry.phone}): Size: ${enquiry.bottle_size}, Qty: ${enquiry.quantity}, Custom: ${enquiry.custom_branding}, QR: ${enquiry.qr_required}. Ref: ${enquiry.reference_id}`,
        html
      });

      // Optional customer acknowledgement if valid email was provided
      if (enquiry.email && enquiry.email.includes('@')) {
        try {
          await this.transporter.sendMail({
            from: this.from,
            to: enquiry.email,
            subject: `Enquiry Acknowledged: AQUENZA Packaged-Water Coordination [Ref: ${enquiry.reference_id}]`,
            text: `Dear ${enquiry.name},\n\nThank you for reaching out to AQUENZA. We have received your enquiry for ${enquiry.bottle_size} (Quantity: ${enquiry.quantity}). Our coordination team will connect with you via phone shortly.\n\nWarm regards,\nAQUENZA Team\nBijnor, UP`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px;">
                <h3 style="color: #002B49; margin-top: 0;">Thank you for contacting AQUENZA</h3>
                <p>Dear <strong>${enquiry.name}</strong>,</p>
                <p>We have received your enquiry for <strong>${enquiry.bottle_size}</strong> (Estimated Quantity: <strong>${enquiry.quantity}</strong>).</p>
                <p>Your quotation reference code is: <code style="background: #EFF6FF; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #0052CC;">${enquiry.reference_id}</code></p>
                <p>Our coordination executive will review regional supplier batch schedules and connect with you directly via phone at <strong>${enquiry.phone}</strong>.</p>
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                <p style="font-size: 12px; color: #64748B;">AQUENZA Coordination Service — Bijnor, UP</p>
              </div>
            `
          });
        } catch (ackErr) {
          console.warn('[Mailer] Customer acknowledgement email failed:', ackErr.message);
        }
      }

      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error('[Mailer] SMTP dispatch error:', err.message);
      return { sent: false, error: err.message };
    }
  }

  async sendTestEmail() {
    this.refresh();
    if (!this.isConfigured) {
      throw new Error('SMTP_APP_PASSWORD is not set in environment variables.');
    }
    const info = await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject: `[AQUENZA Health Check] Gmail SMTP Delivery Test — ${new Date().toLocaleTimeString('en-IN')}`,
      text: 'This is a live health verification test email sent from the AQUENZA Admin Dashboard. Gmail SMTP dispatch is fully operational!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #10B981; border-radius: 8px;">
          <h3 style="color: #059669; margin-top: 0;">Gmail SMTP Diagnostic Successful</h3>
          <p>Your AQUENZA backend server has successfully connected to Google SMTP servers and transmitted this test email.</p>
          <p><strong>Sender:</strong> ${this.from}<br><strong>Recipient:</strong> ${this.to}<br><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    });
    return { success: true, messageId: info.messageId };
  }
}

module.exports = new Mailer();

