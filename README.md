
---
# Email Client Project

This project implements a single-page email client (SPA) using **Django** for the backend and **JavaScript**, **HTML**, and **CSS** for the frontend. The main goal is to provide a functional and user-friendly interface for managing emails with key features such as sending, receiving, archiving, and replying to emails.

## Features

### 1. Sending Emails
- Users can compose and send emails.
- Requires entering recipients, subject, and body of the email.
- After sending an email, the user is automatically redirected to the "Sent" mailbox.

### 2. Managing Emails in Different Mailboxes
- **Inbox:** Displays all received emails that are not archived.
- **Sent:** Shows all emails sent by the user.
- **Archived:** Displays all emails that the user has archived.
- Unread emails are displayed with a white background, while read emails appear with a gray background.

### 3. Viewing Emails
- Clicking on an email opens a detailed view showing:
  - Sender
  - Recipients
  - Subject
  - Date and time
  - Email content
- Emails are automatically marked as "read" when opened.

### 4. Archiving and Unarchiving Emails
- Emails in the inbox can be archived.
- Archived emails can be unarchived and returned to the inbox.

### 5. Replying to Emails
- From the detailed email view, users can click the "Reply" button to respond to the email.
- The reply form includes:
  - The recipient field pre-filled with the original sender.
  - A subject line pre-filled with the prefix `Re:` (if not already present).
  - The original email content quoted in the message body.

## Technologies Used

- **Backend:** Django 5.1.2
- **Frontend:** JavaScript, HTML, CSS
- **Database:** SQLite
- **API:** Utilizes Django REST Framework for communication between the frontend and backend.

## Installation and Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/sandovaldavid/project-03-mail.git
   cd project-03-mail
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   pip install -r requirements.txt
   ```

3. Apply database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. Start the development server:
   ```bash
   python manage.py runserver
   ```

5. Open the app in your browser at [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Project Structure

- **`mail/`**: Contains the backend logic, including models, views, and URLs.
- **`static/mail/`**: JavaScript, CSS, and other static resources.
- **`templates/mail/`**: HTML templates for the user interface.
- **`inbox.js`**: The main JavaScript file handling frontend functionality.

## Future Features
- Tagging system to organize emails.
- Advanced email search functionality.
- Real-time notifications for new emails.

## Contributing
If you'd like to contribute, feel free to open an **issue** or create a **pull request** with your proposed changes.

---
