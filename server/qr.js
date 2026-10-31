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

  getVenueUrl(venueOrSlug) {
    this.refresh();
    let slug = '';
    let customUrl = '';

    if (typeof venueOrSlug === 'object' && venueOrSlug !== null) {
      slug = venueOrSlug.slug || '';
      customUrl = venueOrSlug.destination_url || '';
    } else {
      slug = String(venueOrSlug || '').toLowerCase().trim();
      try {
        const db = require('./db');
        const v = db.getVenueBySlug(slug);
        if (v && v.destination_url && v.destination_url.trim()) {
          customUrl = v.destination_url.trim();
        }
      } catch (e) {}
    }

    if (customUrl && customUrl.trim()) {
      const trimmed = customUrl.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return `${this.baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    }

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
    const grandHeritageUrl = this.getVenueUrl('the-grand-heritage');
    const royalBistroUrl = this.getVenueUrl('the-royal-bistro');

    const companyBuf = await this.generatePngBuffer(companyUrl, 600);
    const grandHeritageBuf = await this.generatePngBuffer(grandHeritageUrl, 600);
    const royalBistroBuf = await this.generatePngBuffer(royalBistroUrl, 600);

    fs.writeFileSync(path.join(cleanDir, 'qr_aquenza_company.png'), companyBuf);
    fs.writeFileSync(path.join(cleanDir, 'qr_customer_venue_demo.png'), grandHeritageBuf);
    fs.writeFileSync(path.join(cleanDir, 'qr_customer_venue_royal_bistro.png'), royalBistroBuf);

    console.log(`[QREngine] Generated static QR assets:`);
    console.log(`  - Company QR        -> ${companyUrl} (${companyBuf.length} bytes)`);
    console.log(`  - Grand Heritage QR -> ${grandHeritageUrl} (${grandHeritageBuf.length} bytes)`);
    console.log(`  - Royal Bistro QR   -> ${royalBistroUrl} (${royalBistroBuf.length} bytes)`);
  }
}

module.exports = new QREngine();

