const VIEWS = {
	EMAILS: 'emails-view',
	COMPOSE: 'compose-view',
};

// Add variable to track current mailbox
let currentMailbox = 'inbox';

// Data Bridge: Leer datos de Django pasados de forma segura
let djangoData = null;
try {
	const datosElement = document.getElementById('datos-django');
	if (datosElement) {
		djangoData = JSON.parse(datosElement.textContent);
	}
} catch (error) {
	console.error('Error parsing Django data:', error);
}

document.addEventListener('DOMContentLoaded', function () {
	// Add click handlers for navigation buttons
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);
	const draftsBtn = document.querySelector('#drafts');
	if (draftsBtn) {
		draftsBtn.addEventListener('click', () => load_drafts());
	}

	// Add test button event handler
	const testBtn = document.querySelector('#run-tests');
	if (testBtn) {
		testBtn.addEventListener('click', runEmailDisplayTests);
	}

	document.body.addEventListener('click', function (e) {
		if (e.target && e.target.closest('.toast-notification')) {
			const notification = e.target.closest('.toast-notification');
			notification.classList.remove('show');
			setTimeout(() => notification.remove(), 300);
		}
	});

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

	// Handle save draft button
	const saveDraftBtn = document.querySelector('#save-draft');
	if (saveDraftBtn) {
		saveDraftBtn.addEventListener('click', () => {
			// Get current form values
			const recipients = document.querySelector('#compose-recipients').value;
			const subject = document.querySelector('#compose-subject').value;
			const body = document.querySelector('#compose-body').value;

			// Only save if at least one field has content
			if (recipients.trim() || subject.trim() || body.trim()) {
				const draft = saveDraft(recipients, subject, body);
				window.notifications.success('Draft saved successfully!');
			} else {
				alert('Cannot save empty draft');
			}
		});
	}

	// Handle compose form submission
	const composeForm = document.querySelector('#compose-form');
	if (composeForm) {
		composeForm.addEventListener('submit', handleComposeSubmit);
	} else {
		console.error('#compose-form not found in DOM');
	}

	// By default, load the inbox
	load_mailbox('inbox');
});

// Helper function to get CSRF token from cookies
function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.substring(0, name.length + 1) === name + '=') {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

// Handle compose form submission
function handleComposeSubmit(event) {
	event.preventDefault();

	// Get form values
	const recipients = document.querySelector('#compose-recipients').value;
	const subject = document.querySelector('#compose-subject').value;
	const body = document.querySelector('#compose-body').value;

	// Validate form
	const errors = validateEmailForm(recipients, subject, body);

	// If there are errors, display them and return
	if (errors.length > 0) {
		const errorHTML = `
			<strong>Please correct the following errors:</strong>
			<ul class="mb-0">
				${errors.map((error) => `<li>${error}</li>`).join('')}
			</ul>
		`;
		window.notifications.error(errorHTML);
		return;
	}

	// Disable the submit button to prevent double submission
	const submitButton = document.querySelector('.btn-send');
	submitButton.disabled = true;
	submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Sending...';

	// Show sending indicator
	const sendingDiv = document.createElement('div');
	sendingDiv.className = 'alert alert-info';
	sendingDiv.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Sending email...`;
	document.querySelector('#compose-form').prepend(sendingDiv);

	// Get CSRF token
	const csrftoken = getCookie('csrftoken');

	// Send email using fetch (usando URL del data bridge)
	const composeUrl = djangoData?.api_urls?.compose || '/emails';
	fetch(composeUrl, {
		method: 'POST',
		body: JSON.stringify({
			recipients: recipients,
			subject: subject,
			body: body,
		}),
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken,
		},
	})
		.then((response) => {
			// Remove sending indicator
			sendingDiv.remove();

			if (!response.ok) {
				return response.json().then((data) => {
					throw new Error(data.error || 'Failed to send email');
				});
			}
			return response.json();
		})
		.then((data) => {
			// Re-enable submit button
			submitButton.disabled = false;
			submitButton.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Send';

			// Display success message
			window.notifications.success('Email sent successfully!');

			// If this was a draft being sent, delete the draft
			const draftId = document.querySelector('#compose-form').dataset.draftId;
			if (draftId) {
				deleteDraft(draftId);
				delete document.querySelector('#compose-form').dataset.draftId;
			}

			// Wait briefly to show the success message before redirecting
			setTimeout(() => {
				load_mailbox('sent');
			}, 1500);
		})
		.catch((error) => {
			console.error('Error sending email:', error);

			// Re-enable submit button
			submitButton.disabled = false;
			submitButton.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Send';

			// Display error message
			window.notifications.error(error.message || 'Network error occurred. Please try again.');
		});
}

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
		emailList.innerHTML = '<div class="p-3 text-muted">No drafts available</div>';
		return;
	}

	// Sort drafts by timestamp (newest first)
	drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

	drafts.forEach((draft) => {
		const draftDiv = document.createElement('div');
		draftDiv.className = 'email-item d-flex justify-content-between align-items-center p-3';
		draftDiv.innerHTML = `
            <div class="email-content">
                <div class="email-header">
                    <strong>To: ${draft.recipients || '(No recipients)'}</strong>
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
		document.querySelector('#compose-recipients').value = draft.recipients || '';
		document.querySelector('#compose-subject').value = draft.subject || '';
		document.querySelector('#compose-body').value = draft.body || '';

		// Store the draft ID to delete it if sent
		document.querySelector('#compose-form').dataset.draftId = draftId;
	}
}

