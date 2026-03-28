# ✨ Lumina Events - Full Stack Event Planning Platform

> 🚀 A production-ready full-stack event booking platform with authentication, payments, and admin control.

---

## 🌐 Live Demo

👉 https://your-live-link.com *(add after deployment)*

---

## 📸 Screenshots

*(Add UI screenshots here)*

---

## 🚀 Overview

Lumina Events is a full-stack event planning platform where users can:

* Browse and customize events (weddings, corporate, etc.)
* Book events in real-time
* Make secure payments
* Manage bookings

Includes a powerful **admin dashboard** for managing users, bookings, and analytics.

---

## 🔥 Features

### 👤 User Features

* JWT Authentication + Email Verification
* OTP-based signup
* Password reset system
* Event browsing & filtering
* Real-time pricing
* Booking system (database-backed)
* Stripe payments
* Booking history

---

### 🛡️ Security Features

* bcrypt password hashing
* JWT authentication
* Rate limiting (anti-brute force)
* Input validation
* Helmet security headers
* CORS protection

---

### ⚙️ Backend Features

* Node.js + Express API
* MongoDB (Mongoose)
* RESTful architecture
* Environment configs (dev/staging/prod)
* Logging (Winston)
* Error tracking (Sentry)
* Audit logs

---

### 👑 Admin Panel

* Dashboard (users, bookings, revenue)
* User management
* Booking control
* Audit logs
* Role-based access

---

### ⚡ Frontend Features

* Tailwind CSS UI
* Responsive design
* Smooth animations
* Modular JavaScript
* Vite build system

---

## 🛠️ Tech Stack

**Frontend:** HTML, CSS, JavaScript, Tailwind, Vite
**Backend:** Node.js, Express, MongoDB
**Security:** JWT, bcrypt, Helmet
**Payments:** Stripe

---

## 📁 Project Structure

```
event-planner/
├── backend/
├── frontend/
├── vite.config.js
├── package.json
└── README.md
```

---

## ⚡ Getting Started

### 1️⃣ Clone

```bash
git clone https://github.com/your-username/lumina-events.git
cd lumina-events
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Add in `.env`:

```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=your_key
CLIENT_URL=http://localhost:3000
```

---

### 3️⃣ Run Backend

```bash
npm run dev
```

👉 http://localhost:5000

---

### 4️⃣ Run Frontend

```bash
npm install
npm run dev
```

👉 http://localhost:3000

---

## 📡 API Endpoints

**Auth**

* POST /api/auth/signup
* POST /api/auth/signin
* POST /api/auth/forgot-password
* POST /api/auth/reset-password

**Bookings**

* POST /api/bookings
* GET /api/bookings

**Payments**

* POST /api/payments/create-intent
* POST /api/payments/confirm

---

## 🚀 Deployment

* Frontend: Vercel / Netlify
* Backend: Render / Railway

---

## 📊 Future Improvements

* CI/CD pipeline
* Automated testing
* Redis caching
* Real-time notifications
* AI event recommendations

---

## 👨‍💻 Author

**Hardik**
Cybersecurity Student | Full Stack Developer

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 🚀 Use it

---
