const VIEWS = {
	EMAILS: 'emails-view',
	COMPOSE: 'compose-view',
};

document.addEventListener('DOMContentLoaded', function () {
	console.log('DOM loaded'); // Debug log

	const emailsView = document.querySelector('#emails-view');
	const composeView = document.querySelector('#compose-view');

	if (!emailsView || !composeView) {
		console.error('Required view elements not found!');
		return;
	}

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => {
		load_mailbox('inbox');
	});

	document.querySelector('#sent').addEventListener('click', () => {
		load_mailbox('sent');
	});

	document.querySelector('#archived').addEventListener('click', () => {
		load_mailbox('archive');
	});

	document.querySelector('#compose').addEventListener('click', () => {
		compose_email();
	});

	// By default, load the inbox and set it as active
	load_mailbox('inbox');

	// Add submit handler to compose form
	document.querySelector('#compose-form').onsubmit = function (event) {
		event.preventDefault();

		// Get form values
		const recipients = document.querySelector('#compose-recipients').value;
		const subject = document.querySelector('#compose-subject').value;
		const body = document.querySelector('#compose-body').value;

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
						console.error('Error:', data.error);
						throw new Error(data.error);
					});
				}
				return response.json();
			})
			.then((result) => {
				console.log('Success:', result);
				load_mailbox('sent');
			})
			.catch((error) => {
				console.error('Error:', error);
			});
	};
});

function compose_email() {
	// Hide all views first
	hideAllViews();

	// Show compose view
	document.querySelector('#' + VIEWS.COMPOSE).style.display = 'block';

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

	// Add console.log for debugging
	console.log('Loading mailbox:', mailbox);
	console.log('Emails view element:', emailsView);

	// Show the mailbox name with styling
	emailsView.innerHTML = `
        <h3 class="mb-3">${
			mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
		}</h3>
        <div class="email-list"></div>
    `;

	// Add active state to current mailbox button
	updateActiveButton(mailbox);

	// Fetch emails for the mailbox
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
                        <button class="btn btn-sm btn-outline-primary read-btn">
                            ${
								email.read
									? '<i class="fas fa-envelope-open"></i>'
									: '<i class="fas fa-envelope"></i>'
							}
                        </button>
                        ${
							mailbox !== 'sent'
								? `
                            <button class="btn btn-sm btn-outline-secondary archive-btn ms-2">
                                ${
									email.archived
										? '<i class="fas fa-inbox"></i>'
										: '<i class="fas fa-archive"></i>'
								}
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
function toggle_read(email_id, read) {
	return fetch(`/emails/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			read: !read,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	}).then(() => load_mailbox('inbox'));
}

function hideAllViews() {
	Object.values(VIEWS).forEach((viewId) => {
		const view = document.querySelector('#' + viewId);
		view.classList.remove('show');
		view.style.display = 'none';
	});
}

function showView(viewId) {
	const view = document.querySelector('#' + viewId);
	view.classList.add('show');
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

function toggle_archive(email_id, archived) {
	return fetch(`/emails/${email_id}`, {
		method: 'PUT',
		body: JSON.stringify({
			archived: !archived,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	}).then(() => {
		load_mailbox('inbox');
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
