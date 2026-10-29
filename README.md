# AQUENZA — YOUR BRAND. OUR BOTTLE.

> **Packaged-Water Supply & Custom-Branding Coordination Service**  
> Operational Hub: **Bijnor, Uttar Pradesh** | Expansion Corridors: **Chandpur & Najibabad**

---

## 1. Project Overview & Business Model

**AQUENZA** bridges the gap between generic water suppliers and premium hospitality venues. We do not manufacture water or bottles; we source factory-sealed, certified packaged-drinking-water bottles from licensed bottling partners and coordinate end-to-end custom label design, high-resolution printing, smart QR digital destinations, and reliable local delivery for restaurants, hotels, marriage gardens, and event organizers.

### Brand Identity & Guidelines
- **Company Name:** AQUENZA
- **Official Tagline:** *YOUR BRAND. OUR BOTTLE.*
- **Brand Colors:** Navy Blue (`#0A2540`), Royal Blue (`#0052CC`), Vibrant Cyan (`#00B4D8`), and Pure White (`#FFFFFF`).
- **Core Aesthetic:** Modern, water-inspired, trustworthy, minimalist glassmorphism, and responsive across mobile, tablet, and desktop.
- **Original Assets Reused:** Authentic photographed 500 ml label sheet, official vector AQUENZA logo, 500 ml bottle mockup, circular seal badges, and business presentation slides.

---

## 2. Directory Structure

```
d:\antigravity\aquanzensa\
├── .gitignore                      # Excludes secrets, node_modules, and logs
├── .env.example                    # Template for port, phone numbers, and SMTP
├── package.json                    # Scripts: "start", "dev"
├── server.js                       # Zero-dependency Node.js HTTP server + /api/enquiry endpoint
├── README.md                       # Complete technical & commercial manual
└── public/
    ├── index.html                  # Main Homepage (All 10 required sections)
    ├── about.html                  # About Us: Founders, Business Model & Bijnor Roots
    ├── catalogue.html              # Bottle Catalogue (200ml, 500ml photo, 1L Custom + Specs)
    ├── services.html               # Sourcing, Custom Labels, QR Ecosystem, Logistics
    ├── how-it-works.html           # 5-Step Coordination Process from Slide 4
    ├── qr-solutions.html           # Dual QR Architecture, URL Persistence & Tenant Security
    ├── service-areas.html          # Bijnor Priority Zone & Chandpur/Najibabad Roadmap
    ├── contact.html                # Enquiry Form, Phone Desks & WhatsApp Dispatch
    ├── qr-company.html             # Company QR Destination (for 200ml & 500ml scans)
    ├── qr-venue-demo.html          # Customer Venue QR Demo (for 1L custom bottle scans)
    ├── privacy.html                # Official Privacy Policy
    ├── terms.html                  # Official Terms & Conditions
    ├── css/
    │   ├── style.css               # Design system, CSS tokens, resets & layout
    │   └── components.css          # Navigation, cards, forms, tables & modals
    ├── js/
    │   ├── main.js                 # Header scroll, mobile drawer, tabs & lightbox
    │   ├── form.js                 # Validation, quote preview & WhatsApp formatting
    │   └── qr-demo.js              # Digital menu category filters & star rating
    └── assets/
        └── clean/                  # High-res clean PNGs, labels, slides & QR codes
```

---

## 3. How to Run Locally

### Prerequisites
- Node.js (v18+ or v24+ recommended) or Python 3

### Option A: Using Node.js (Zero external dependencies)
```bash
# In the project root directory (d:\antigravity\aquanzensa)
node server.js
```
The website will be live at: **`http://localhost:3000`**

### Option B: Using Python
```bash
cd public
python -m http.server 3000
```

---

## 4. Key Pages & Features

