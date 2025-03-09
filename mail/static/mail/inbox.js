const VIEWS = {
	EMAILS: 'emails-view',
	COMPOSE: 'compose-view',
};

document.addEventListener('DOMContentLoaded', function () {
	// Add click handlers for navigation buttons
	document
		.querySelector('#inbox')
		.addEventListener('click', () => load_mailbox('inbox'));
	document
		.querySelector('#sent')
		.addEventListener('click', () => load_mailbox('sent'));
	document
		.querySelector('#archived')
		.addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);
	const draftsBtn = document.querySelector('#drafts');
	if (draftsBtn) {
		draftsBtn.addEventListener('click', () => load_drafts());
	}

	// By default, load the inbox
	load_mailbox('inbox');
});

document.addEventListener('DOMContentLoaded', function () {
	// Handle close compose button
	const closeComposeBtn = document.querySelector('#close-compose');
	if (closeComposeBtn) {
		closeComposeBtn.addEventListener('click', () => load_mailbox('inbox'));
	}

	// Handle discard button
	const discardBtn = document.querySelector('#discard-email');
	if (discardBtn) {
		discardBtn.addEventListener('click', () => {
			if (confirm('Are you sure you want to discard this email?')) {
				load_mailbox('inbox');
			}
		});
	}

	// Handle save draft button (placeholder functionality)
	const saveDraftBtn = document.querySelector('#save-draft');
	if (saveDraftBtn) {
		saveDraftBtn.addEventListener('click', () => {
			// Get current form values
			const recipients = document.querySelector(
				'#compose-recipients'
			).value;
			const subject = document.querySelector('#compose-subject').value;
			const body = document.querySelector('#compose-body').value;

			// Only save if at least one field has content
			if (recipients.trim() || subject.trim() || body.trim()) {
				const draft = saveDraft(recipients, subject, body);

				// Show success message
				const successDiv = document.createElement('div');
				successDiv.className = 'alert alert-success compose-success';
				successDiv.innerHTML = `
                <i class="fas fa-check-circle mr-2"></i>
                Draft saved successfully!
            `;

				// Remove existing messages
				const existingSuccess =
					document.querySelector('.compose-success');
				if (existingSuccess) {
					existingSuccess.remove();
				}

				document.querySelector('#compose-form').prepend(successDiv);

				// Auto-remove success message after 3 seconds
				setTimeout(() => {
					if (successDiv.parentElement) {
						successDiv.remove();
					}
				}, 3000);
			} else {
				alert('Cannot save empty draft');
			}
		});
	}
});

