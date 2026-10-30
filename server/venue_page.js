function renderVenuePage(venue, menuCategoriesWithItems, reviews, baseUrl) {
  const starsHtml = (rating) => {
    let s = '';
    for (let i = 1; i <= 5; i++) {
      s += `<span style="color: ${i <= rating ? '#F59E0B' : '#CBD5E1'}; font-size: 1.1rem;">★</span>`;
    }
    return s;
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${venue.name} — Digital Menu & Dining Portal | AQUENZA</title>
  <meta name="description" content="Official digital table portal for ${venue.name} in ${venue.city || 'Bijnor'}. Browse current menus, specials, and leave verified dining feedback.">
  <link rel="icon" type="image/svg+xml" href="/assets/clean/aquenza_logo_horizontal.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/components.css">
  <style>
    .venue-portal-shell {
      max-width: 520px;
      margin: 0 auto;
      min-height: 100vh;
      background: var(--bg-primary);
      box-shadow: 0 0 35px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .venue-hero {
      background: linear-gradient(135deg, #002B49 0%, #001A2C 100%);
      color: #FFFFFF;
      padding: 2.25rem 1.5rem 1.75rem;
      text-align: center;
      position: relative;
    }
    .venue-co-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 180, 216, 0.15);
      border: 1px solid rgba(0, 180, 216, 0.4);
      color: #38BDF8;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }
    .venue-title {
      font-size: 1.55rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 0.25rem;
      color: #FFFFFF;
    }
    .venue-tagline {
      font-size: 0.85rem;
      color: #94A3B8;
      margin-bottom: 1rem;
    }
    .venue-quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      margin-top: 1rem;
    }
    .venue-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #FFFFFF;
      font-size: clamp(0.72rem, 3.2vw, 0.82rem);
      font-weight: 600;
      padding: 0.6rem 0.5rem;
      border-radius: 8px;
      text-decoration: none;
      transition: background 0.2s;
      min-width: 0;
    }
    @media (max-width: 360px) {
      .venue-hero { padding: 1.75rem 1rem 1.25rem; }
      .venue-title { font-size: 1.3rem; }
      .venue-quick-actions { grid-template-columns: 1fr; }
      .venue-body { padding: 1rem 0.75rem 2.5rem; }
    }
    .venue-action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .venue-body {
      padding: 1.25rem 1.25rem 3rem;
      flex-grow: 1;
    }
    .announcement-banner {
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      color: #92400E;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      font-size: 0.84rem;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 1.25rem;
    }
    [data-theme="dark"] .announcement-banner {
      background: #78350F;
      border-color: #B45309;
      color: #FEF3C7;
    }
    .menu-filter-nav {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin-bottom: 1.25rem;
      scrollbar-width: none;
    }
    .menu-filter-nav::-webkit-scrollbar { display: none; }
    .menu-pill {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.45rem 0.9rem;
      border-radius: 9999px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;
    }
    .menu-pill.active {
      background: #0052CC;
      color: #FFFFFF;
      border-color: #0052CC;
    }
    .menu-category-group {
      margin-bottom: 1.75rem;
    }
    .category-heading {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .menu-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 0.9rem 1rem;
      margin-bottom: 0.65rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .menu-card-left {
      flex-grow: 1;
    }
    .item-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.2rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .veg-indicator {
      width: 14px;
      height: 14px;
      border: 1.5px solid #16A34A;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .veg-dot {
      width: 6px;
      height: 6px;
      background: #16A34A;
      border-radius: 50%;
    }
    .item-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .item-price {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0052CC;
      white-space: nowrap;
    }
    [data-theme="dark"] .item-price {
      color: #38BDF8;
    }
    .feedback-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 2rem;
    }
    .star-select-row {
      display: flex;
      gap: 8px;
      margin: 0.5rem 0 1rem;
    }
    .star-btn {
      background: none;
      border: none;
      font-size: 1.6rem;
      cursor: pointer;
      color: #CBD5E1;
      padding: 0;
      transition: color 0.2s;
    }
    .star-btn.active { color: #F59E0B; }
    .portal-footer {
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      padding: 1.25rem;
      text-align: center;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body style="background: var(--bg-secondary);">

  <div class="venue-portal-shell">
    <!-- Hero Header -->
    <header class="venue-hero">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <button id="themeToggleBtn" class="theme-toggle-btn" aria-label="Toggle dark mode" style="background: rgba(255,255,255,0.15); color: #FFFFFF; border-color: rgba(255,255,255,0.3);">
          <svg class="theme-icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg class="theme-icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
        <div class="venue-co-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          AQUENZA 1L PREMIUM BOTTLE LINK
        </div>
      </div>

      <h1 class="venue-title">${venue.name}</h1>
      <p class="venue-tagline">${venue.tagline || 'Custom Branded Dining Experience'}</p>

      <div style="font-size: 0.8rem; color: #CBD5E1; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span>★ <strong>${avgRating}</strong> (${reviews.length} reviews)</span>
        <span>•</span>
        <span>${venue.opening_hours || 'Open Daily'}</span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="venue-quick-actions">
        ${venue.phone ? `<a href="tel:${venue.phone}" class="venue-action-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          Call Restaurant
        </a>` : ''}
        ${venue.map_url ? `<a href="${venue.map_url}" target="_blank" rel="noopener" class="venue-action-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
          Directions
        </a>` : ''}
      </div>
    </header>

    <!-- Body -->
    <main class="venue-body">
      ${venue.announcement ? `
        <div class="announcement-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div><strong>Special Promotion:</strong> ${venue.announcement}</div>
        </div>
      ` : ''}

      <!-- Menu Category Navigation -->
      <div class="menu-filter-nav">
        <button class="menu-pill active" data-category="all">All Dishes</button>
        ${menuCategoriesWithItems.map(c => `<button class="menu-pill" data-category="${c.id}">${c.name}</button>`).join('')}
      </div>

      <!-- Menu Categories & Items -->
      <div id="menuContainer">
        ${menuCategoriesWithItems.map(cat => `
          <section class="menu-category-group" data-category-group="${cat.id}">
            <h3 class="category-heading">${cat.name} (${cat.items.length})</h3>
            ${cat.items.map(item => `
              <div class="menu-card" data-category="${cat.id}">
                <div class="menu-card-left">
                  <div class="item-name">
                    ${item.is_vegetarian ? '<span class="veg-indicator"><span class="veg-dot"></span></span>' : ''}
                    <span>${item.name}</span>
                  </div>
                  ${item.description ? `<p class="item-desc">${item.description}</p>` : ''}
                </div>
                <div class="item-price">₹${item.price}</div>
              </div>
            `).join('')}
          </section>
        `).join('')}
      </div>

      <!-- Verified Guest Reviews Section -->
      <section style="margin-top: 2rem;">
        <h3 class="category-heading">Verified Table Reviews</h3>
        ${reviews.length > 0 ? reviews.map(r => `
          <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.9rem; margin-bottom: 0.65rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">${r.guest_name}</span>
              <div>${starsHtml(r.rating)}</div>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">${r.comments}</p>
          </div>
        `).join('') : '<p style="font-size: 0.85rem; color: var(--text-muted);">Be the first guest to share your dining experience!</p>'}
      </section>

      <!-- Dining Feedback Submission Form -->
      <section class="feedback-section">
        <h4 style="margin: 0 0 0.35rem; color: var(--text-primary); font-size: 1rem;">Rate Your Dining Experience</h4>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 1rem;">Share your review directly with venue management and help other diners.</p>

        <form id="venueFeedbackForm">
          <input type="hidden" id="feedbackRating" value="5">
          <div style="margin-bottom: 0.75rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Your Rating</label>
            <div class="star-select-row">
              <button type="button" class="star-btn active" data-val="1">★</button>
              <button type="button" class="star-btn active" data-val="2">★</button>
              <button type="button" class="star-btn active" data-val="3">★</button>
              <button type="button" class="star-btn active" data-val="4">★</button>
              <button type="button" class="star-btn active" data-val="5">★</button>
            </div>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Your Name</label>
            <input type="text" id="feedbackGuestName" required placeholder="e.g. Rahul Sharma" style="width: 100%; padding: 0.65rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.88rem;">
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;">Feedback &amp; Comments</label>
            <textarea id="feedbackComments" required rows="3" placeholder="Tell us about the food quality, service, or bottle presentation..." style="width: 100%; padding: 0.65rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.88rem; resize: vertical;"></textarea>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.75rem;">
            Submit Table Feedback
          </button>
        </form>

        <div id="feedbackAlert" style="display: none; margin-top: 1rem; padding: 0.85rem; border-radius: 6px; font-size: 0.85rem;"></div>
      </section>
    </main>

    <!-- Portal Footer with AQUENZA Sourcing Transparency -->
    <footer class="portal-footer">
      <div style="margin-bottom: 0.65rem;">
        <img src="/assets/clean/aquenza_logo_horizontal.svg" alt="AQUENZA" class="logo-light" style="height: 28px;">
        <img src="/assets/clean/aquenza_logo_horizontal_dark.svg" alt="AQUENZA" class="logo-dark" style="height: 28px;">
      </div>
      <p style="margin: 0 0 0.35rem;">
        Custom-Branded Water Bottle &amp; Digital QR Solution Coordinated by <strong>AQUENZA</strong>
      </p>
      <p style="margin: 0; font-size: 0.72rem; color: var(--text-muted);">
        Packaged-water coordinated strictly via certified regional bottling plants. Bijnor, Uttar Pradesh.
      </p>
      <div style="margin-top: 0.75rem;">
        <a href="/" style="color: #0052CC; text-decoration: none; font-weight: 600;">Upgrade Your Venue with AQUENZA Bottles →</a>
      </div>
    </footer>
  </div>

  <script src="/js/theme.js"></script>
  <script>
    // Menu Category Filter
    document.querySelectorAll('.menu-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        document.querySelectorAll('.menu-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.menu-category-group').forEach(grp => {
          if (cat === 'all' || grp.getAttribute('data-category-group') === cat) {
            grp.style.display = 'block';
          } else {
            grp.style.display = 'none';
          }
        });
      });
    });

    // Star Rating
    const starBtns = document.querySelectorAll('.star-btn');
    const ratingInput = document.getElementById('feedbackRating');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-val'), 10);
        ratingInput.value = val;
        starBtns.forEach(b => {
          const bVal = parseInt(b.getAttribute('data-val'), 10);
          if (bVal <= val) b.classList.add('active');
          else b.classList.remove('active');
        });
      });
    });

    // Feedback Form Submission
    const fbForm = document.getElementById('venueFeedbackForm');
    const fbAlert = document.getElementById('feedbackAlert');
    fbForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        venue_id: '${venue.id}',
        guest_name: document.getElementById('feedbackGuestName').value.trim(),
        rating: parseInt(ratingInput.value, 10),
        comments: document.getElementById('feedbackComments').value.trim()
      };

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          fbForm.reset();
          fbForm.style.display = 'none';
          fbAlert.style.display = 'block';
          fbAlert.style.background = '#ECFDF5';
          fbAlert.style.border = '1px solid #A7F3D0';
          fbAlert.style.color = '#065F46';
          fbAlert.innerHTML = '<strong>Thank you!</strong> Your feedback has been recorded securely and submitted for venue moderation.';
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      } catch (err) {
        fbAlert.style.display = 'block';
        fbAlert.style.background = '#FEF2F2';
        fbAlert.style.border = '1px solid #FECACA';
        fbAlert.style.color = '#991B1B';
        fbAlert.textContent = 'Submission error: ' + err.message;
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { renderVenuePage };

