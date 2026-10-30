const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class QREngine {
  constructor() {
    this.refresh();
  }

  refresh() {
    this.baseUrl = (process.env.PUBLIC_SITE_URL || 'https://aquenza.onrender.com').replace(/\/+$/, '');
  }

  getCompanyUrl() {
    this.refresh();
    return `${this.baseUrl}/qr-company`;
  }

  getVenueUrl(slug) {
    this.refresh();
    const cleanSlug = encodeURIComponent((slug || '').toLowerCase().trim());
    return `${this.baseUrl}/qr/${cleanSlug}`;
  }

  async generatePngBuffer(url, size = 600) {
    return QRCode.toBuffer(url, {
      type: 'png',
      width: size,
      margin: 2,
      color: {
        dark: '#002B49',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
  }

  async generateDataUrl(url, size = 300) {
    return QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#002B49',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
  }

  async generateSvgString(url) {
    return QRCode.toString(url, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#002B49',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
  }

  // Pre-generate production-ready scannable assets
  async generateStaticAssets() {
    this.refresh();
    const cleanDir = path.join(__dirname, '../public/assets/clean');

    const companyUrl = this.getCompanyUrl();
    const venueUrl = this.getVenueUrl('the-royal-bistro');

    const companyBuf = await this.generatePngBuffer(companyUrl, 600);
    const venueBuf = await this.generatePngBuffer(venueUrl, 600);

    fs.writeFileSync(path.join(cleanDir, 'qr_aquenza_company.png'), companyBuf);
    fs.writeFileSync(path.join(cleanDir, 'qr_customer_venue_demo.png'), venueBuf);

    console.log(`[QREngine] Generated static QR assets:`);
    console.log(`  - Company QR -> ${companyUrl} (${companyBuf.length} bytes)`);
    console.log(`  - Venue QR   -> ${venueUrl} (${venueBuf.length} bytes)`);
  }
}

module.exports = new QREngine();