function load_drafts() {
	// Hide all views first
	hideAllViews();

	// Show emails view
	const emailsView = document.querySelector('#' + VIEWS.EMAILS);
	showView(VIEWS.EMAILS);

	// Update active button
	updateActiveButton('drafts');

	// Get drafts from localStorage
	const drafts = getDrafts();

	// Show the drafts heading and create container
	emailsView.innerHTML = `
        <h3>Drafts</h3>
        <div class="email-list"></div>
    `;

	const emailList = document.querySelector('.email-list');

	if (drafts.length === 0) {
		emailList.innerHTML =
			'<div class="p-3 text-muted">No drafts available</div>';
		return;
	}

	// Sort drafts by timestamp (newest first)
	drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

	drafts.forEach((draft) => {
		const draftDiv = document.createElement('div');
		draftDiv.className =
			'email-item d-flex justify-content-between align-items-center p-3';
		draftDiv.innerHTML = `
            <div class="email-content">
                <div class="email-header">
                    <strong>To: ${
						draft.recipients || '(No recipients)'
					}</strong>
                    <span class="mx-2">·</span>
                    <span class="text-muted">${draft.timestamp}</span>
                </div>
                <div class="email-subject mt-1">
                    ${draft.subject || '(No subject)'}
                </div>
            </div>
            <div class="email-actions">
                <button class="btn btn-sm btn-outline-primary edit-btn" title="Edit Draft">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn ms-2" title="Delete Draft">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

		// Add hover effect
		draftDiv.style.cursor = 'pointer';
		draftDiv.style.transition = 'background-color 0.2s';

		// Add click handler to edit draft
		draftDiv.addEventListener('click', (e) => {
			if (!e.target.matches('button') && !e.target.matches('i')) {
				edit_draft(draft.id);
			}
		});

		// Add button handlers
		draftDiv.querySelector('.edit-btn').addEventListener('click', (e) => {
			e.stopPropagation();
			edit_draft(draft.id);
		});

		draftDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
			e.stopPropagation();
			if (confirm('Are you sure you want to delete this draft?')) {
				deleteDraft(draft.id);
				load_drafts(); // Reload drafts view
			}
		});

		emailList.append(draftDiv);
	});
}

function edit_draft(draftId) {
	const drafts = getDrafts();
	const draft = drafts.find((d) => d.id === draftId);

	if (draft) {
		// Show compose view
		compose_email();

		// Fill in the draft data
		document.querySelector('#compose-recipients').value =
			draft.recipients || '';
		document.querySelector('#compose-subject').value = draft.subject || '';
		document.querySelector('#compose-body').value = draft.body || '';

		// Store the draft ID to delete it if sent
		document.querySelector('#compose-form').dataset.draftId = draftId;
	}
}

// Update the compose form submit handler
document.querySelector('#compose-form').onsubmit = function (event) {
	event.preventDefault();

	// Get form values
	const recipients = document.querySelector('#compose-recipients').value;
	const subject = document.querySelector('#compose-subject').value;
	const body = document.querySelector('#compose-body').value;

	// Validate form
	const errors = validateEmailForm(recipients, subject, body);

	// Remove any existing error messages
	const existingError = document.querySelector('.compose-error');
	if (existingError) {
		existingError.remove();
	}

	// If there are errors, display them and return
	if (errors.length > 0) {
		const errorDiv = document.createElement('div');
		errorDiv.className = 'alert alert-danger compose-error';
		errorDiv.innerHTML = `
            <strong>Please correct the following errors:</strong>
            <ul class="mb-0">
                ${errors.map((error) => `<li>${error}</li>`).join('')}
            </ul>
        `;
		document.querySelector('#compose-form').prepend(errorDiv);
		return;
	}

	// Send email using fetch
	fetch('/emails', {
		method: 'POST',
		body: JSON.stringify({
			recipients: recipients,
			subject: subject,
			body: body,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	})
		.then((response) => {
			if (!response.ok) {
				return response.json().then((data) => {
					const errorDiv = document.createElement('div');
					errorDiv.className = 'alert alert-danger compose-error';
					errorDiv.textContent = data.error;
					document.querySelector('#compose-form').prepend(errorDiv);
					throw new Error(data.error);
				});
			}
			return response.json();
		})
		.then((result) => {
			// If this was a draft being sent, delete the draft
			const draftId =
				document.querySelector('#compose-form').dataset.draftId;
			if (draftId) {
				deleteDraft(draftId);
				delete document.querySelector('#compose-form').dataset.draftId;
			}

			load_mailbox('sent');
		})
		.catch((error) => {
			console.error('Error:', error);
		});
};

function compose_email() {
	// Hide all views first
	hideAllViews();

	// Show compose view and update active state
	showView(VIEWS.COMPOSE);
	updateActiveButton('compose');

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
	// Hide all views first
	hideAllViews();

	// Show emails view
	const emailsView = document.querySelector('#' + VIEWS.EMAILS);
	showView(VIEWS.EMAILS);

	// Update active button
	updateActiveButton(mailbox);

	// Show the mailbox name and create container
	emailsView.innerHTML = `
        <h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
        <div class="email-list"></div>
    `;

	// Fetch and display emails
	fetch(`/emails/${mailbox}`)
		.then((response) => response.json())
		.then((emails) => {
			const emailList = document.querySelector('.email-list');

			if (emails.length === 0) {
				emailList.innerHTML =
					'<div class="p-3 text-muted">No emails to display</div>';
				return;
			}

			emails.forEach((email) => {
				const emailDiv = document.createElement('div');
				emailDiv.className = `email-item d-flex justify-content-between align-items-center p-3 ${
					email.read ? 'read' : 'unread'
				}`;
				emailDiv.innerHTML = `
                    <div class="email-content">
                        <div class="email-header">
                            <strong>${
								mailbox === 'sent'
									? `To: ${email.recipients.join(', ')}`
									: `From: ${email.sender}`
							}</strong>
                            <span class="mx-2">·</span>
                            <span class="text-muted">${email.timestamp}</span>
                        </div>
                        <div class="email-subject mt-1">
                            ${email.subject || '(No subject)'}
                        </div>
                    </div>
                    <div class="email-actions">
                        <button class="btn btn-sm btn-outline-primary read-btn" title="${
							email.read ? 'Mark as unread' : 'Mark as read'
						}">
                            ${
								email.read
									? '<i class="fas fa-envelope-open"></i>'
									: '<i class="fas fa-envelope"></i>'
							}
                        </button>
                        ${
							mailbox !== 'sent'
								? `
                            <button class="btn btn-sm ${
								email.archived
									? 'btn-outline-success'
									: 'btn-outline-secondary'
							} archive-btn ms-2" 
                                    title="${
										email.archived
											? 'Move to inbox'
											: 'Archive'
									}">
                                ${
									email.archived
										? '<i class="fas fa-inbox"></i>'
										: '<i class="fas fa-archive"></i>'
								}
                                <span class="button-text ms-1">${
									email.archived ? 'Unarchive' : 'Archive'
								}</span>
                            </button>
                        `
								: ''
						}
                    </div>
                `;

				// Add hover effect
				emailDiv.style.cursor = 'pointer';
				emailDiv.style.transition = 'background-color 0.2s';

				// Add click handler to view email
				emailDiv.addEventListener('click', (e) => {
					if (!e.target.matches('button') && !e.target.matches('i')) {
						view_email(email.id);
					}
				});

				// Add button handlers
				emailDiv
					.querySelector('.read-btn')
					.addEventListener('click', (e) => {
						e.stopPropagation();
						toggle_read(email.id, email.read);
					});

				if (mailbox !== 'sent') {
					emailDiv
						.querySelector('.archive-btn')
						.addEventListener('click', (e) => {
							e.stopPropagation();
							toggle_archive(email.id, email.archived);
						});
				}

				emailList.append(emailDiv);
			});
		});
}

function view_email(email_id) {
	fetch(`/emails/${email_id}`)
		.then((response) => response.json())
		.then((email) => {
			document.querySelector('#emails-view').innerHTML = `
                <div class="email-detail card">
                    <div class="card-header">
                        <h5 class="mb-0">${email.subject}</h5>
                        <small class="text-muted">${email.timestamp}</small>
                    </div>
                    <div class="card-body">
                        <div class="email-metadata mb-3">
                            <p class="mb-1"><strong>From:</strong> ${
								email.sender
							}</p>
                            <p class="mb-1"><strong>To:</strong> ${email.recipients.join(
								', '
							)}</p>
                        </div>
                        
                        <div class="email-actions mb-3">
                            <button class="btn btn-sm btn-outline-primary" id="reply-btn">
                                Reply
                            </button>
                        </div>
                        
                        <div class="email-body">
                            ${email.body}
                        </div>
                    </div>
                </div>
            `;

			// Add reply button event listener
			document
				.querySelector('#reply-btn')
				.addEventListener('click', () => reply_to_email(email));

			// Mark email as read if it isn't already
			if (!email.read) {
				mark_email_as_read(email_id);
			}
		});
}

// Add new helper function for toggling read status
function toggle_archive(email_id, archived) {
	const button = event.target.closest('.archive-btn');
	button.disabled = true; // Prevent double-clicks

	return fetch(`/emails/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			archived: !archived,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	})
		.then(() => {
			button.innerHTML = `<i class="fas fa-check"></i> ${
				archived ? 'Unarchived' : 'Archived'
			}`;
			setTimeout(() => load_mailbox('inbox'), 1000);
		})
		.catch((error) => {
			console.error('Error:', error);
			button.disabled = false;
		});
}

