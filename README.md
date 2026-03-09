# 🔧 Rent Breaker Machine Management System

A full-stack MERN application for managing industrial breaker machine rentals, customers, billing, and maintenance.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev    # Starts on http://localhost:5173
```

The Vite dev proxy forwards `/api/*` requests to `http://localhost:5000`.

---

## 🔑 Creating the First Admin User

Since registration requires no pre-existing admin, call:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"admin123","role":"Admin"}'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| State | Context API + localStorage |
| HTTP | Axios with JWT interceptors |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (7-day expiry) + Bcryptjs (salt rounds: 12) |
| Fonts | Syne (display), DM Sans (body), JetBrains Mono |
