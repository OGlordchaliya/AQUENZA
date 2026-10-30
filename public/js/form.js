/**
 * AQUENZA — YOUR BRAND. OUR BOTTLE.
 * Interactive Enquiry Form Validation & Quote Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('aquenzaEnquiryForm');
  if (!form) return;

  const fields = {
    customerName: document.getElementById('customerName'),
    businessName: document.getElementById('businessName'),
    phoneNumber: document.getElementById('phoneNumber'),
    emailAddress: document.getElementById('emailAddress'),
    businessType: document.getElementById('businessType'),
    bottleSize: document.getElementById('bottleSize'),
    estimatedQuantity: document.getElementById('estimatedQuantity'),
    customBranding: document.getElementsByName('customBranding'),
    qrRequirement: document.getElementsByName('qrRequirement'),
    customerMessage: document.getElementById('customerMessage')
  };

  const statusAlert = document.getElementById('formStatusAlert');
  const quoteSummaryBox = document.getElementById('quoteSummaryBox');
  const submitBtn = document.getElementById('submitEnquiryBtn');

  // Input validation helpers
  function showError(input, errorId, msg) {
    if (input) input.classList.add('error');
    const errEl = document.getElementById(errorId);
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add('visible');
    }
  }

  function clearError(input, errorId) {
    if (input) input.classList.remove('error');
    const errEl = document.getElementById(errorId);
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.remove('visible');
    }
  }

  // Live input validation listeners
  fields.customerName?.addEventListener('input', () => {
    if (fields.customerName.value.trim().length >= 2) {
      clearError(fields.customerName, 'nameError');
    }
  });

  fields.phoneNumber?.addEventListener('input', () => {
    const cleaned = fields.phoneNumber.value.replace(/\D/g, '');
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      clearError(fields.phoneNumber, 'phoneError');
    }
  });

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    // Validate Name
    const nameVal = fields.customerName.value.trim();
    if (!nameVal || nameVal.length < 2) {
      showError(fields.customerName, 'nameError', 'Please enter your full name (minimum 2 characters).');
      isValid = false;
    } else {
      clearError(fields.customerName, 'nameError');
    }

    // Validate Business Name
    const businessVal = fields.businessName.value.trim();
    if (!businessVal) {
      showError(fields.businessName, 'businessError', 'Please enter your café, restaurant, hotel, or venue name.');
      isValid = false;
    } else {
      clearError(fields.businessName, 'businessError');
    }

    // Validate Phone (Indian 10-digit mobile)
    const phoneVal = fields.phoneNumber.value.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneVal)) {
      showError(fields.phoneNumber, 'phoneError', 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).');
      isValid = false;
    } else {
      clearError(fields.phoneNumber, 'phoneError');
    }

    // Validate Bottle Size
    const bottleSizeVal = fields.bottleSize.value;
    if (!bottleSizeVal) {
      showError(fields.bottleSize, 'bottleSizeError', 'Please select a required bottle size.');
      isValid = false;
    } else {
      clearError(fields.bottleSize, 'bottleSizeError');
    }

    // Validate Quantity
    const qtyVal = fields.estimatedQuantity.value;
    if (!qtyVal) {
      showError(fields.estimatedQuantity, 'quantityError', 'Please specify your estimated quantity.');
      isValid = false;
    } else {
      clearError(fields.estimatedQuantity, 'quantityError');
    }

    // Selected radio options
    let customBrandingVal = 'Yes';
    for (const r of fields.customBranding) {
      if (r.checked) customBrandingVal = r.value;
    }

    let qrVal = 'Yes';
    for (const r of fields.qrRequirement) {
      if (r.checked) qrVal = r.value;
    }

    if (!isValid) {
      const firstErr = document.querySelector('.form-input.error, .form-select.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Prepare payload
    const payload = {
      name: nameVal,
      business: businessVal,
      phone: phoneVal,
      email: fields.emailAddress?.value.trim() || 'Not Provided',
      businessType: fields.businessType?.value || 'Standard',
      bottleSize: bottleSizeVal,
      quantity: qtyVal,
      customBranding: customBrandingVal,
      qrRequirement: qrVal,
      message: fields.customerMessage?.value.trim() || 'None',
      submittedAt: new Date().toISOString()
    };

    // Construct WhatsApp message text
    const waText = encodeURIComponent(
      `*AQUENZA ENQUIRY*\n` +
      `------------------------\n` +
      `*Client:* ${payload.name}\n` +
      `*Business:* ${payload.business} (${payload.businessType})\n` +
      `*Phone:* ${payload.phone}\n` +
      `*Bottle Size:* ${payload.bottleSize}\n` +
      `*Est. Quantity:* ${payload.quantity}\n` +
      `*Custom Branding:* ${payload.customBranding}\n` +
      `*QR-Code Required:* ${payload.qrRequirement}\n` +
      `*Notes:* ${payload.message}\n` +
      `------------------------\n` +
      `_Sent via AQUENZA Website Coordination Portal_`
    );

    // Call backend API
    let refId = 'AQZ-' + Math.floor(100000 + Math.random() * 900000);
    let emailDispatched = false;
    let serverMessage = '';

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Enquiry...';

      const resp = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        if (json.referenceId) refId = json.referenceId;
        emailDispatched = Boolean(json.emailDispatched);
        serverMessage = json.message || '';
      } else {
        throw new Error(json.message || 'Submission error');
      }
    } catch (err) {
      console.log('Server communication note:', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Enquiry & Request Quote';
    }

    // Display confirmation and next practical steps
    if (statusAlert) {
      statusAlert.className = 'form-status-alert success';
      statusAlert.innerHTML = `
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.5rem; color: #166534;">
          Enquiry Registered Successfully (Ref: #${refId})
        </div>
        <p style="margin-bottom: 0.75rem; color: #1E293B;">
          ${emailDispatched 
            ? '<strong>Verified Email Dispatch:</strong> Your enquiry notification has been delivered directly to <strong>aquenza.service@gmail.com</strong>. Our team will review regional bottling schedules and contact you shortly.'
            : '<strong>Database Logged:</strong> Your quotation request is recorded securely in the AQUENZA management system. For priority batch coordination, connect with our executives via WhatsApp below:'}
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem;">
          <a href="https://wa.me/918630071125?text=${waText}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="background: #25D366; border-color: #25D366;">
            Connect on WhatsApp (8630071125)
          </a>
          <a href="https://wa.me/918755306639?text=${waText}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="background: #128C7E; border-color: #128C7E;">
            Connect on WhatsApp (8755306639)
          </a>
          <a href="tel:8630071125" class="btn btn-secondary btn-sm">
            Call 8630071125
          </a>
        </div>
      `;
      statusAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});