function hideAllViews() {
	// Hide all views first
	Object.values(VIEWS).forEach((viewId) => {
		const view = document.querySelector('#' + viewId);
		view.style.display = 'none';
	});
}

function showView(viewId) {
	const view = document.querySelector('#' + viewId);
	view.style.display = 'block';
}

// Add new helper function for replying to emails
function reply_to_email(email) {
	// Show compose view
	compose_email();

	// Pre-fill composition fields
	document.querySelector('#compose-recipients').value = email.sender;
	document.querySelector('#compose-subject').value = email.subject.startsWith(
		'Re: '
	)
		? email.subject
		: `Re: ${email.subject}`;
	document.querySelector(
		'#compose-body'
	).value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
}

function mark_email_as_read(email_id) {
	return fetch(`/emails/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			read: true,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

function updateActiveButton(currentView) {
	// Remove active class from all buttons
	['inbox', 'sent', 'archived', 'compose'].forEach((id) => {
		const button = document.querySelector('#' + id);
		button.classList.remove('active');
	});

	// Add active class to current button
	const activeButton = document.querySelector('#' + currentView);
	if (activeButton) {
		activeButton.classList.add('active');
	}
}

function toggle_read(email_id, read) {
	const button = event.target.closest('.read-btn');
	button.disabled = true; // Prevent double-clicks

	return fetch(`/emails/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			read: !read,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	})
		.then(() => {
			button.innerHTML = !read
				? '<i class="fas fa-envelope-open"></i>'
				: '<i class="fas fa-envelope"></i>';
			button.title = !read ? 'Mark as unread' : 'Mark as read';

			// Update email item background
			const emailItem = button.closest('.email-item');
			emailItem.classList.toggle('read');
			emailItem.classList.toggle('unread');

			button.disabled = false;
		})
		.catch((error) => {
			console.error('Error:', error);
			button.disabled = false;
		});
}

