# Copilot Instructions: Django Email Client (SPA)

## Architecture Overview

This is a **single-page application (SPA)** email client built with Django backend + vanilla
JavaScript frontend. The key architectural principle is strict separation between Django
(server-side rendering + API) and JavaScript (client-side interactivity).

### Critical Pattern: Django MVT + Data Bridge

**Backend (Django MVT):**

- **Models** (`mail/models.py`): Custom `User` model, `Email` model with `serialize()` method
- **Views** (`mail/views.py`): Hybrid approach - renders initial HTML + provides JSON API endpoints
- **Templates** (`mail/templates/mail/`): Server-rendered HTML shells that become SPA containers

**Frontend (Vanilla JS):**

- **SPA Router**: `inbox.js` manages view switching (inbox/sent/archive/compose) without page
  reloads
- **Data Bridge Pattern**: Django passes config to JS via
  `{{ datos_para_js | json_script:"datos-django" }}`
  - Read in JS: `JSON.parse(document.getElementById('datos-django').textContent)`
  - Used for: API URLs, user data, debug flags - see `views.index()` for canonical example

### Static Files Architecture (Critical!)

**Loading Order Matters** - see `docs/Arquitectura.md` for full rationale:

1. **Bootstrap 5.3 CSS** (from CDN) - loaded first
2. **Local CSS** (`mail/static/mail/`) - overrides Bootstrap
3. **Bootstrap JS Bundle** (from CDN) - loaded before `</body>`
4. **Local JS** (`mail/static/mail/`) - loaded last, depends on Bootstrap

**Namespacing Convention**: All static files use `mail/static/mail/` structure to avoid conflicts
when Django collects static files. Reference via `{% static 'mail/inbox.js' %}`, never
`{% static 'inbox.js' %}`.

## API Endpoints (JSON)

All API routes return JSON and use `@login_required`:

```python
POST   /emails                    # compose() - send email
GET    /emails/<mailbox>          # mailbox() - list emails (inbox/sent/archive)
GET    /emails/<int:email_id>     # email() - get email detail
PUT    /emails/<int:email_id>     # email() - update read/archived status
```

**Important**: Routes use both path converters (`<int:email_id>`) and string params
(`<str:mailbox>`). The `/emails` endpoint handles both POST (compose) and GET (mailbox list).

## Frontend Patterns

### View Management

```javascript
const VIEWS = { EMAILS: 'emails-view', COMPOSE: 'compose-view' };

// Always follow this sequence:
hideAllViews(); // Hide all first
showView(VIEWS.COMPOSE); // Show target view
updateActiveButton('compose'); // Update sidebar UI
```

### CSRF Token Pattern

All `POST`/`PUT` requests **must** include CSRF token:

```javascript
const csrftoken = getCookie('csrftoken'); // Use existing helper
fetch('/emails', {
  method: 'POST',
  headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
});
```

### XSS Prevention (Critical!)

**Always sanitize user input** before rendering. Use helpers from `mail/static/mail/js/utils.js`:

```javascript
const sanitizedEmail = {
	...email,
	subject: escapeHtml(email.subject || '(No subject)'),
	body: formatEmailBody(email.body), // Converts \n to <br>
};
```

Never use raw `email.body` or `email.subject` in `innerHTML`.

### Notification System

Global `window.notifications` instance (Bootstrap Toasts):

```javascript
window.notifications.success('Email sent!');
window.notifications.error('Failed to send.');
window.notifications.info('Loading...');
window.notifications.warning('Draft saved.');
```

Older API (`createAutoDisappearingAlert`) is aliased for backward compatibility.

### Draft Management

Drafts use `localStorage` (client-side only):

```javascript
saveDraft(recipients, subject, body); // Returns draft object with ID
getDrafts(); // Returns array of all drafts
deleteDraft(draftId); // Removes specific draft
```

Draft IDs are timestamps (`Date.now().toString()`).

## Development Workflow

### Environment Setup

**Conda environment recommended**:

```powershell
conda activate project-03-mail
```

### Essential Commands