| Route | Page Name | Primary Purpose |
|---|---|---|
| `/` or `/index.html` | **Homepage** | Complete 10-section layout in required sequence with hero, catalogue, services, and enquiry |
| `/about.html` | **About Us** | Founders, transparent coordination model, and Bijnor roots |
| `/catalogue.html` | **Bottle Catalogue** | 200ml (no 'Premium'), 500ml (original photo), and 1L Custom ('Premium' permitted) |
| `/services.html` | **Our Services** | Detailed breakdown of sourcing, custom labels, QR ecosystem, and logistics |
| `/how-it-works.html` | **How It Works** | 5-step operational pipeline matching presentation slide 4 |
| `/qr-solutions.html` | **QR Digital Solutions** | Architecture explaining permanent URL persistence and account isolation |
| `/service-areas.html` | **Service Areas** | Distinguishes Bijnor active operations from Chandpur & Najibabad expansion |
| `/contact.html` | **Contact & Enquiry** | Interactive form, mobile validation, and direct WhatsApp links to 8630071125 & 8755306639 |
| `/qr-company.html` | **Company QR Portal** | Mobile-optimized gateway for 200ml and 500ml bottle scans |
| `/qr-venue-demo.html` | **Customer Venue Demo** | Simulated guest portal with interactive digital menu and feedback rating |
| `/privacy.html` | **Privacy Policy** | B2B data protection and transparency disclosures |
| `/terms.html` | **Terms & Conditions**| Agency coordination scope, client logo warranties, and legal jurisdiction |

---

## 5. Free Deployment Instructions & Commercial Terms

### Option 1: Vercel (Recommended for Fast Global Edge Delivery)
1. Push your project to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com) using your GitHub account.
3. Click **"Add New Project"** and select the `aquenza-website` repository.
4. Set Output Directory to `public` (or leave default if deploying static site).
5. Click **Deploy**. Vercel provides a free `*.vercel.app` SSL URL immediately.
*Commercial Terms Note:* Vercel's Hobby (Free) tier is intended for non-commercial or personal projects. For high-volume commercial business use, Vercel requires upgrading to the Pro plan ($20/user/mo) once business transactions scale.

### Option 2: Netlify (Generous Free Tier)
1. Drag and drop the `public` folder directly into [Netlify Drop](https://app.netlify.com/drop), or connect via GitHub.
2. Netlify provisions instant SSL, CDN caching, and form submission processing.
*Commercial Terms Note:* Netlify permits small business and commercial landing pages on its Starter plan within fair-use bandwidth limits (100 GB/month).

### Option 3: GitHub Pages (100% Free Static Hosting)
1. In your GitHub repository settings, go to **Pages**.
2. Select the `main` branch and `/public` folder as the source.
3. Your site will be published at `https://<username>.github.io/<repo-name>/`.
*Commercial Terms Note:* GitHub Pages terms prohibit using it as a primary e-commerce store with sensitive transactions, but allow corporate marketing and informational business websites.

---

## 6. Pre-Launch Legal & Regulatory Checklist

Before commencing commercial bottle supply in Bijnor, complete the following statutory items:

- [ ] **Bottler Agreement & FSSAI License Mapping:** Confirm that your partner bottling plant possesses an active **FSSAI Central/State License** and **BIS (ISI) Certification** (IS 14543 for Packaged Drinking Water).
- [ ] **Label Statutory Panel Verification:** Ensure all physical labels contain:
  1. Partner Manufacturer Name, Address & FSSAI License No.
  2. "Manufactured for / Marketed by: AQUENZA, Bijnor, UP"
  3. Batch No., Date of Manufacture, Best Before Date, and MRP.
  4. Mandatory nutritional & mineral information per FSSAI regulations.
- [ ] **Exact Bottle Die-Line Confirmation:** Verify physical bottle mold circumference with the supplier to ensure label height and wrap overlap match printing cylinders without wrinkling.
- [ ] **GST Registration:** Obtain GSTIN for AQUENZA under business services / wholesale agency trading.
- [ ] **Official Email Configuration:** Finalize and connect the official Google Workspace or business Gmail address to replace the temporary configuration placeholder.
- [ ] **Domain Registration:** Register `aquenza.in` or `aquenza.com` and connect DNS records to your deployment provider.
