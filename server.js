const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./server/db');
const auth = require('./server/auth');
const mailer = require('./server/mailer');
const qrEngine = require('./server/qr');
const { renderVenuePage } = require('./server/venue_page');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8'
};

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJson(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // Global Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // -------------------------------------------------------------
  // 1. PUBLIC API: ENQUIRY DISPATCH
  // -------------------------------------------------------------
  if (pathname === '/api/enquiry' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      if (!data.name || !data.phone || !data.bottleSize || !data.quantity) {
        return sendJson(res, 400, {
          success: false,
          message: 'Please provide all required fields: Name, Phone, Bottle Size, and Quantity.'
        });
      }

      // Basic phone / email validation
      const cleanPhone = String(data.phone).trim();
      if (cleanPhone.length < 8) {
        return sendJson(res, 400, { success: false, message: 'Please provide a valid contact phone number.' });
      }

      // Save to persistent database
      const saved = db.saveEnquiry(data);

      // Attempt SMTP notification
      const emailResult = await mailer.sendEnquiryNotification(saved);
      if (emailResult.sent) {
        db.updateEnquiryStatus(saved.id, 'new');
      }

      return sendJson(res, 200, {
        success: true,
        referenceId: saved.reference_id,
        emailDispatched: emailResult.sent,
        message: emailResult.sent 
          ? 'Your quotation enquiry has been registered and delivered directly to the AQUENZA coordination desk.'
          : 'Your quotation enquiry has been recorded in the database. Our team will contact you directly via phone.',
        note: emailResult.sent ? null : emailResult.reason
      });
    } catch (err) {
      console.error('[API Error] /api/enquiry:', err);
      return sendJson(res, 500, { success: false, message: 'Internal server error processing enquiry.' });
    }
  }

  // -------------------------------------------------------------
  // 2. PUBLIC API: VENUE DINING FEEDBACK
  // -------------------------------------------------------------
  if (pathname === '/api/feedback' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      if (!data.venue_id || !data.guest_name || !data.comments) {
        return sendJson(res, 400, { success: false, message: 'Missing required feedback fields.' });
      }
      const newReview = db.saveReview({
        venue_id: data.venue_id,
        guest_name: data.guest_name,
        rating: data.rating || 5,
        comments: data.comments,
        status: 'pending'
      });
      return sendJson(res, 200, { success: true, message: 'Feedback logged for moderation.', review: newReview });
    } catch (err) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  // -------------------------------------------------------------
  // 3. PUBLIC API: QR GENERATOR ENDPOINTS
  // -------------------------------------------------------------
  if (pathname === '/api/qr/company.png') {
    try {
      const url = qrEngine.getCompanyUrl();
      const buf = await qrEngine.generatePngBuffer(url, 600);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400'
      });
      return res.end(buf);
    } catch (err) {
      return sendJson(res, 500, { success: false, message: 'QR generation failed' });
    }
  }

  if (pathname.startsWith('/api/qr/venue/') && pathname.endsWith('.png')) {
    try {
      const slug = pathname.replace('/api/qr/venue/', '').replace('.png', '');
      const venue = db.getVenueBySlug(slug);
      const url = qrEngine.getVenueUrl(venue || slug);
      const buf = await qrEngine.generatePngBuffer(url, 600);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400'
      });
      return res.end(buf);
    } catch (err) {
      return sendJson(res, 500, { success: false, message: 'Venue QR generation failed' });
    }
  }

  // -------------------------------------------------------------
  // 4. ADMIN AUTHENTICATION ENDPOINTS
  // -------------------------------------------------------------
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const { email, password } = await parseJsonBody(req);
      const ip = auth.getClientIp(req);
      const result = await auth.verifyCredentials(email, password, ip);

      if (!result.success) {
        return sendJson(res, 401, result);
      }

      // Safe HTTP-only session cookie
      const cookieHeader = `aquenza_admin_session=${encodeURIComponent(result.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`;
      return sendJson(res, 200, { success: true, admin: result.admin }, { 'Set-Cookie': cookieHeader });
    } catch (err) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    const session = auth.authenticateRequest(req);
    const cookies = auth.parseCookies(req);
    if (cookies.aquenza_admin_session) {
      auth.destroySession(cookies.aquenza_admin_session);
    }
    return sendJson(res, 200, { success: true }, {
      'Set-Cookie': 'aquenza_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    });
  }

  if (pathname === '/api/admin/session' && req.method === 'GET') {
    const session = auth.authenticateRequest(req);
    return sendJson(res, 200, { authenticated: Boolean(session), admin: session ? { email: session.email, role: session.role } : null });
  }

  // -------------------------------------------------------------
  // 5. PROTECTED ADMIN MANAGEMENT API
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/admin/')) {
    const session = auth.authenticateRequest(req);
    if (!session) {
      return sendJson(res, 401, { success: false, message: 'Unauthorized. Please sign in to the administrator portal.' });
    }

    // Stats
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      const venues = db.getVenues();
      const allDishes = db.data.menu_items;
      const reviews = db.getAllReviews();
      const enquiries = db.getEnquiries();
      return sendJson(res, 200, {
        success: true,
        venuesCount: venues.length,
        menuItemsCount: allDishes.length,
        reviewsCount: reviews.length,
        enquiriesCount: enquiries.length,
        companyQrUrl: qrEngine.getCompanyUrl()
      });
    }

    // Venues
    if (pathname === '/api/admin/venues' && req.method === 'GET') {
      return sendJson(res, 200, { success: true, venues: db.getVenues() });
    }

    if (pathname === '/api/admin/venues' && req.method === 'POST') {
      const venueData = await parseJsonBody(req);
      if (!venueData.name) return sendJson(res, 400, { success: false, message: 'Venue name is required.' });
      const saved = db.saveVenue(venueData);
      return sendJson(res, 200, { success: true, venue: saved });
    }

    if (pathname.startsWith('/api/admin/venues/') && req.method === 'DELETE') {
      const id = pathname.replace('/api/admin/venues/', '');
      db.deleteVenue(id);
      return sendJson(res, 200, { success: true });
    }

    // Menus
    if (pathname.startsWith('/api/admin/menu/') && req.method === 'GET') {
      const venueId = pathname.replace('/api/admin/menu/', '');
      return sendJson(res, 200, { success: true, categories: db.getMenuByVenue(venueId) });
    }

    if (pathname === '/api/admin/categories' && req.method === 'POST') {
      const catData = await parseJsonBody(req);
      const saved = db.saveCategory(catData);
      return sendJson(res, 200, { success: true, category: saved });
    }

    if (pathname === '/api/admin/menu-items' && req.method === 'POST') {
      const itemData = await parseJsonBody(req);
      const saved = db.saveMenuItem(itemData);
      return sendJson(res, 200, { success: true, item: saved });
    }

    if (pathname.startsWith('/api/admin/menu-items/') && req.method === 'DELETE') {
      const id = pathname.replace('/api/admin/menu-items/', '');
      db.deleteMenuItem(id);
      return sendJson(res, 200, { success: true });
    }

    // Reviews
    if (pathname === '/api/admin/reviews' && req.method === 'GET') {
      const reviews = db.getAllReviews();
      const venues = db.getVenues();
      const enriched = reviews.map(r => {
        const v = venues.find(ven => ven.id === r.venue_id);
        return { ...r, venue_name: v ? v.name : r.venue_id };
      });
      return sendJson(res, 200, { success: true, reviews: enriched });
    }

    if (pathname.startsWith('/api/admin/reviews/') && pathname.endsWith('/moderate') && req.method === 'POST') {
      const id = pathname.replace('/api/admin/reviews/', '').replace('/moderate', '');
      const { status } = await parseJsonBody(req);
      const updated = db.moderateReview(id, status);
      return sendJson(res, 200, { success: true, review: updated });
    }

    // Enquiries
    if (pathname === '/api/admin/enquiries' && req.method === 'GET') {
      return sendJson(res, 200, { success: true, enquiries: db.getEnquiries() });
    }

    if (pathname.startsWith('/api/admin/enquiries/') && pathname.endsWith('/status') && req.method === 'POST') {
      const id = pathname.replace('/api/admin/enquiries/', '').replace('/status', '');
      const { status } = await parseJsonBody(req);
      const updated = db.updateEnquiryStatus(id, status);
      return sendJson(res, 200, { success: true, enquiry: updated });
    }

    // Email status & test
    if (pathname === '/api/admin/email-status' && req.method === 'GET') {
      return sendJson(res, 200, mailer.getStatus());
    }

    if (pathname === '/api/admin/email-test' && req.method === 'POST') {
      try {
        const result = await mailer.sendTestEmail();
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { success: false, message: err.message });
      }
    }

    // Change Password
    if (pathname === '/api/admin/change-password' && req.method === 'POST') {
      const { currentPassword, newPassword } = await parseJsonBody(req);
      const admin = db.findAdminByEmail(session.email);
      const bcrypt = require('bcryptjs');
      if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
        return sendJson(res, 400, { success: false, message: 'Current administrator password is incorrect.' });
      }
      db.changeAdminPassword(session.email, newPassword);
      return sendJson(res, 200, { success: true, message: 'Password updated successfully.' });
    }
  }

  // -------------------------------------------------------------
  // 6. DYNAMIC CUSTOMER VENUE PAGES (/qr/:slug)
  // -------------------------------------------------------------
  if (pathname.startsWith('/qr/') && !pathname.includes('.')) {
    const slug = pathname.replace('/qr/', '').toLowerCase().trim();
    const venue = db.getVenueBySlug(slug);

    if (venue && venue.status === 'active') {
      if (venue.destination_url && venue.destination_url.trim()) {
        const dest = venue.destination_url.trim();
        if (dest !== pathname && dest !== `/qr/${slug}`) {
          res.writeHead(302, { 'Location': dest });
          return res.end();
        }
      }
      const menu = db.getMenuByVenue(venue.id);
      const reviews = db.getReviews(venue.id, 'approved');
      const html = renderVenuePage(venue, menu, reviews, qrEngine.baseUrl);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end(html);
    } else if (venue && venue.status === 'disabled') {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Venue Inactive - AQUENZA</title><link rel="stylesheet" href="/css/style.css"></head>
        <body style="min-height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2rem; background:#F8FAFC;">
          <h2>Venue Page Inactive</h2>
          <p style="color:#64748B; margin:1rem 0 2rem;">This digital table portal has been temporarily disabled by the administrator.</p>
          <a href="/" class="btn btn-primary">Return to AQUENZA Home</a>
        </body>
        </html>
      `);
    }
  }

  // -------------------------------------------------------------
  // 7. PROTECTED ROUTE: /admin/dashboard
  // -------------------------------------------------------------
  if (pathname === '/admin/dashboard' || pathname === '/admin/dashboard.html') {
    const session = auth.authenticateRequest(req);
    if (!session) {
      res.writeHead(302, { 'Location': '/admin/login' });
      return res.end();
    }
    pathname = '/admin/dashboard.html';
  }

  if (pathname === '/admin/login') {
    pathname = '/admin/login.html';
  }

  // -------------------------------------------------------------
  // 8. STATIC FILE SERVING
  // -------------------------------------------------------------
  if (pathname === '/') {
    pathname = '/index.html';
  } else if (!path.extname(pathname)) {
    if (fs.existsSync(path.join(PUBLIC_DIR, pathname + '.html'))) {
      pathname = pathname + '.html';
    }
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Page Not Found - AQUENZA</title>
          <link rel="stylesheet" href="/css/style.css">
          <style>
            .nf-box { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
          </style>
        </head>
        <body>
          <div class="nf-box">
            <h1 style="color: #0052CC; font-size: 3.5rem; margin-bottom: 0.5rem; font-weight:800;">404</h1>
            <h2>Page Not Found</h2>
            <p style="color: #64748B; margin: 1rem 0 2rem;">The requested AQUENZA resource does not exist.</p>
            <a href="/" class="btn btn-primary">Return to Homepage</a>
          </div>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  AQUENZA — YOUR BRAND. OUR BOTTLE.`);
  console.log(`  Web Server running at: http://localhost:${PORT}`);
  console.log(`  Public Gateway URL: ${qrEngine.baseUrl}`);
  console.log(`  Admin Login: http://localhost:${PORT}/admin/login`);
  console.log(`====================================================`);

  // Ensure production QR codes are pre-generated
  try {
    await qrEngine.generateStaticAssets();
  } catch (qrErr) {
    console.error('Initial QR generation warning:', qrErr.message);
  }
});