// helper function for validation
function validateEmailForm(recipients, subject, body) {
	const errors = [];

	// Validate recipients
	if (!recipients.trim()) {
		errors.push('Recipients field is required');
	} else {
		// Check email format for each recipient
		const emailList = recipients.split(',').map((email) => email.trim());
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		emailList.forEach((email) => {
			if (!emailRegex.test(email)) {
				errors.push(`Invalid email format: ${email}`);
			}
		});
	}

	// Validate subject
	if (!subject.trim()) {
		errors.push('Subject field is required');
	}

	// Validate body
	if (!body.trim()) {
		errors.push('Email body is required');
	}

	return errors;
}

// functions for draft management
function saveDraft(recipients, subject, body) {
	const drafts = getDrafts();
	const draftId = Date.now().toString(); // timestamp as unique ID

	// Create new draft object
	const draft = {
		id: draftId,
		recipients: recipients,
		subject: subject,
		body: body,
		timestamp: new Date().toLocaleString(),
	};

	// Add to drafts array
	drafts.push(draft);

	// Save to localStorage
	localStorage.setItem('emailDrafts', JSON.stringify(drafts));

	return draft;
}

function getDrafts() {
	const draftsString = localStorage.getItem('emailDrafts');
	return draftsString ? JSON.parse(draftsString) : [];
}

function deleteDraft(draftId) {
	let drafts = getDrafts();
	drafts = drafts.filter((draft) => draft.id !== draftId);
	localStorage.setItem('emailDrafts', JSON.stringify(drafts));
}
