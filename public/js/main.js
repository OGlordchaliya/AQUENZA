/**
 * AQUENZA — YOUR BRAND. OUR BOTTLE.
 * Main Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header Scroll Effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // 2. Mobile Menu Drawer Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');

  if (mobileBtn && mainNav) {
    function closeMobileNav() {
      mainNav.classList.remove('open');
      mobileBtn.setAttribute('aria-expanded', 'false');
    }

    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mainNav.classList.toggle('open');
      const isOpen = mainNav.classList.contains('open');
      mobileBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking navigation link
    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && !mobileBtn.contains(e.target)) {
        closeMobileNav();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        closeMobileNav();
      }
    });

    // Reset when resizing to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && mainNav.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  // 3. QR Digital Solutions Tab Switcher
  const qrTabs = document.querySelectorAll('.qr-tab-btn');
  const qrPanels = document.querySelectorAll('.qr-tab-panel');

  qrTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      
      qrTabs.forEach(t => t.classList.remove('active'));
      qrPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // 4. Modal Lightbox for Reference Inspection
  const modal = document.getElementById('referenceModal');
  const modalImg = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalCaption = document.getElementById('modalCaption');
  const closeBtn = document.getElementById('modalCloseBtn');

  window.openReferenceModal = function(src, title, caption) {
    if (modal && modalImg) {
      modalImg.src = src;
      if (modalTitle) modalTitle.textContent = title || 'AQUENZA Reference Asset';
      if (modalCaption) modalCaption.textContent = caption || '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeReferenceModal = function() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', window.closeReferenceModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.closeReferenceModal();
      }
    });
  }

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeReferenceModal();
    }
  });
});
