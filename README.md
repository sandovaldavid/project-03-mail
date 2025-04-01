# 📧 Email Client Project

[![Django](https://img.shields.io/badge/Django-5.1.2-green.svg)](https://www.djangoproject.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)](https://github.com/sandovaldavid/project-03-mail)

This project implements a single-page email client (SPA) using **Django** for the backend and **JavaScript**, **HTML**, and **CSS** for the frontend. The main goal is to provide a functional and user-friendly interface for managing emails with key features such as sending, receiving, archiving, and replying to emails.

## ✨ Features

### 1. 📤 Sending Emails

-   Users can compose and send emails.
-   Requires entering recipients, subject, and body of the email.
-   After sending an email, the user is automatically redirected to the "Sent" mailbox.

### 2. 📂 Managing Emails in Different Mailboxes

-   **📥 Inbox:** Displays all received emails that are not archived.
-   **📤 Sent:** Shows all emails sent by the user.
-   **🗃️ Archived:** Displays all emails that the user has archived.
-   📬 Unread emails are displayed with a white background, while read emails appear with a gray background.

### 3. 👁️ Viewing Emails

-   Clicking on an email opens a detailed view showing:
    -   Sender
    -   Recipients
    -   Subject
    -   Date and time
    -   Email content
-   Emails are automatically marked as "read" when opened.

### 4. 🗃️ Archiving and Unarchiving Emails

-   Emails in the inbox can be archived.
-   Archived emails can be unarchived and returned to the inbox.

### 5. ↩️ Replying to Emails

-   From the detailed email view, users can click the "Reply" button to respond to the email.
-   The reply form includes:
    -   The recipient field pre-filled with the original sender.
    -   A subject line pre-filled with the prefix `Re:` (if not already present).
    -   The original email content quoted in the message body.

## 🛠️ Technologies Used

| Technology   | Version                                                                                                                                                                           | Description                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Backend**  | ![Django](https://img.shields.io/badge/Django-5.1.2-green.svg)                                                                                                                    | Python web framework                       |
| **Frontend** | ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg) ![HTML](https://img.shields.io/badge/HTML-5-orange.svg) ![CSS](https://img.shields.io/badge/CSS-3-blue.svg) | Client-side technologies                   |
| **Database** | ![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)                                                                                                                         | Lightweight database                       |
| **API**      | ![DRF](https://img.shields.io/badge/DjangoRESTFramework-Latest-red.svg)                                                                                                           | Communication between frontend and backend |

## ⚙️ Installation and Setup

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

## 📁 Project Structure

| Directory             | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| **`mail/`**           | Contains the backend logic, including models, views, and URLs |
| **`static/mail/`**    | JavaScript, CSS, and other static resources                   |
| **`templates/mail/`** | HTML templates for the user interface                         |
| **`inbox.js`**        | The main JavaScript file handling frontend functionality      |

## 🚀 Future Features

> [!NOTE]
> The following features are planned for future releases:

-   🏷️ Tagging system to organize emails
-   🔍 Advanced email search functionality
-   🔔 Real-time notifications for new emails

## 🤝 Contributing

> [!TIP]
> We welcome contributions to this project!

If you'd like to contribute, feel free to open an **issue** or create a **pull request** with your proposed changes.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
