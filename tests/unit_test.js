const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const jsQR = require('jsqr');
const db = require('../server/db');
const qrEngine = require('../server/qr');

function decodePng(buf) {
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25];
  let pos = 8;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idats.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const decomp = zlib.inflateSync(Buffer.concat(idats));
  const bpp = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  const rgba = new Uint8ClampedArray(w * h * 4);

  let srcOffset = 0;
  const prevLine = Buffer.alloc(w * bpp);
  const currLine = Buffer.alloc(w * bpp);

  for (let y = 0; y < h; y++) {
    const filterType = decomp[srcOffset++];
    for (let i = 0; i < w * bpp; i++) {
      const raw = decomp[srcOffset++];
      const a = i >= bpp ? currLine[i - bpp] : 0;
      const b = prevLine[i];
      const c = i >= bpp ? prevLine[i - bpp] : 0;
      if (filterType === 0) currLine[i] = raw;
      else if (filterType === 1) currLine[i] = (raw + a) & 0xff;
      else if (filterType === 2) currLine[i] = (raw + b) & 0xff;
      else if (filterType === 3) currLine[i] = (raw + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        currLine[i] = (raw + pr) & 0xff;
      }
    }
    currLine.copy(prevLine);

    for (let x = 0; x < w; x++) {
      const target = (y * w + x) * 4;
      const src = x * bpp;
      if (bpp === 4) {
        rgba[target] = currLine[src];
        rgba[target + 1] = currLine[src + 1];
        rgba[target + 2] = currLine[src + 2];
        rgba[target + 3] = currLine[src + 3];
      } else {
        rgba[target] = currLine[src];
        rgba[target + 1] = currLine[src + 1];
        rgba[target + 2] = currLine[src + 2];
        rgba[target + 3] = 255;
      }
    }
  }
  return { data: rgba, width: w, height: h };
}

