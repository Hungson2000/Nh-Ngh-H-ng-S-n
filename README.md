# Nha Nghi Hung Son — Guesthouse Management System

A single-page web application for managing a small guesthouse: rooms, bookings, revenue, and customer communication, with real-time sync via Firebase.

## Features

- Room photo gallery
- Revenue dashboard with charts
- Gantt-style room booking calendar
- Coupon / discount system
- PDF invoice generation
- Real-time data sync (Firebase Realtime Database)
- Telegram bot notifications for new bookings
- Admin authentication (SHA-256 password hashing)

## Tech Stack

- HTML, CSS, JavaScript (single-file frontend)
- Firebase Realtime Database
- Chart.js (revenue dashboard)
- Telegram Bot API (notifications)

## Project Structure

```
backend/
├── models/
├── routes/
├── server.js
├── package.json
└── .env.example
frontend/
├── assets/
├── css/
└── index.html
```

## Getting Started

### Backend

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example` and fill in your own values (MongoDB connection string, etc.).

```bash
npm run dev
```

### Frontend

Open `frontend/index.html` directly in a browser, or serve it with a local server (e.g. VS Code Live Server).

### Firebase Setup

Replace the placeholder `firebaseConfig` in `frontend/js/main.js` with your own Firebase project configuration to enable real-time sync.

## Deployment

- **Frontend:** _(add your deployed URL here)_
- **Backend / API:** _(add your deployed URL here)_

## License

This project is for personal/educational use.
