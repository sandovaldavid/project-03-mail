/**
 * Notification system for the email application
 * Uses Bootstrap toasts for better integration with the Bootstrap framework
 */

class NotificationManager {
	constructor() {
		this.container = document.getElementById('notification-container');
		if (!this.container) {
			this.container = document.createElement('div');
			this.container.id = 'notification-container';
			this.container.className =
				'toast position-fixed top-0 start-0 p-3';
			this.container.style.zIndex = '1050';
			document.body.appendChild(this.container);
		}

		// Queue for managing multiple notifications
		this.notificationQueue = [];
		this.maxNotifications = 3; // Maximum number visible at once
		this.notificationDuration = 5000; // 5 seconds default
	}

	/**
	 * Show a notification
	 * @param {string} type - success, danger, info, or warning
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options
	 * @returns {HTMLElement} - The notification element
	 */
	show(type, message, options = {}) {
		const defaults = {
			title: this._getDefaultTitle(type),
			duration: this.notificationDuration,
			closeable: true,
			animation: true,
		};

		const settings = { ...defaults, ...options };

		// Create notification element (Bootstrap toast) - exact structure from example
		const notification = document.createElement('div');
		notification.className = `toast ${
			type === 'danger'
				? 'text-bg-danger'
				: type === 'success'
				? 'text-bg-success'
				: type === 'info'
				? 'text-bg-info'
				: type === 'warning'
				? 'text-bg-warning'
				: 'bg-light'
		}`;
		notification.setAttribute('role', 'alert');
		notification.setAttribute('aria-live', 'assertive');
		notification.setAttribute('aria-atomic', 'true');

		// Set icon based on type
		const icon = this._getIconForType(type);

		// Create HTML structure exactly like the example
		notification.innerHTML = `
			<div class="toast-header">
				${icon}
				<strong class="me-auto">${settings.title}</strong>
				<small>${this._getTimeString()}</small>
				${
					settings.closeable
						? '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>'
						: ''
				}
			</div>
			<div class="toast-body">
				${message}
			</div>
		`;

		// Add to queue
		this.notificationQueue.push({
			element: notification,
			duration: settings.duration,
		});

		// Process queue
		this._processQueue();

		return notification;
	}

	/**
	 * Process the notification queue
	 */
	_processQueue() {
		// Check if we can display more notifications
		while (
			this.notificationQueue.length > 0 &&
			this.container.children.length < this.maxNotifications
		) {
			const notification = this.notificationQueue.shift();

			// Add to container
			this.container.appendChild(notification.element);

			// Initialize Bootstrap toast
			const bsToast = new bootstrap.Toast(notification.element, {
				autohide: notification.duration > 0,
				delay: notification.duration,
				animation: true,
			});

			// Show the toast
			bsToast.show();

			// Handle hide event to remove element from DOM
			notification.element.addEventListener('hidden.bs.toast', () => {
				if (notification.element.parentElement) {
					notification.element.remove();
					// Process queue again
					this._processQueue();
				}
			});
		}
	}

	/**
	 * Get formatted time string for toast
	 * @returns {string} - Formatted time
	 */
	_getTimeString() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now
			.getMinutes()
			.toString()
			.padStart(2, '0')}`;
	}

	/**
	 * Get icon based on notification type (as rounded image placeholder like in the example)
	 * @param {string} type - The notification type
	 * @returns {string} - HTML for the icon
	 */
	_getIconForType(type) {
		// Base SVG for each type
		let svgContent;

		switch (type) {
			case 'success':
				svgContent =
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#198754"/><path fill="white" d="M9,16.2L4.8,12l-1.4,1.4L9,19L21,7l-1.4-1.4L9,16.2z"/></svg>';
				break;
			case 'danger':
				svgContent =
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#dc3545"/><path fill="white" d="M13.41,12l4.3-4.29a1,1,0,1,0-1.42-1.42L12,10.59,7.71,6.29A1,1,0,0,0,6.29,7.71L10.59,12l-4.3,4.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L12,13.41l4.29,4.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Z"/></svg>';
				break;
			case 'info':
				svgContent =
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#0dcaf0"/><path fill="white" d="M12,7a1,1,0,0,0-1,1v4a1,1,0,0,0,2,0V8A1,1,0,0,0,12,7Zm0,8a1,1,0,1,0,1,1A1,1,0,0,0,12,15Z"/></svg>';
				break;
			case 'warning':
				svgContent =
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#ffc107"/><path fill="white" d="M12,8a1,1,0,0,0-1,1v4a1,1,0,0,0,2,0V9A1,1,0,0,0,12,8Zm0,8a1,1,0,1,0,1,1A1,1,0,0,0,12,16Z"/></svg>';
				break;
			default:
				svgContent =
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#6c757d"/></svg>';
		}

		// Return the SVG wrapped as a rounded image placeholder
		return `<img src="data:image/svg+xml;base64,${btoa(
			svgContent
		)}" class="rounded me-2" width="20" height="20" alt="icon">`;
	}

	/**
	 * Get default title based on notification type
	 * @param {string} type - The notification type
	 * @returns {string} - The default title
	 */
	_getDefaultTitle(type) {
		switch (type) {
			case 'success':
				return 'Success';
			case 'danger':
				return 'Error';
			case 'info':
				return 'Info';
			case 'warning':
				return 'Warning';
			default:
				return 'Notification';
		}
	}

	/**
	 * Convenience method for success notifications
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options
	 * @returns {HTMLElement} - The notification element
	 */
	success(message, options = {}) {
		return this.show('success', message, options);
	}

	/**
	 * Convenience method for error notifications
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options
	 * @returns {HTMLElement} - The notification element
	 */
	error(message, options = {}) {
		return this.show('danger', message, options);
	}

	/**
	 * Convenience method for info notifications
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options
	 * @returns {HTMLElement} - The notification element
	 */
	info(message, options = {}) {
		return this.show('info', message, options);
	}

	/**
	 * Convenience method for warning notifications
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options
	 * @returns {HTMLElement} - The notification element
	 */
	warning(message, options = {}) {
		return this.show('warning', message, options);
	}
}

// Create global notification instance
document.addEventListener('DOMContentLoaded', function () {
	// Make sure Bootstrap is available
	if (typeof bootstrap === 'undefined') {
		console.error('Bootstrap JS is required for notifications');
		return;
	}

	window.notifications = new NotificationManager();

	// Override the older function for backwards compatibility
	window.createAutoDisappearingAlert = function (type, message, parent) {
		return window.notifications.show(type, message);
	};
});