```powershell
# Database (SQLite locally, MySQL in production)
python manage.py makemigrations mail
python manage.py migrate

# Development server
python manage.py runserver

# Code formatting (Black configured in pyproject.toml)
black .  # Formats all Python files, excludes migrations/

# Static files (for production)
python manage.py collectstatic --noinput
```

### Configuration (`.env` file)

Required environment variables:

- `DJANGO_SECRET_KEY` - Django secret key
- `DJANGO_DEBUG` - "True" for dev, "False" for prod
- `DJANGO_ALLOWED_HOSTS` - Comma-separated hosts
- `DJANGO_PRODUCTION` - "True" switches to MySQL, "False" uses SQLite
- MySQL vars (if production): `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`,
  `MYSQL_PORT`

### Deployment

Configured for Heroku/Render:

- `Procfile`: `web: gunicorn project3.wsgi`
- **WhiteNoise** serves static files (see `project3/settings.py`)
- Static files compressed:
  `STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'`

## Key Conventions

### Python (Black Formatter)

- Line length: 88 characters
- Target Python 3.11+
- Excludes: migrations, venv, build dirs (see `pyproject.toml`)

### JavaScript

- Use `const`/`let`, never `var`
- Prefer `fetch()` with async/await or `.then()` chains
- DOM queries: `document.querySelector()` for single, `querySelectorAll()` for multiple
- Always wrap initialization in `DOMContentLoaded` event

### Django Templates

- All templates extend `mail/layout.html`
- Load static: `{% load static %}` at top of template
- Reference static files: `{% static 'mail/inbox.js' %}` (include app namespace!)

### Model Serialization

The `Email.serialize()` method is the canonical JSON representation:

```python
{
  "id": int,
  "sender": str (email address),
  "recipients": list[str],
  "subject": str,
  "body": str,
  "timestamp": str (formatted: "%b %d %Y, %I:%M %p"),
  "read": bool,
  "archived": bool
}
```

Match this format exactly when creating mock data or tests.

## Common Pitfalls

1. **Forgetting CSRF token** → 403 Forbidden on POST/PUT
2. **Wrong static file path** → Use `'mail/file.js'` not `'file.js'`
3. **Loading JS before Bootstrap** → Bootstrap components won't work
4. **Not sanitizing HTML** → XSS vulnerabilities (use `escapeHtml()`)
5. **Database choice confusion** → SQLite locally (`DJANGO_PRODUCTION=False`), MySQL in prod
6. **Multiple active views** → Always `hideAllViews()` before `showView()`

## File Organization

```
mail/
├── models.py          # User + Email models
├── views.py           # Hybrid: HTML renders + JSON API
├── urls.py            # URL patterns (note overlapping /emails routes)
├── static/mail/
│   ├── inbox.js       # Main SPA logic (view switching, fetch calls)
│   ├── email-display.js   # Email rendering with animations
│   ├── notifications.js   # Bootstrap Toast wrapper
│   ├── dark-mode.js   # Theme toggling
│   ├── js/utils.js    # XSS helpers (escapeHtml, formatEmailBody)
│   └── tests/         # Client-side tests (loaded in development)
└── templates/mail/
    ├── layout.html    # Base template (includes Bootstrap + static files)
    ├── inbox.html     # Main SPA shell (sidebar + view containers)
    ├── login.html     # Auth pages
    └── register.html
```

## Testing Notes

- **No backend tests** currently exist (only `mail/tests.py` stub)
- **Frontend tests**: See `mail/static/mail/tests/` - loaded dynamically in debug mode
- Test runner: `runEmailDisplayTests()` creates inline test report UI
- When adding tests, follow the pattern in `email-display.test.js`

## External Dependencies

- **Django 5.1.6** - Web framework
- **Bootstrap 5.3.3** - UI framework (loaded from CDN)
- **Font Awesome** - Icons (loaded from CDN)
- **WhiteNoise 6.6.0** - Static file serving in production
- **Gunicorn 23.0.0** - Production WSGI server
- **Black 24.10.0** - Python code formatter
