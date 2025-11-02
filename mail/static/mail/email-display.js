/**
 * Email display functions with animations
 */

/**
 * Shows an email with animation
 * @param {object} email - The email object to display
 * @param {HTMLElement} container - The container element
 */
function displayEmail(email, container) {
	// Create a sanitized email object to prevent XSS attacks
	const sanitizedEmail = {
		...email,
		subject: escapeHtml(email.subject || '(No subject)'),
		body: formatEmailBody(email.body),
	};

	// Create the email detail element
	const emailDetail = document.createElement('div');
	emailDetail.className = 'email-detail card shadow animate-scaleUp';
	emailDetail.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center bg-light">
      <h5 class="mb-0 font-weight-bold text-primary">${sanitizedEmail.subject}</h5>
      <small class="text-muted font-italic">${sanitizedEmail.timestamp}</small>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-12">
          <div class="email-metadata mb-3 p-3 bg-light rounded shadow-sm animate-fadeInDown delay-100">
            <p class="mb-1"><strong class="text-dark">From:</strong> <span class="text-body">${
							sanitizedEmail.sender
						}</span></p>
            <p class="mb-1"><strong class="text-dark">To:</strong> <span class="text-body">${sanitizedEmail.recipients.join(
							', '
						)}</span></p>
          </div>
        </div>
      </div>
      
      <div class="row mb-3">
        <div class="col-12">
          <div class="d-flex flex-wrap animate-fadeInLeft delay-200">
            <button class="btn btn-sm btn-primary mr-2" id="reply-btn" title="Reply to this email">
              <i class="fas fa-reply mr-1"></i> Reply
            </button>
            <button class="btn btn-sm btn-outline-secondary" id="back-btn" title="Go back">
              <i class="fas fa-arrow-left mr-1"></i> Back
            </button>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <div class="email-body border-top pt-3 text-body animate-fadeInUp delay-300">
            ${sanitizedEmail.body}
          </div>
        </div>
      </div>
    </div>
  `;

	// Clear container and append the email detail
	container.innerHTML = '';
	container.appendChild(emailDetail);

	// Add reply button event listener
	emailDetail.querySelector('#reply-btn').addEventListener('click', () => {
		reply_to_email(email);
		window.notifications.info('Composing reply...', {
			animation: 'fadeInRight',
		});
	});

	// Add back button event listener
	emailDetail.querySelector('#back-btn').addEventListener('click', () => {
		window.history.back();
	});

	// Mark as read if needed
	if (!email.read) {
		mark_email_as_read(email.id);
	}

	return emailDetail;
}

// Export functions for use elsewhere
window.displayEmail = displayEmail;
