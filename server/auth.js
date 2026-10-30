const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSIONS = new Map(); // token -> { adminId, email, expiresAt }
const LOGIN_ATTEMPTS = new Map(); // ip -> { count, lockedUntil }

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

class AuthManager {
  getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown-ip';
  }

  isRateLimited(ip) {
    const record = LOGIN_ATTEMPTS.get(ip);
    if (!record) return false;
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return true;
    }
    if (Date.now() >= record.lockedUntil) {
      LOGIN_ATTEMPTS.delete(ip);
      return false;
    }
    return false;
  }

  recordFailedAttempt(ip) {
    const record = LOGIN_ATTEMPTS.get(ip) || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_MS;
      console.warn(`[Security Alert] IP ${ip} locked out after ${MAX_ATTEMPTS} failed admin login attempts.`);
    }
    LOGIN_ATTEMPTS.set(ip, record);
    return record;
  }

  resetAttempts(ip) {
    LOGIN_ATTEMPTS.delete(ip);
  }

  createSession(admin) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(rawToken).digest('hex');
    const sessionToken = `${rawToken}.${signature}`;

    const expiresAt = Date.now() + SESSION_TTL_MS;
    SESSIONS.set(sessionToken, {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      expiresAt
    });

    db.updateAdminLogin(admin.id);
    return { token: sessionToken, expiresAt };
  }

  validateSessionToken(sessionToken) {
    if (!sessionToken || typeof sessionToken !== 'string') return null;
    const parts = sessionToken.split('.');
    if (parts.length !== 2) return null;

    const [rawToken, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(rawToken).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const session = SESSIONS.get(sessionToken);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      SESSIONS.delete(sessionToken);
      return null;
    }
    return session;
  }

  destroySession(sessionToken) {
    if (sessionToken) SESSIONS.delete(sessionToken);
  }

  parseCookies(req) {
    const list = {};
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(';').forEach(cookie => {
      let [name, ...rest] = cookie.split('=');
      name = name?.trim();
      if (!name) return;
      const value = rest.join('=').trim();
      list[name] = decodeURIComponent(value);
    });
    return list;
  }

  authenticateRequest(req) {
    const cookies = this.parseCookies(req);
    const token = cookies.aquenza_admin_session || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
    return this.validateSessionToken(token);
  }

  async verifyCredentials(email, password, ip) {
    if (this.isRateLimited(ip)) {
      const record = LOGIN_ATTEMPTS.get(ip);
      const remainingMin = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      return { success: false, rateLimited: true, message: `Too many failed login attempts. Temporarily locked for ${remainingMin} minutes.` };
    }

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return { success: false, message: 'Invalid credentials payload.' };
    }

    const admin = db.findAdminByEmail(email);
    if (!admin) {
      this.recordFailedAttempt(ip);
      return { success: false, message: 'Invalid administrative email or password.' };
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      this.recordFailedAttempt(ip);
      return { success: false, message: 'Invalid administrative email or password.' };
    }

    // Success
    this.resetAttempts(ip);
    const session = this.createSession(admin);
    return {
      success: true,
      token: session.token,
      admin: { id: admin.id, email: admin.email, role: admin.role }
    };
  }
}

module.exports = new AuthManager();

