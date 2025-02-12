document.addEventListener('DOMContentLoaded', function () {
	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);

	// By default, load the inbox
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
	// Show compose view and hide other views
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';

	// Show the mailbox name and create table structure
	document.querySelector('#emails-view').innerHTML = `
        <h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody id="emails-tbody"></tbody>
        </table>
    `;

	// Fetch emails from the API
	fetch(`/emails/${mailbox}`)
		.then((response) => response.json())
		.then((emails) => {
			const tbody = document.querySelector('#emails-tbody');

			// Display each email in the table
			emails.forEach((email) => {
				const row = document.createElement('tr');

				// Style for read/unread emails
				row.className = email.read ? 'read' : 'unread';

				row.innerHTML = `
                    <td>${email.sender}</td>
                    <td>${email.subject}</td>
                    <td>${email.timestamp}</td>
                `;

				// Add click handler to view email
				row.addEventListener('click', () => view_email(email.id));

				tbody.append(row);
			});
		});
}

function view_email(email_id) {
	fetch(`/emails/${email_id}`)
		.then((response) => response.json())
		.then((email) => {
			document.querySelector('#emails-view').style.display = 'block';
			document.querySelector('#compose-view').style.display = 'none';

			// Display email content with buttons for replying, archiving, and marking as read/unread
			document.querySelector('#emails-view').innerHTML = `
                <div class="email-detail card">
                    <div class="card-header">
                        <h5 class="mb-0">${email.subject}</h5>
                        <small class="text-muted">${email.timestamp}</small>
                    </div>
                    <div class="card-body">
                        <div class="email-metadata mb-3">
                            <p class="mb-1"><strong>From:</strong> ${email.sender}</p>
                            <p class="mb-1"><strong>To:</strong> ${email.recipients.join(', ')}</p>
                        </div>
                        
                        <div class="email-actions mb-3">
                            <button class="btn btn-sm btn-outline-primary" id="reply-btn">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                            <button class="btn btn-sm btn-outline-primary" id="archive-btn">
                                ${email.archived ? 'Unarchive' : 'Archive'}
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" id="read-btn">
                                Mark as ${email.read ? 'Unread' : 'Read'}
                            </button>
                        </div>
                        
                        <hr>
                        <div class="email-body">
                            ${email.body.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            `;

			// Add event listeners for buttons
			document.querySelector('#archive-btn').addEventListener('click', () => toggle_archive(email.id, email.archived));

			document.querySelector('#read-btn').addEventListener('click', () => toggle_read(email.id, email.read));

			document.querySelector('#reply-btn').addEventListener('click', () => reply_to_email(email));

			// Mark email as read
			if (!email.read) {
				mark_email_as_read(email.id);
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

// Add new helper function for replying to emails
function reply_to_email(email) {
	// Show compose view
	compose_email();

	// Pre-fill composition fields
	document.querySelector('#compose-recipients').value = email.sender;
	document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
	document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
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

// Add new helper function for replying to emails
function reply_to_email(email) {
	// Show compose view
	compose_email();

	// Pre-fill composition fields
	document.querySelector('#compose-recipients').value = email.sender;
	document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
	document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
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
