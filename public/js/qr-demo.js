/**
 * AQUENZA — CUSTOMER BUSINESS QR DESTINATION DEMO
 * Interactive Demonstration Script for 1 Litre Bottle QR Destination
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Menu Filter
  const filterBtns = document.querySelectorAll('.menu-filter-btn');
  const menuItems = document.querySelectorAll('.menu-card-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      menuItems.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // 2. Interactive Star Rating
  const stars = document.querySelectorAll('.star-rating-btn');
  let selectedRating = 5;

  stars.forEach((star, idx) => {
    star.addEventListener('click', () => {
      selectedRating = idx + 1;
      stars.forEach((s, sIdx) => {
        if (sIdx <= idx) {
          s.style.color = '#F59E0B';
        } else {
          s.style.color = '#D1D5DB';
        }
      });
    });
  });

  // 3. Feedback Form Submission Demo
  const feedbackForm = document.getElementById('venueFeedbackForm');
  const feedbackSuccess = document.getElementById('feedbackSuccessAlert');

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const guestName = document.getElementById('feedbackGuestName')?.value.trim() || 'Guest';
      const comments = document.getElementById('feedbackComments')?.value.trim() || 'Great experience!';

      feedbackForm.style.display = 'none';
      if (feedbackSuccess) {
        feedbackSuccess.style.display = 'block';
        feedbackSuccess.innerHTML = `
          <div style="font-weight: 700; color: #15803D; margin-bottom: 0.35rem;">
            Thank you, ${guestName}! (Rating: ${selectedRating}/5 stars)
          </div>
          <p style="font-size: 0.88rem; color: #166534;">
            Your feedback has been logged in this demonstration preview. In production, this response is routed securely to the venue management dashboard.
          </p>
        `;
      }
    });
  }
});
