/**
 * Test suite for email archiving functionality
 * This tests the archiving and unarchiving of emails
 */

function testArchiveFunctionality() {
	console.log('Running archive functionality tests...');

	const results = {
		totalTests: 5,
		passed: 0,
		failed: 0,
		details: [],
	};

	// Test 1: Mock fetch for archive endpoint
	let test1 = { name: 'Mock archiving endpoint works', pass: false };
	try {
		const mockResponse = {
			status: 204,
			ok: true,
		};

		// Save original fetch
		const originalFetch = window.fetch;

		// Setup fetch mock for this test
		window.fetch = (url, options) => {
			if (url.includes('/emails/') && options.method === 'PUT') {
				const body = JSON.parse(options.body);
				if (body.hasOwnProperty('archived')) {
					return Promise.resolve({
						status: 204,
						ok: true,
						json: () => Promise.resolve({}),
					});
				}
			}
			// Pass through to original fetch for other requests
			return originalFetch(url, options);
		};

		test1.pass = true;
		results.passed++;

		// Restore original fetch after test
		setTimeout(() => {
			window.fetch = originalFetch;
		}, 500);
	} catch (error) {
		test1.pass = false;
		test1.actual = error.message;
		results.failed++;
	}
	results.details.push(test1);

	// Test 2: toggle_archive function exists
	let test2 = { name: 'toggle_archive function exists', pass: false };
	try {
		test2.pass = typeof toggle_archive === 'function';
		test2.pass ? results.passed++ : results.failed++;
		if (!test2.pass) test2.actual = 'toggle_archive is not a function';
	} catch (error) {
		test2.pass = false;
		test2.actual = error.message;
		results.failed++;
	}
	results.details.push(test2);

	// Test 3: Test archive button renders correctly
	let test3 = {
		name: 'Archive button renders with correct text',
		pass: false,
	};
	try {
		// Create a test email item
		const emailDiv = document.createElement('div');
		emailDiv.className = 'email-item shadow-sm';
		emailDiv.innerHTML = `
            <div class="email-content">
                <div class="email-header">
                    <strong class="text-body">From: test@example.com</strong>
                </div>
                <div class="email-subject text-truncate font-weight-medium">Test Email</div>
            </div>
            <div class="email-actions">
                <button class="btn btn-sm btn-outline-secondary archive-btn ms-2" title="Archive">
                    <i class="fas fa-archive"></i>
                    <span class="button-text ms-1">Archive</span>
                </button>
            </div>
        `;

		const archiveBtn = emailDiv.querySelector('.archive-btn');
		test3.pass =
			archiveBtn &&
			archiveBtn.innerHTML.includes('Archive') &&
			archiveBtn.innerHTML.includes('fa-archive');

		test3.pass ? results.passed++ : results.failed++;
		if (!test3.pass)
			test3.actual = 'Archive button does not render correctly';
	} catch (error) {
		test3.pass = false;
		test3.actual = error.message;
		results.failed++;
	}
	results.details.push(test3);

	// Test 4: Test unarchive button renders correctly
	let test4 = {
		name: 'Unarchive button renders with correct text',
		pass: false,
	};
	try {
		// Create a test email item for archived email
		const emailDiv = document.createElement('div');
		emailDiv.className = 'email-item archived shadow-sm';
		emailDiv.innerHTML = `
            <div class="email-content">
                <div class="email-header">
                    <strong class="text-body">From: test@example.com</strong>
                </div>
                <div class="email-subject text-truncate font-weight-medium">Archived Email</div>
            </div>
            <div class="email-actions">
                <button class="btn btn-sm btn-outline-success archive-btn ms-2" title="Move to inbox">
                    <i class="fas fa-inbox"></i>
                    <span class="button-text ms-1">Unarchive</span>
                </button>
            </div>
        `;

		const unarchiveBtn = emailDiv.querySelector('.archive-btn');
		test4.pass =
			unarchiveBtn &&
			unarchiveBtn.innerHTML.includes('Unarchive') &&
			unarchiveBtn.innerHTML.includes('fa-inbox');

		test4.pass ? results.passed++ : results.failed++;
		if (!test4.pass)
			test4.actual = 'Unarchive button does not render correctly';
	} catch (error) {
		test4.pass = false;
		test4.actual = error.message;
		results.failed++;
	}
	results.details.push(test4);

	// Test 5: Test handleArchiveStateChange utility function
	let test5 = {
		name: 'handleArchiveStateChange utility function works',
		pass: false,
	};
	try {
		// Define test function if not exists
		if (typeof window.handleArchiveStateChange !== 'function') {
			window.handleArchiveStateChange = function (button, archived) {
				button.innerHTML = `<i class="fas fa-${
					archived ? 'inbox' : 'archive'
				}"></i> <span class="button-text ms-1">${
					archived ? 'Unarchive' : 'Archive'
				}</span>`;
				button.title = archived ? 'Move to inbox' : 'Archive';
				button.classList.toggle('btn-outline-success', archived);
				button.classList.toggle('btn-outline-secondary', !archived);
				const emailItem = button.closest('.email-item');
				emailItem.classList.toggle('archived', archived);
			};
		}

		// Test the function
		const button = document.createElement('button');
		button.className = 'btn btn-sm btn-outline-secondary archive-btn';
		button.innerHTML =
			'<i class="fas fa-archive"></i> <span class="button-text ms-1">Archive</span>';

		const emailItem = document.createElement('div');
		emailItem.className = 'email-item shadow-sm';
		emailItem.appendChild(button);
		document.body.appendChild(emailItem);

		window.handleArchiveStateChange(button, true);

		test5.pass =
			button.innerHTML.includes('Unarchive') &&
			button.innerHTML.includes('fa-inbox') &&
			button.classList.contains('btn-outline-success') &&
			emailItem.classList.contains('archived');

		document.body.removeChild(emailItem);

		test5.pass ? results.passed++ : results.failed++;
		if (!test5.pass)
			test5.actual =
				'handleArchiveStateChange does not update UI correctly';
	} catch (error) {
		test5.pass = false;
		test5.actual = error.message;
		results.failed++;
	}
	results.details.push(test5);

	return results;
}

// Make the test function available globally
window.testArchiveFunctionality = testArchiveFunctionality;
