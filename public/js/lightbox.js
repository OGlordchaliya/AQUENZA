// AQUENZA Interactive High-Resolution Original Label Lightbox
(function() {
  const GALLERY_IMAGES = [
    {
      src: '/assets/label_photo_original.jpeg',
      title: 'Original Physical Label Sheet (Photographed Source)',
      caption: 'Direct photograph (2304 × 4096 px) of the physical printed 500 ml AQUENZA label sheet with signature royal blue & cyan wave flow, drop emblem, and regulatory disclosures.',
      downloadName: 'aquenza_original_label_photo.jpeg'
    },
    {
      src: '/assets/clean/500ml_label_sheet_photo.png',
      title: '500 ml Label Layout Sheet (Calibrated Scan)',
      caption: 'Clean high-resolution production sheet (2339 × 1654 px) displaying 3-panel continuous wrap dimensions for regional bottling execution.',
      downloadName: 'aquenza_500ml_label_sheet.png'
    },
    {
      src: '/assets/references/115085.jpg',
      title: '500 ml Bottle Physical Reference',
      caption: 'Master reference photograph supplied by client: 500 ml clear cylindrical glass/PET bottle with white screw cap and standard AQUENZA brand livery.',
      downloadName: 'aquenza_500ml_bottle_reference.jpg'
    }
  ];

  let currentIndex = 0;
  let zoomLevel = 1;
  let isDragging = false;
  let startX = 0, startY = 0, translateX = 0, translateY = 0;

  function createLightboxHtml() {
    if (document.getElementById('aquenzaLightbox')) return;

    const overlay = document.createElement('div');
    overlay.id = 'aquenzaLightbox';
    overlay.className = 'aqz-lightbox-overlay';
    overlay.innerHTML = `
      <div class="aqz-lightbox-header">
        <div class="aqz-lightbox-title-wrap">
          <h4 id="aqzLightboxTitle" class="aqz-lightbox-title">Original Label View</h4>
          <span id="aqzLightboxCounter" class="aqz-lightbox-counter">1 / 3</span>
        </div>
        <div class="aqz-lightbox-actions">
          <button id="aqzZoomIn" class="aqz-lightbox-btn" title="Zoom In (+)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button id="aqzZoomOut" class="aqz-lightbox-btn" title="Zoom Out (-)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button id="aqzZoomReset" class="aqz-lightbox-btn" title="Reset Zoom">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          </button>
          <a id="aqzDownloadBtn" href="#" download class="aqz-lightbox-btn" title="Download Original Photo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </a>
          <button id="aqzCloseBtn" class="aqz-lightbox-btn aqz-close-btn" title="Close (Esc)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div class="aqz-lightbox-viewport" id="aqzViewport">
        <button id="aqzPrevBtn" class="aqz-nav-arrow aqz-prev" title="Previous Image (Left Arrow)">‹</button>
        <div class="aqz-lightbox-canvas" id="aqzCanvas">
          <img id="aqzLightboxImg" src="" alt="AQUENZA Original Asset" draggable="false">
        </div>
        <button id="aqzNextBtn" class="aqz-nav-arrow aqz-next" title="Next Image (Right Arrow)">›</button>
      </div>

      <div class="aqz-lightbox-footer">
        <p id="aqzLightboxCaption" class="aqz-lightbox-caption"></p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('aqzCloseBtn').addEventListener('click', closeLightbox);
    document.getElementById('aqzPrevBtn').addEventListener('click', prevImage);
    document.getElementById('aqzNextBtn').addEventListener('click', nextImage);
    document.getElementById('aqzZoomIn').addEventListener('click', () => adjustZoom(0.3));
    document.getElementById('aqzZoomOut').addEventListener('click', () => adjustZoom(-0.3));
    document.getElementById('aqzZoomReset').addEventListener('click', resetZoom);

    // Drag / Pan Handling
    const canvas = document.getElementById('aqzCanvas');
    canvas.addEventListener('mousedown', (e) => {
      if (zoomLevel <= 1) return;
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      canvas.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const viewport = document.getElementById('aqzViewport');
    if (viewport) {
      viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (zoomLevel <= 1) {
          const diff = touchEndX - touchStartX;
          if (diff > 50) prevImage();
          else if (diff < -50) nextImage();
        }
      }, { passive: true });
    }

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      const box = document.getElementById('aquenzaLightbox');
      if (!box || !box.classList.contains('active')) return;

      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'ArrowRight') nextImage();
      else if (e.key === '+' || e.key === '=') adjustZoom(0.2);
      else if (e.key === '-' || e.key === '_') adjustZoom(-0.2);
      else if (e.key === '0') resetZoom();
    });
  }

  function updateImage() {
    const item = GALLERY_IMAGES[currentIndex];
    const img = document.getElementById('aqzLightboxImg');
    const title = document.getElementById('aqzLightboxTitle');
    const caption = document.getElementById('aqzLightboxCaption');
    const counter = document.getElementById('aqzLightboxCounter');
    const download = document.getElementById('aqzDownloadBtn');

    img.src = item.src;
    title.textContent = item.title;
    caption.textContent = item.caption;
    counter.textContent = `${currentIndex + 1} / ${GALLERY_IMAGES.length}`;
    download.href = item.src;
    download.download = item.downloadName || 'aquenza_asset';

    resetZoom();
  }

  function adjustZoom(delta) {
    zoomLevel = Math.max(0.5, Math.min(4, zoomLevel + delta));
    const canvas = document.getElementById('aqzCanvas');
    if (canvas) canvas.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
    updateTransform();
  }

  function resetZoom() {
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;
    const canvas = document.getElementById('aqzCanvas');
    if (canvas) canvas.style.cursor = 'default';
    updateTransform();
  }

  function updateTransform() {
    const img = document.getElementById('aqzLightboxImg');
    if (img) {
      img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    }
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % GALLERY_IMAGES.length;
    updateImage();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
    updateImage();
  }

  function openLightbox(index = 0) {
    createLightboxHtml();
    currentIndex = index;
    updateImage();
    const box = document.getElementById('aquenzaLightbox');
    if (box) {
      box.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    const box = document.getElementById('aquenzaLightbox');
    if (box) {
      box.classList.remove('active');
      document.body.style.overflow = '';
      resetZoom();
    }
  }

  // Global exposure
  window.openReferenceModal = function(src, title, caption) {
    createLightboxHtml();
    // Find index matching src
    const idx = GALLERY_IMAGES.findIndex(img => img.src === src || src.includes(img.src));
    if (idx !== -1) {
      openLightbox(idx);
    } else {
      // Dynamic single image
      GALLERY_IMAGES.push({ src, title: title || 'AQUENZA Asset', caption: caption || '', downloadName: 'aquenza_asset' });
      openLightbox(GALLERY_IMAGES.length - 1);
    }
  };

  window.openOriginalLabelGallery = function(index = 0) {
    openLightbox(index);
  };
})();

