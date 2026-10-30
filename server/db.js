const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
const STORE_PATH = path.join(DATA_DIR, 'aquenza_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default state
const initialData = {
  admin_users: [],
  venues: [
    {
      id: 'venue-royal-bistro',
      slug: 'the-royal-bistro',
      name: 'The Royal Heritage Bistro',
      tagline: 'Fine Dining, Banquets & Artisanal Cuisine',
      category: 'Restaurant & Banquet',
      logo_url: '/assets/clean/aquenza_logo_clean.png',
      location: 'Civil Lines, Near Circuit House, Bijnor, UP 246701',
      map_url: 'https://maps.google.com/?q=Bijnor+Uttar+Pradesh',
      phone: '+91 86300 71125',
      email: 'contact@royalheritagebistro.com',
      opening_hours: '11:00 AM – 11:00 PM (All 7 Days)',
      announcement: 'Complimentary dessert on dining table reservations above ₹1500 this weekend!',
      status: 'active',
      qr_code_url: '/api/qr/venue/the-royal-bistro.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  menu_categories: [
    { id: 'cat-1', venue_id: 'venue-royal-bistro', name: 'Artisanal Starters', display_order: 1 },
    { id: 'cat-2', venue_id: 'venue-royal-bistro', name: 'Chef Special Main Course', display_order: 2 },
    { id: 'cat-3', venue_id: 'venue-royal-bistro', name: 'Refreshing Beverages', display_order: 3 },
    { id: 'cat-4', venue_id: 'venue-royal-bistro', name: 'Gourmet Desserts', display_order: 4 }
  ],
  menu_items: [
    { id: 'item-1', venue_id: 'venue-royal-bistro', category_id: 'cat-1', name: 'Paneer Malai Tikka', description: 'Fresh cottage cheese marinated in cardamom cream & grilled in clay oven', price: 295, is_vegetarian: true, is_available: true },
    { id: 'item-2', venue_id: 'venue-royal-bistro', category_id: 'cat-1', name: 'Crispy Corn & Water Chestnut Salt & Pepper', description: 'Wok tossed sweet corn kernels with crushed peppercorns and spring scallions', price: 260, is_vegetarian: true, is_available: true },
    { id: 'item-3', venue_id: 'venue-royal-bistro', category_id: 'cat-1', name: 'Dahi Ke Kebab', description: 'Hung yogurt patties blended with mild spices & shallow fried to golden perfection', price: 275, is_vegetarian: true, is_available: true },
    
    { id: 'item-4', venue_id: 'venue-royal-bistro', category_id: 'cat-2', name: 'Dal Makhani Royal Heritage', description: 'Slow cooked black lentils simmered for 24 hours with churned butter & cream', price: 340, is_vegetarian: true, is_available: true },
    { id: 'item-5', venue_id: 'venue-royal-bistro', category_id: 'cat-2', name: 'Paneer Lababdar', description: 'Cottage cheese chunks cooked in rich tomato-onion-cashew gravy with coriander', price: 380, is_vegetarian: true, is_available: true },
    { id: 'item-6', venue_id: 'venue-royal-bistro', category_id: 'cat-2', name: 'Subz Dum Biryani Handi', description: 'Aromatic basmati rice layered with garden vegetables and saffron milk, served with burani raita', price: 360, is_vegetarian: true, is_available: true },
    
    { id: 'item-7', venue_id: 'venue-royal-bistro', category_id: 'cat-3', name: 'AQUENZA Pure Alkaline Water (1 Litre)', description: 'Chilled custom-bottled drinking water served at table in eco-sealed glass format', price: 50, is_vegetarian: true, is_available: true },
    { id: 'item-8', venue_id: 'venue-royal-bistro', category_id: 'cat-3', name: 'Kaffir Lime & Mint Virgin Mojito', description: 'Fresh garden mint, crushed lime wedges, cane sugar syrup and sparkling soda', price: 180, is_vegetarian: true, is_available: true },
    { id: 'item-9', venue_id: 'venue-royal-bistro', category_id: 'cat-3', name: 'Royal Kesaria Thandai', description: 'Traditional crushed dry fruit milk infused with Kashmiri saffron strands and rose petals', price: 210, is_vegetarian: true, is_available: true },
    
    { id: 'item-10', venue_id: 'venue-royal-bistro', category_id: 'cat-4', name: 'Gulab Jamun with Saffron Rabri', description: 'Warm khoya dumplings soaked in fragrant cardamom sugar syrup over chilled rabri', price: 190, is_vegetarian: true, is_available: true },
    { id: 'item-11', venue_id: 'venue-royal-bistro', category_id: 'cat-4', name: 'Sizzling Brownie with Vanilla Bean Scoop', description: 'Fudgy Belgian chocolate walnut brownie topped with hot fudge syrup', price: 240, is_vegetarian: true, is_available: true }
  ],
  feedback_reviews: [
    {
      id: 'rev-1',
      venue_id: 'venue-royal-bistro',
      guest_name: 'Dr. Alok Verma',
      rating: 5,
      comments: 'Exceptional dining atmosphere! The custom-branded AQUENZA water bottles on the tables gave the restaurant a very high-end 5-star touch. Food quality was pristine.',
      status: 'approved',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'rev-2',
      venue_id: 'venue-royal-bistro',
      guest_name: 'Pooja Chauhan',
      rating: 5,
      comments: 'Loved scanning the bottle QR code right from our table to check the dessert menu and specials. Very smooth digital experience!',
      status: 'approved',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'rev-3',
      venue_id: 'venue-royal-bistro',
      guest_name: 'Rohit Agrawal',
      rating: 4,
      comments: 'Paneer Malai Tikka and Dal Makhani were superb. Fast service and courteous staff.',
      status: 'approved',
      created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ],
  enquiries: [],
  settings: {
    site_name: 'AQUENZA',
    public_site_url: process.env.PUBLIC_SITE_URL || 'https://aquenza.onrender.com',
    primary_phone: '8630071125',
    secondary_phone: '8755306639',
    contact_email: 'aquenza.service@gmail.com'
  }
};

class Database {
  constructor() {
    this.data = null;
    this.load();
    this.seedAdmin();
  }

  load() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all top-level keys exist if loaded from older structure
        for (const key of Object.keys(initialData)) {
          if (!this.data[key]) this.data[key] = initialData[key];
        }
      } else {
        this.data = JSON.parse(JSON.stringify(initialData));
        this.save();
      }
    } catch (err) {
      console.error('Failed reading database store, falling back to default:', err.message);
      this.data = JSON.parse(JSON.stringify(initialData));
    }
  }

  save() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error persisting database store:', err.message);
    }
  }

  seedAdmin() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@aquenza.in').toLowerCase().trim();
    const existing = this.data.admin_users.find(u => u.email === adminEmail);
    
    if (!existing) {
      const defaultPass = process.env.ADMIN_INITIAL_PASSWORD || 'Aquenza@2026!Admin';
      const hash = bcrypt.hashSync(defaultPass, 10);
      this.data.admin_users.push({
        id: 'admin-1',
        email: adminEmail,
        password_hash: hash,
        role: 'superadmin',
        created_at: new Date().toISOString(),
        last_login: null
      });
      this.save();
      console.log(`[Database] Initial Administrator seeded: ${adminEmail} (Initial setup credential active)`);
    }
  }

  // Admin Methods
  findAdminByEmail(email) {
    if (!email) return null;
    return this.data.admin_users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  updateAdminLogin(id) {
    const admin = this.data.admin_users.find(u => u.id === id);
    if (admin) {
      admin.last_login = new Date().toISOString();
      this.save();
    }
  }

  changeAdminPassword(email, newPlainPassword) {
    const admin = this.findAdminByEmail(email);
    if (!admin) return false;
    admin.password_hash = bcrypt.hashSync(newPlainPassword, 10);
    this.save();
    return true;
  }

  // Venues CRUD
  getVenues() {
    return this.data.venues;
  }

  getVenueBySlug(slug) {
    if (!slug) return null;
    return this.data.venues.find(v => v.slug.toLowerCase() === slug.toLowerCase().trim());
  }

  getVenueById(id) {
    return this.data.venues.find(v => v.id === id);
  }

  saveVenue(venueData) {
    const now = new Date().toISOString();
    if (venueData.id) {
      const idx = this.data.venues.findIndex(v => v.id === venueData.id);
      if (idx !== -1) {
        this.data.venues[idx] = { ...this.data.venues[idx], ...venueData, updated_at: now };
        this.save();
        return this.data.venues[idx];
      }
    }
    const newVenue = {
      id: 'venue-' + Math.random().toString(36).substring(2, 9),
      slug: venueData.slug || venueData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      ...venueData,
      status: venueData.status || 'active',
      created_at: now,
      updated_at: now
    };
    this.data.venues.push(newVenue);
    this.save();
    return newVenue;
  }

  deleteVenue(id) {
    this.data.venues = this.data.venues.filter(v => v.id !== id);
    this.data.menu_categories = this.data.menu_categories.filter(c => c.venue_id !== id);
    this.data.menu_items = this.data.menu_items.filter(i => i.venue_id !== id);
    this.data.feedback_reviews = this.data.feedback_reviews.filter(r => r.venue_id !== id);
    this.save();
    return true;
  }

  // Menu Methods
  getMenuByVenue(venueId) {
    const categories = this.data.menu_categories
      .filter(c => c.venue_id === venueId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const items = this.data.menu_items.filter(i => i.venue_id === venueId);

    return categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));
  }

  saveCategory(catData) {
    if (catData.id) {
      const idx = this.data.menu_categories.findIndex(c => c.id === catData.id);
      if (idx !== -1) {
        this.data.menu_categories[idx] = { ...this.data.menu_categories[idx], ...catData };
        this.save();
        return this.data.menu_categories[idx];
      }
    }
    const newCat = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      ...catData,
      display_order: catData.display_order || (this.data.menu_categories.length + 1)
    };
    this.data.menu_categories.push(newCat);
    this.save();
    return newCat;
  }

  saveMenuItem(itemData) {
    if (itemData.id) {
      const idx = this.data.menu_items.findIndex(i => i.id === itemData.id);
      if (idx !== -1) {
        this.data.menu_items[idx] = { ...this.data.menu_items[idx], ...itemData };
        this.save();
        return this.data.menu_items[idx];
      }
    }
    const newItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      ...itemData,
      is_available: itemData.is_available !== undefined ? itemData.is_available : true,
      is_vegetarian: itemData.is_vegetarian !== undefined ? itemData.is_vegetarian : true
    };
    this.data.menu_items.push(newItem);
    this.save();
    return newItem;
  }

  deleteMenuItem(id) {
    this.data.menu_items = this.data.menu_items.filter(i => i.id !== id);
    this.save();
    return true;
  }

  // Feedback & Reviews Methods
  getReviews(venueId, statusOnly = 'approved') {
    let reviews = this.data.feedback_reviews;
    if (venueId) reviews = reviews.filter(r => r.venue_id === venueId);
    if (statusOnly) reviews = reviews.filter(r => r.status === statusOnly);
    return reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getAllReviews() {
    return this.data.feedback_reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  saveReview(reviewData) {
    const newRev = {
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      venue_id: reviewData.venue_id,
      guest_name: reviewData.guest_name || 'Guest',
      rating: Number(reviewData.rating) || 5,
      comments: reviewData.comments || '',
      status: reviewData.status || 'pending',
      created_at: new Date().toISOString()
    };
    this.data.feedback_reviews.push(newRev);
    this.save();
    return newRev;
  }

  moderateReview(id, newStatus) {
    const rev = this.data.feedback_reviews.find(r => r.id === id);
    if (rev) {
      rev.status = newStatus;
      this.save();
      return rev;
    }
    return null;
  }

  // Enquiries
  getEnquiries() {
    return this.data.enquiries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  saveEnquiry(enquiryData) {
    const refId = 'AQZ-' + Math.floor(100000 + Math.random() * 900000);
    const newEnquiry = {
      id: 'enq-' + Math.random().toString(36).substring(2, 9),
      reference_id: refId,
      name: enquiryData.name,
      phone: enquiryData.phone,
      email: enquiryData.email || '',
      bottle_size: enquiryData.bottleSize || enquiryData.bottle_size,
      quantity: enquiryData.quantity,
      custom_branding: enquiryData.customBranding || enquiryData.custom_branding || 'No',
      qr_required: enquiryData.qrRequired || enquiryData.qr_required || 'No',
      message: enquiryData.message || '',
      status: 'new',
      email_dispatched: false,
      created_at: new Date().toISOString()
    };
    this.data.enquiries.push(newEnquiry);
    this.save();
    return newEnquiry;
  }

  updateEnquiryStatus(id, newStatus) {
    const enq = this.data.enquiries.find(e => e.id === id);
    if (enq) {
      enq.status = newStatus;
      this.save();
      return enq;
    }
    return null;
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }
}

module.exports = new Database();