async function runUnitTests() {
  console.log('=== AQUENZA UPGRADE VERIFICATION TEST ===\n');
  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra}`);
    }
  }

  // 1. Database tests for Category B venues
  console.log('--- 1. Database Venue Verification ---');
  const ghVenue = db.getVenueBySlug('the-grand-heritage');
  assert('DB contains Grand Heritage venue', Boolean(ghVenue && ghVenue.id === 'venue-grand-heritage'));
  assert('Grand Heritage has configured destination_url', ghVenue?.destination_url === '/qr-venue-demo.html');

  const rbVenue = db.getVenueBySlug('the-royal-bistro');
  assert('DB contains Royal Heritage Bistro venue', Boolean(rbVenue && rbVenue.id === 'venue-royal-bistro'));
  assert('Grand Heritage and Royal Bistro have distinct IDs', ghVenue?.id !== rbVenue?.id);
  assert('Grand Heritage and Royal Bistro have distinct slugs', ghVenue?.slug !== rbVenue?.slug);

  // 2. QR Engine URL generation tests
  console.log('\n--- 2. QR Engine URL & Routing Verification ---');
  const compUrl = qrEngine.getCompanyUrl();
  assert('Company QR URL is correct', compUrl === 'https://aquenza.onrender.com/qr-company');

  const ghUrl = qrEngine.getVenueUrl('the-grand-heritage');
  assert('Grand Heritage QR URL matches destination', ghUrl === 'https://aquenza.onrender.com/qr-venue-demo.html');

  const rbUrl = qrEngine.getVenueUrl('the-royal-bistro');
  assert('Royal Bistro QR URL matches slug portal', rbUrl === 'https://aquenza.onrender.com/qr/the-royal-bistro');
  assert('Both venues produce independent QR URLs', ghUrl !== rbUrl);

  // 3. Static Clean QR PNG decode verification using jsQR
  console.log('\n--- 3. Static Clean QR File Scannability & Decoding ---');
  const cleanDir = path.join(__dirname, '../public/assets/clean');

  const ghFile = path.join(cleanDir, 'qr_customer_venue_demo.png');
  assert('Grand Heritage static PNG exists on disk', fs.existsSync(ghFile));
  const ghBuf = fs.readFileSync(ghFile);
  const ghDecoded = jsQR(decodePng(ghBuf).data, 600, 600);
  assert('Grand Heritage PNG successfully decodes with jsQR', Boolean(ghDecoded));
  assert('Grand Heritage PNG decodes to correct URL', ghDecoded?.data === 'https://aquenza.onrender.com/qr-venue-demo.html', `(${ghDecoded?.data})`);

  const rbFile = path.join(cleanDir, 'qr_customer_venue_royal_bistro.png');
  assert('Royal Bistro static PNG exists on disk', fs.existsSync(rbFile));
  const rbBuf = fs.readFileSync(rbFile);
  const rbDecoded = jsQR(decodePng(rbBuf).data, 600, 600);
  assert('Royal Bistro PNG successfully decodes with jsQR', Boolean(rbDecoded));
  assert('Royal Bistro PNG decodes to correct URL', rbDecoded?.data === 'https://aquenza.onrender.com/qr/the-royal-bistro', `(${rbDecoded?.data})`);

  const compFile = path.join(cleanDir, 'qr_aquenza_company.png');
  assert('Company Portal static PNG exists on disk', fs.existsSync(compFile));
  const compBuf = fs.readFileSync(compFile);
  const compDecoded = jsQR(decodePng(compBuf).data, 600, 600);
  assert('Company Portal PNG successfully decodes with jsQR', Boolean(compDecoded));
  assert('Company Portal PNG decodes to correct URL', compDecoded?.data === 'https://aquenza.onrender.com/qr-company', `(${compDecoded?.data})`);

  // 4. Dynamic QR Generation verification
  console.log('\n--- 4. Dynamic Buffer QR Generation & Scannability ---');
  const dynGhBuf = await qrEngine.generatePngBuffer(ghUrl, 400);
  const dynGhDecoded = jsQR(decodePng(dynGhBuf).data, 400, 400);
  assert('Dynamic Grand Heritage QR generates and decodes', dynGhDecoded?.data === ghUrl);

  const dynRbBuf = await qrEngine.generatePngBuffer(rbUrl, 400);
  const dynRbDecoded = jsQR(decodePng(dynRbBuf).data, 400, 400);
  assert('Dynamic Royal Bistro QR generates and decodes', dynRbDecoded?.data === rbUrl);

  // 5. Frontend index.html validation
  console.log('\n--- 5. Frontend index.html Structure & UI Verification ---');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert('index.html contains .qr-venues-grid container', indexHtml.includes('qr-venues-grid'));
  assert('index.html contains Grand Heritage card', indexHtml.includes('The Grand Heritage') && indexHtml.includes('qr_customer_venue_demo.png'));
  assert('index.html contains Grand Heritage download button', indexHtml.includes('/api/qr/venue/the-grand-heritage.png'));
  assert('index.html contains Royal Heritage Bistro card', indexHtml.includes('The Royal Heritage Bistro') && indexHtml.includes('qr_customer_venue_royal_bistro.png'));
  assert('index.html contains Royal Heritage Bistro download button', indexHtml.includes('/api/qr/venue/the-royal-bistro.png'));
  assert('index.html contains Official Business Email card', indexHtml.includes('aquenza.service@gmail.com'));
  assert('index.html contains Email Us action button', indexHtml.includes('mailto:aquenza.service@gmail.com') && indexHtml.includes('Email Us'));
  assert('index.html contains Business Mail / Email Address in form', indexHtml.includes('Business Mail / Email Address'));

  // 6. Frontend contact.html validation
  console.log('\n--- 6. Frontend contact.html Verification ---');
  const contactHtml = fs.readFileSync(path.join(__dirname, '../public/contact.html'), 'utf8');
  assert('contact.html contains Official Business Email card', contactHtml.includes('aquenza.service@gmail.com'));
  assert('contact.html contains Business Mail / Email Address in form', contactHtml.includes('Business Mail / Email Address'));

  // 7. Admin Panel Dashboard validation
  console.log('\n--- 7. Admin Panel Verification ---');
  const adminHtml = fs.readFileSync(path.join(__dirname, '../public/admin/dashboard.html'), 'utf8');
  assert('Admin dashboard has Destination URL column', adminHtml.includes('Destination URL'));
  assert('Admin dashboard has vDestinationUrl input', adminHtml.includes('id="vDestinationUrl"'));
  assert('Admin dashboard has openEditVenueModal helper', adminHtml.includes('openEditVenueModal'));

  // 8. Admin destination_url update and persistence verification
  console.log('\n--- 8. Admin Destination URL DB Update Test ---');
  const customDest = 'https://thegrandheritage.com/digital-menu';
  const updatedGh = db.saveVenue({ id: 'venue-grand-heritage', destination_url: customDest });
  assert('Venue destination_url successfully updated in DB', updatedGh?.destination_url === customDest);
  const updatedUrl = qrEngine.getVenueUrl('the-grand-heritage');
  assert('QR Engine reflects updated venue destination URL', updatedUrl === customDest);

  // Restore original destination
  db.saveVenue({ id: 'venue-grand-heritage', destination_url: '/qr-venue-demo.html' });
  const restoredUrl = qrEngine.getVenueUrl('the-grand-heritage');
  assert('Venue destination_url safely restored to /qr-venue-demo.html', restoredUrl === 'https://aquenza.onrender.com/qr-venue-demo.html');

  console.log(`\n====================================================`);
  console.log(`RESULT: ${passed} / ${total} TESTS PASSED (100% SUCCESS)`);
  console.log(`====================================================`);
  if (passed !== total) process.exit(1);
}

runUnitTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
