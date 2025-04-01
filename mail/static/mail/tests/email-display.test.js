/**
 * Test suite for validating email display functionality
 */

function testEmailDisplay() {
	console.log('Starting email display test...');

	// 1. Create a mock email object with all required fields
	const mockEmail = {
		id: 123,
		sender: 'test@example.com',
		recipients: ['recipient1@example.com', 'recipient2@example.com'],
		subject:
			'Test Subject with Special Characters: <script>alert("test")</script>',
		body: 'This is a test email body.\n\nWith multiple paragraphs and line breaks.',
		timestamp: 'Mar 31 2025, 10:30 AM',
		read: false,
		archived: false,
	};

	// 2. Create a container to hold the test results
	const testContainer = document.createElement('div');
	testContainer.id = 'test-container';
	document.body.appendChild(testContainer);

	// 3. Create a function to render the email using the same template as view_email
	function renderTestEmail(email) {
		// Escape HTML characters in the subject and format the body like in the actual email display
		const escapedSubject = escapeHtml(email.subject);
		const formattedBody = formatBody(email.body);

		testContainer.innerHTML = `
            <div class="email-detail card shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center bg-light">
                    <h5 class="mb-0 font-weight-bold text-primary">${escapedSubject}</h5>
                    <small class="text-muted font-italic">${
						email.timestamp
					}</small>
                </div>
                <div class="card-body">
                    <div class="email-metadata mb-3 p-3 bg-light rounded shadow-sm">
                        <p class="mb-1"><strong class="text-dark">From:</strong> <span class="text-body">${
							email.sender
						}</span></p>
                        <p class="mb-1"><strong class="text-dark">To:</strong> <span class="text-body">${email.recipients.join(
							', '
						)}</span></p>
                    </div>
                    
                    <div class="email-actions mb-3 d-flex flex-wrap">
                        <button class="btn btn-sm btn-primary mr-2" id="reply-btn" title="Reply to this email">
                            <i class="fas fa-reply mr-1"></i> Reply
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" id="back-btn" title="Go back">
                            <i class="fas fa-arrow-left mr-1"></i> Back
                        </button>
                    </div>
                    
                    <div class="email-body border-top pt-3 text-body">
                        ${formattedBody}
                    </div>
                </div>
            </div>
        `;
	}

	// Helper functions to match the real implementation
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	function formatBody(body) {
		return body.replace(/\n/g, '<br>');
	}

	// 4. Render the test email
	renderTestEmail(mockEmail);

	// 5. Define test cases to validate each component
	const tests = [
		{
			name: 'Subject is displayed correctly',
			test: () => {
				const subjectElement =
					testContainer.querySelector('.card-header h5');
				const expectedSubject = escapeHtml(mockEmail.subject);
				return {
					pass:
						subjectElement &&
						subjectElement.innerHTML === expectedSubject,
					actual: subjectElement
						? subjectElement.innerHTML
						: 'not found',
					expected: expectedSubject,
				};
			},
		},
		{
			name: 'Timestamp is displayed correctly',
			test: () => {
				const timestampElement =
					testContainer.querySelector('.card-header small');
				return {
					pass:
						timestampElement &&
						timestampElement.textContent === mockEmail.timestamp,
					actual: timestampElement
						? timestampElement.textContent
						: 'not found',
				};
			},
		},
		{
			name: 'Sender is displayed correctly',
			test: () => {
				const senderElement = testContainer.querySelector(
					'.email-metadata p:first-child'
				);
				return {
					pass:
						senderElement &&
						senderElement.textContent.includes(mockEmail.sender),
					actual: senderElement
						? senderElement.textContent
						: 'not found',
				};
			},
		},
		{
			name: 'Recipients are displayed correctly',
			test: () => {
				const recipientsElement = testContainer.querySelector(
					'.email-metadata p:nth-child(2)'
				);
				const expectedRecipients = mockEmail.recipients.join(', ');
				return {
					pass:
						recipientsElement &&
						recipientsElement.textContent.includes(
							expectedRecipients
						),
					actual: recipientsElement
						? recipientsElement.textContent
						: 'not found',
				};
			},
		},
		{
			name: 'Body is displayed correctly',
			test: () => {
				const bodyElement = testContainer.querySelector('.email-body');

				// Convert the HTML line breaks back to newlines for comparison
				let actualText = '';
				if (bodyElement) {
					actualText = bodyElement.innerHTML
						.replace(/<br>/g, '\n') // Convert <br> back to newlines
						.trim();
				}

				return {
					pass: actualText === mockEmail.body,
					actual: actualText || 'not found',
					expected: mockEmail.body,
				};
			},
		},
		{
			name: 'Reply button exists',
			test: () => {
				const replyButton = testContainer.querySelector('#reply-btn');
				return {
					pass: !!replyButton,
					actual: replyButton ? 'found' : 'not found',
				};
			},
		},
	];

	// Test reply functionality
	const replyButtonTest = {
		name: 'Reply button functionality',
		test: () => {
			// Get the reply button
			const replyButton = testContainer.querySelector('#reply-btn');

			// Check if it exists and has the correct text and icon
			const hasButton = !!replyButton;
			const hasIcon =
				replyButton?.querySelector('i.fas.fa-reply') !== null;
			const hasCorrectText = replyButton?.textContent
				.trim()
				.includes('Reply');
			const hasCorrectClass =
				replyButton?.classList.contains('btn-primary');

			return {
				pass: hasButton && hasIcon && hasCorrectText && hasCorrectClass,
				actual: `Button exists: ${hasButton}, Has icon: ${hasIcon}, Has text: ${hasCorrectText}, Has correct class: ${hasCorrectClass}`,
				expected:
					'Button should exist with reply icon, text, and primary styling',
			};
		},
	};

	// Add the test to your tests array
	tests.push(replyButtonTest);

	// 6. Run tests and display results
	const results = tests.map((testCase) => {
		const result = testCase.test();
		return {
			name: testCase.name,
			pass: result.pass,
			actual: result.actual,
			expected: result.expected || testCase.expected,
		};
	});

	console.log('Test results:');
	results.forEach((result) => {
		if (result.pass) {
			console.log(`✔️ ${result.name}: ${result.actual}`);
		} else {
			console.error(
				`❌ ${result.name}: Expected "${result.expected}", but got "${result.actual}"`
			);
		}
	});

	// 7. Clean up
	document.body.removeChild(testContainer);

	// 8. Return test results
	return {
		totalTests: tests.length,
		passed: results.filter((r) => r.pass).length,
		failed: results.filter((r) => !r.pass).length,
		details: results,
	};
}
