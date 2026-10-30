const http = require('http');
const jsQR = require('jsqr');
const zlib = require('zlib');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const bodyBuf = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          bodyText: bodyBuf.toString('utf8'),
          bodyBuf
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

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

async function runTests() {
  console.log('--- STARTING AQUENZA SYSTEM VALIDATION ---');
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

  // 1. Homepage
  const homeRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
  assert('Homepage Status 200', homeRes.statusCode === 200);
  assert('Homepage has AQUENZA logo', homeRes.bodyText.includes('aquenza_logo_horizontal.svg'));
  assert('Homepage has Theme Toggle', homeRes.bodyText.includes('themeToggleBtn'));
  assert('Homepage has 250ml category', homeRes.bodyText.includes('cat-250ml') && homeRes.bodyText.includes('bottle_mockup_250ml.png'));

  // 2. Catalogue
  const catRes = await request({ hostname: 'localhost', port: 3000, path: '/catalogue', method: 'GET' });
  assert('Catalogue Status 200', catRes.statusCode === 200);
  assert('Catalogue has Lightbox reference', catRes.bodyText.includes('lightbox.js'));
  assert('Catalogue has Original Label Gallery', catRes.bodyText.includes('Interactive Original Label Reference Gallery'));
  assert('Catalogue has 1 Litre Premium', catRes.bodyText.includes('1 Litre Premium') && catRes.bodyText.includes('bottle_mockup_1litre_premium.png'));

  // 3. Category A Company QR Page
  const compQrRes = await request({ hostname: 'localhost', port: 3000, path: '/qr-company', method: 'GET' });
  assert('QR Company Portal Status 200', compQrRes.statusCode === 200);
  assert('QR Company displays fixed logo without filter', compQrRes.bodyText.includes('aquenza_logo_stacked_dark.svg') && !compQrRes.bodyText.includes('brightness(0) invert(1)'));

  // 4. Category B Dynamic Customer Venue Page (/qr/the-royal-bistro)
  const venueRes = await request({ hostname: 'localhost', port: 3000, path: '/qr/the-royal-bistro', method: 'GET' });
  assert('Dynamic Venue Status 200', venueRes.statusCode === 200);
  assert('Dynamic Venue displays real name', venueRes.bodyText.includes('The Royal Heritage Bistro'));
  assert('Dynamic Venue displays Menu', venueRes.bodyText.includes('Paneer Malai Tikka') && venueRes.bodyText.includes('Subz Dum Biryani'));
  assert('Dynamic Venue displays Reviews', venueRes.bodyText.includes('Dr. Alok Verma'));

  // 5. Category A QR Generator & Decoder Test
  const compQrImg = await request({ hostname: 'localhost', port: 3000, path: '/api/qr/company.png', method: 'GET' });
  assert('Company QR Endpoint 200', compQrImg.statusCode === 200 && compQrImg.headers['content-type'] === 'image/png');
  const decodedComp = jsQR(decodePng(compQrImg.bodyBuf).data, 600, 600);
  assert('Company QR decodes to HTTPS public URL', decodedComp && decodedComp.data === 'https://aquenza.onrender.com/qr-company', `(Decoded: ${decodedComp?.data})`);

  // 6. Category B Customer Venue QR Generator & Decoder Test
  const venueQrImg = await request({ hostname: 'localhost', port: 3000, path: '/api/qr/venue/the-royal-bistro.png', method: 'GET' });
  assert('Venue QR Endpoint 200', venueQrImg.statusCode === 200 && venueQrImg.headers['content-type'] === 'image/png');
  const decodedVenue = jsQR(decodePng(venueQrImg.bodyBuf).data, 600, 600);
  assert('Venue QR decodes to HTTPS venue URL', decodedVenue && decodedVenue.data === 'https://aquenza.onrender.com/qr/the-royal-bistro', `(Decoded: ${decodedVenue?.data})`);

  // 7. Security: Unauthenticated access to /admin/dashboard
  const dashNoAuth = await request({ hostname: 'localhost', port: 3000, path: '/admin/dashboard', method: 'GET' });
  assert('Admin Dashboard redirects unauthenticated requests (302)', dashNoAuth.statusCode === 302 && dashNoAuth.headers.location === '/admin/login');

  // 8. Security: Login with invalid password
  const badLogin = await request(
    { hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@aquenza.in', password: 'WrongPassword123' }
  );
  assert('Invalid Admin Password rejected (401)', badLogin.statusCode === 401);

  // 9. Admin Authentication: Login with initial setup password
  const goodLogin = await request(
    { hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@aquenza.in', password: 'Aquenza@2026!Admin' }
  );
  assert('Valid Admin Login succeeded (200)', goodLogin.statusCode === 200);
  const cookie = goodLogin.headers['set-cookie']?.[0]?.split(';')[0];
  assert('Admin Session Cookie generated', Boolean(cookie && cookie.includes('aquenza_admin_session')));

  // 10. Protected Admin API with Session Cookie
  const statsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  assert('Admin Stats API accessible with session', statsRes.statusCode === 200);
  const statsJson = JSON.parse(statsRes.bodyText);
  assert('Admin Stats accurate', statsJson.venuesCount >= 1 && statsJson.menuItemsCount >= 10);

  // 11. Public Enquiry Submission API
  const enquiryRes = await request(
    { hostname: 'localhost', port: 3000, path: '/api/enquiry', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    {
      name: 'Verification Officer',
      phone: '9876543210',
      email: 'test@example.com',
      bottleSize: '250 ml AQUENZA Bottle',
      quantity: '500 Units',
      customBranding: 'No',
      qrRequired: 'Yes',
      message: 'Automated test suite verification enquiry'
    }
  );
  assert('Enquiry API returns 200', enquiryRes.statusCode === 200);
  const enquiryJson = JSON.parse(enquiryRes.bodyText);
  assert('Enquiry has valid reference ID', Boolean(enquiryJson.referenceId && enquiryJson.referenceId.startsWith('AQZ-')));

  // 12. Public Venue Dining Feedback API
  const fbRes = await request(
    { hostname: 'localhost', port: 3000, path: '/api/feedback', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    {
      venue_id: 'venue-royal-bistro',
      guest_name: 'QA Inspector',
      rating: 5,
      comments: 'Water served chilled in custom 1L bottle. Flawless scan!'
    }
  );
  assert('Feedback API returns 200', fbRes.statusCode === 200);

  // 13. Email Status Health Check
  const emailStatusRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/email-status',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  assert('Email Status API returns 200', emailStatusRes.statusCode === 200);
  const emailJson = JSON.parse(emailStatusRes.bodyText);
  assert('Email status identifies Gmail SMTP', emailJson.host === 'smtp.gmail.com' && emailJson.destination === 'aquenza.service@gmail.com');

  console.log(`\n--- TEST SUITE COMPLETE: ${passed} / ${total} CHECKS PASSED ---`);
}

runTests().catch(err => console.error('Test suite failed:', err));

