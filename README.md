# 🏨 StayHub - Premium Hotel Booking Platform

A full-stack, enterprise-grade hotel booking platform inspired by Booking.com. This application features role-based access control, real-time messaging, secure payments, and a modern, responsive UI.

## 🚀 Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (Custom Premium Theme & Glassmorphism)
- **State Management:** React Query (@tanstack/react-query)
- **Routing:** React Router v6
- **Real-time:** Socket.IO Client
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (Access & Refresh tokens) + bcryptjs
- **Validation:** Zod
- **Payments:** Stripe Integration
- **Real-time:** Socket.IO Server

## ✨ Key Features

### 👥 Role-Based Access Control (RBAC)
- **Customers:** Search hotels, make bookings, leave reviews, manage favorites, and chat with owners.
- **Hotel Owners:** Manage their hotels & rooms, view booking metrics, and communicate with customers.
- **Admins:** Global dashboard, user management, and system audit logs.

### 🔍 Advanced Search & Filtering
- Filter by location (city, country)
- Date range availability checking
- Price range filters
- Star rating and amenity filters
- Sorting options (price, rating, date)

### 📅 Robust Booking Engine
- Prevent overbooking with transactional availability checks.
- Real-time room quantity validation.
- Secure checkout process via Stripe.

### 💬 Real-Time Features
- Live messaging between customers and hotel owners.
- Online status indicators.
- Typing indicators.

## 🛠️ Project Structure

This is a monorepo containing both the frontend and backend applications.

```
hotel-booking/
├── backend/                  # Node.js + Express API
│   ├── prisma/               # Database schema and seed scripts
│   ├── src/
│   │   ├── config/           # Database & env config
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, error, and validation middleware
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helpers (API responses, etc.)
│   │   └── validators/       # Zod schemas
│   └── server.js             # Entry point
│
└── frontend/                 # React + Vite application
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── pages/            # Page components by role
    │   ├── services/         # API integration
    │   ├── utils/            # Helpers
    │   └── App.jsx           # Main component & router
    ├── tailwind.config.js    # Custom theme configuration
    └── vite.config.js        # Vite configuration with proxy
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or a cloud instance)

### 1. Database Setup
Ensure PostgreSQL is running. Create a new database named `hotel_booking` (or adjust the URL in your `.env` file).

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on the `.env.example` (or set up the required variables):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hotel_booking?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
STRIPE_SECRET_KEY="sk_test_..."
FRONTEND_URL="http://localhost:5173"
```

Run database migrations and seed the database with sample data:
```bash
npm run db:migrate
npm run db:seed
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window.

```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

## 🧪 Test Accounts (from seed data)

Use these accounts to test different roles in the application:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gmail.com | Password123 |
| **Owner** | owner1@gmail.com | Password123 |
| **Owner** | owner2@gmail.com | Password123 |
| **Customer** | customer1@gmail.com | Password123 |
| **Customer** | customer2@gmail.com | Password123 |

## 📜 License
This project is licensed under the MIT License.