function compose_email() {
	// Hide all views first
	hideAllViews();

	// Show compose view and update active state
	showView(VIEWS.COMPOSE);
	updateActiveButton('compose');

	// Reset header to default (in case it was changed for reply)
	document.querySelector('.compose-header h3').innerHTML =
		'<i class="fas fa-pen-fancy me-2"></i>Compose New Email';

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';

	// Remove any data attributes related to replies
	if (document.querySelector('#compose-form').dataset.replyTo) {
		delete document.querySelector('#compose-form').dataset.replyTo;
	}
}

function load_mailbox(mailbox) {
	// Store current mailbox for back button functionality
	currentMailbox = mailbox;

	// Hide all views first
	hideAllViews();

	// Show emails view
	const emailsView = document.querySelector('#' + VIEWS.EMAILS);
	showView(VIEWS.EMAILS);

	// Update active button
	updateActiveButton(mailbox);

	// Show the mailbox name and create container
	emailsView.innerHTML = `
        <div class="row mb-3">
            <div class="col-12">
                <h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="email-list"></div>
            </div>
        </div>
    `;

	// Fetch and display emails
	const mailboxBaseUrl = djangoData?.api_urls?.mailbox || '/emails';
	fetch(`${mailboxBaseUrl}/${mailbox}`)
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((emails) => {
			const emailList = document.querySelector('.email-list');

			if (emails.length === 0) {
				emailList.innerHTML = `
                    <div class="row">
                        <div class="col-12">
                            <div class="p-3 text-muted">No emails to display</div>
                        </div>
                    </div>`;
				return;
			}

			emails.forEach((email, index) => {
				const emailDiv = document.createElement('div');
				const animationDelay = Math.min(index * 50, 500);
				emailDiv.className = `email-item d-flex justify-content-between align-items-center p-3 ${
					email.read ? 'read' : 'unread'
				} animate-fadeInUp`;
				emailDiv.style.animationDelay = `${animationDelay}ms`;

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
                        <button class="btn btn-sm btn-outline-primary read-btn m-1" title="${
													email.read ? 'Mark as unread' : 'Mark as read'
												}">
                            ${
															email.read
																? '<i class="fas fa-envelope-open fs-6"></i>'
																: '<i class="fas fa-envelope fs-6"></i>'
														}
                        </button>
                        ${
													mailbox !== 'sent'
														? `
                            <button class="btn btn-sm ${
															email.archived ? 'btn-outline-success' : 'btn-outline-secondary'
														} archive-btn m-1" 
                                    title="${email.archived ? 'Move to inbox' : 'Archive'}">
                                ${
																	email.archived
																		? '<i class="fas fa-inbox"></i>'
																		: '<i class="fas fa-archive"></i>'
																}
                                <span class="d-none d-md-inline-block ml-1">${
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
				emailDiv.querySelector('.read-btn').addEventListener('click', (e) => {
					e.stopPropagation();
					toggle_read(email.id, email.read);
				});

				if (mailbox !== 'sent') {
					emailDiv.querySelector('.archive-btn').addEventListener('click', (e) => {
						e.stopPropagation();
						toggle_archive(email.id, email.archived);
					});
				}

				emailList.append(emailDiv);
			});
		});
}

function view_email(email_id) {
	const emailBaseUrl = djangoData?.api_urls?.email_detail || '/emails';
	fetch(`${emailBaseUrl}/${email_id}`)
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((email) => {
			// Create a sanitized email object to prevent XSS attacks
			const sanitizedEmail = {
				...email,
				subject: escapeHtml(email.subject || '(No subject)'),
				body: formatEmailBody(email.body),
			};

			document.querySelector('#emails-view').innerHTML = `
                <div class="email-detail card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${sanitizedEmail.subject}</h5>
                        <small class="text-muted">${sanitizedEmail.timestamp}</small>
                    </div>
                    <div class="card-body">
                        <div class="email-metadata mb-3 p-3 rounded">
                            <p class="mb-1"><strong>From:</strong> ${sanitizedEmail.sender}</p>
                            <p class="mb-1"><strong>To:</strong> ${sanitizedEmail.recipients.join(
															', '
														)}</p>
                        </div>
                        
                        <div class="email-actions mb-3">
                            <button class="btn btn-sm btn-outline-primary" id="reply-btn" title="Reply to this email">
                                <i class="fas fa-reply mr-1"></i> Reply
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" id="back-btn" title="Go back">
                                <i class="fas fa-arrow-left mr-1"></i> Back
                            </button>
                        </div>
                        
                        <div class="email-body border-top pt-3">
                            ${sanitizedEmail.body}
                        </div>
                    </div>
                </div>
            `;

			// Add reply button event listener
			document.querySelector('#reply-btn').addEventListener('click', () => {
				// Pass the original (unsanitized) email to preserve proper formatting
				reply_to_email(email);

				// Show success notification
				createAutoDisappearingAlert(
					'info',
					'Composing reply...',
					document.querySelector('#compose-form')
				);
			});

			// Add back button event listener
			document.querySelector('#back-btn').addEventListener('click', () => {
				load_mailbox(currentMailbox);
			});

			// Mark email as read if it isn't already
			if (!email.read) {
				mark_email_as_read(email_id);
			}
		})
		.catch((error) => {
			console.error('Error loading email:', error);
			document.querySelector('#emails-view').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading email. Please try again.
                </div>
            `;
		});
}

// Add new helper function for toggling read status
function toggle_archive(email_id, archived) {
	const button = event.target.closest('.archive-btn');
	button.disabled = true; // Prevent double-clicks

	const emailBaseUrl = djangoData?.api_urls?.email_detail || '/emails';
	const csrftoken = getCookie('csrftoken');

	return fetch(`${emailBaseUrl}/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			archived: !archived,
		}),
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken,
		},
	})
		.then(() => {
			// Update the button appearance
			handleArchiveStateChange(button, !archived);

			// Show a success message that will auto-dismiss
			const mailboxView = document.querySelector('#' + VIEWS.EMAILS);
			createAutoDisappearingAlert(
				'success',
				`Email ${archived ? 'unarchived' : 'archived'} successfully!`,
				mailboxView
			);

			setTimeout(() => load_mailbox('inbox'), 1000);
		})
		.catch((error) => {
			console.error('Error:', error);
			button.disabled = false;

			// Show error notification
			const mailboxView = document.querySelector('#' + VIEWS.EMAILS);
			createAutoDisappearingAlert(
				'danger',
				`Failed to ${archived ? 'unarchive' : 'archive'} email. Please try again.`,
				mailboxView
			);
		});
}

// New helper function to handle archive state changes
function handleArchiveStateChange(button, archived) {
	// Update button appearance based on archived state
	button.innerHTML = `<i class="fas fa-${
		archived ? 'inbox' : 'archive'
	}"></i> <span class="button-text ms-1">${archived ? 'Unarchive' : 'Archive'}</span>`;
	button.title = archived ? 'Move to inbox' : 'Archive';
	button.classList.toggle('btn-outline-success', archived);
	button.classList.toggle('btn-outline-secondary', !archived);

	// Update the email item to reflect archived state
	const emailItem = button.closest('.email-item');
	if (emailItem) {
		emailItem.classList.toggle('archived', archived);
	}

	// Re-enable the button
	button.disabled = false;
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

	// Update header to indicate this is a reply
	document.querySelector('.compose-header h3').innerHTML =
		'<i class="fas fa-reply mr-2"></i>Reply to Email';

	// Pre-fill composition fields
	document.querySelector('#compose-recipients').value = email.sender;

	// Handle subject line - add Re: if not already present
	document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ')
		? email.subject
		: `Re: ${email.subject}`;

	// Format the quoted message with better styling and line breaks
	const formattedDate = new Date(email.timestamp).toLocaleString();
	document.querySelector(
		'#compose-body'
	).value = `\n\n-----Original Message-----\nFrom: ${email.sender}\nDate: ${formattedDate}\nSubject: ${email.subject}\n\n${email.body}`;

	// Add a data attribute to track that this is a reply
	document.querySelector('#compose-form').dataset.replyTo = email.id;
}

function mark_email_as_read(email_id) {
	const emailBaseUrl = djangoData?.api_urls?.email_detail || '/emails';
	const csrftoken = getCookie('csrftoken');

	return fetch(`${emailBaseUrl}/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			read: true,
		}),
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken,
		},
	});
}

function updateActiveButton(currentView) {
	// Remove active class from all buttons
	['inbox', 'sent', 'archived', 'compose', 'drafts'].forEach((id) => {
		const button = document.querySelector('#' + id);
		if (button) {
			button.classList.remove('active');
			button.classList.remove('btn-nav-active');
		}
	});

	// Add active class to current button
	let buttonId = currentView;
	if (currentView === 'archive') {
		buttonId = 'archived';
	}

	const activeButton = document.querySelector('#' + buttonId);
	if (activeButton) {
		activeButton.classList.add('active');
		activeButton.classList.add('btn-nav-active');
	}
}

function toggle_read(email_id, read) {
	const button = event.target.closest('.read-btn');
	button.disabled = true; // Prevent double-clicks

	const emailBaseUrl = djangoData?.api_urls?.email_detail || '/emails';
	const csrftoken = getCookie('csrftoken');

	return fetch(`${emailBaseUrl}/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			read: !read,
		}),
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken,
		},
	})
		.then(() => {
			button.innerHTML = !read
				? '<i class="fas fa-envelope-open fs-6"></i>'
				: '<i class="fas fa-envelope fs-6"></i>';
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
	} else if (subject.length > 255) {
		errors.push('Subject must be less than 256 characters');
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

// Helper function for running tests - updated to work with Django static files
function runEmailDisplayTests() {
	// Since we're now loading the test script in the HTML, we can directly use the testEmailDisplay function
	if (typeof testEmailDisplay === 'undefined') {
		console.error('Test function not found. Make sure email-display.test.js is loaded.');
		document.querySelector('#emails-view').innerHTML = `
			<div class="alert alert-danger">
				<i class="fas fa-exclamation-circle mr-2"></i>
				Test script not found. Check console for details.
			</div>
		`;
		return;
	}

	// Run tests
	let results = testEmailDisplay();

	// If archive tests are available, run them too
	if (typeof testArchiveFunctionality === 'function') {
		const archiveResults = testArchiveFunctionality();

		// Merge the results
		results.totalTests += archiveResults.totalTests;
		results.passed += archiveResults.passed;
		results.failed += archiveResults.failed;
		results.details = results.details.concat(archiveResults.details);
	}

	// Create a results display
	const testResults = document.createElement('div');
	testResults.className = 'card mt-4 shadow-sm';
	testResults.innerHTML = `
		<div class="card-header bg-${results.failed > 0 ? 'warning' : 'success'} text-white">
			<h5 class="mb-0 font-weight-bold"><i class="fas fa-vial mr-2"></i> Email Display Tests</h5>
		</div>
		<div class="card-body">
			<div class="d-flex justify-content-between mb-3 p-3 rounded">
				<div>
					<h6 class="mb-1 text-muted">Total tests:</h6>
					<span class="h4 font-weight-bold">${results.totalTests}</span>
				</div>
				<div class="text-success">
					<h6 class="mb-1 text-success">Passed:</h6>
					<span class="h4 font-weight-bold">${results.passed}</span>
				</div>
				${
					results.failed > 0
						? `
						<div class="text-danger">
							<h6 class="mb-1 text-danger">Failed:</h6>
							<span class="h4 font-weight-bold">${results.failed}</span>
						</div>`
						: ''
				}
			</div>
			
			<div class="mt-4">
				<h6 class="font-weight-bold mb-3 border-bottom pb-2">Test Details:</h6>
				<ul class="list-group">
					${results.details
						.map(
							(test) => `
						<li class="list-group-item ${
							test.pass ? 'list-group-item-success' : 'list-group-item-danger'
						} d-flex justify-content-between align-items-start">
							<div class="ms-2 me-auto">
								<div class="fw-bold">${test.name}</div>
								${
									!test.pass
										? `
									<div class="mt-2 small">
										<div class="d-block"><strong>Actual:</strong> ${test.actual}</div>
										${test.expected ? `<div class="d-block"><strong>Expected:</strong> ${test.expected}</div>` : ''}
									</div>`
										: ''
								}
							</div>
							<span class="badge ${test.pass ? 'bg-success' : 'bg-danger'} rounded-pill">
								${test.pass ? 'PASS' : 'FAIL'}
							</span>
						</li>
					`
						)
						.join('')}
				</ul>
			</div>
		</div>
		<div class="card-footer d-flex justify-content-between">
			<span class="text-muted small">Tests completed at ${new Date().toLocaleTimeString()}</span>
			<button class="btn btn-primary btn-sm" id="close-test-results">
				<i class="fas fa-times mr-1"></i> Close
			</button>
		</div>
	`;

	// Display the results
	document.querySelector('#emails-view').innerHTML = '';
	document.querySelector('#emails-view').appendChild(testResults);

	// Add event listener to close button
	document.querySelector('#close-test-results').addEventListener('click', function () {
		location.reload();
	});
}
