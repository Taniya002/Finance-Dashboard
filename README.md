# Finance Dashboard API

A well-structured RESTful backend for a finance dashboard system with role-based access control, financial record management, and summary analytics.

Built with **Node.js**, **Express**, and **MongoDB**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seeding Demo Data](#seeding-demo-data)
- [API Reference](#api-reference)
- [Role & Access Control](#role--access-control)
- [Data Models](#data-models)
- [Design Decisions & Assumptions](#design-decisions--assumptions)
- [Running Tests](#running-tests)

---

## Tech Stack

| Layer        | Choice              | Reason                                      |
|--------------|---------------------|---------------------------------------------|
| Runtime      | Node.js             | Fast, non-blocking I/O for API workloads    |
| Framework    | Express             | Minimal, composable, widely understood      |
| Database     | MongoDB + Mongoose  | Flexible schema, great for aggregation      |
| Auth         | JWT (jsonwebtoken)  | Stateless, simple to verify across services |
| Validation   | express-validator   | Declarative, chainable, in-route validators |
| Password     | bcryptjs            | Industry-standard hashing                   |
| Rate Limiting| express-rate-limit  | Protects against brute-force attacks        |
| Testing      | Jest + Supertest    | Full integration tests against real routes  |

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, /me
│   │   ├── userController.js      # User CRUD (admin only)
│   │   ├── transactionController.js
│   │   └── dashboardController.js # Analytics endpoints
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication + role authorization
│   │   ├── validate.js            # express-validator result handler
│   │   └── errorHandler.js        # Centralised error handler
│   ├── models/
│   │   ├── User.js                # User schema with roles
│   │   └── Transaction.js         # Transaction schema with soft delete
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/
│   │   ├── authService.js         # Registration & login logic
│   │   ├── userService.js         # User management logic
│   │   ├── transactionService.js  # CRUD + filtering + pagination
│   │   └── dashboardService.js    # Aggregation queries
│   ├── utils/
│   │   ├── response.js            # Standardised API response helpers
│   │   └── seed.js                # Demo data seeder
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point
├── tests/
│   ├── setup.js                   # Test DB helpers
│   ├── auth.test.js
│   └── transactions.test.js
├── .env.example
├── package.json
└── README.md
```

**Why this structure?**  
Controllers handle HTTP (parsing request, sending response). Services contain all business logic and are fully testable without HTTP. Models own schema + validation. This separation makes the codebase easy to extend and reason about.

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd finance-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set your MONGODB_URI and JWT_SECRET

# 4. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

The server starts on `http://localhost:3000` by default.

---

## Environment Variables

| Variable        | Description                        | Default                                     |
|-----------------|------------------------------------|---------------------------------------------|
| `PORT`          | Port to run the server on          | `3000`                                      |
| `MONGODB_URI`   | MongoDB connection string          | `mongodb://localhost:27017/finance_dashboard`|
| `JWT_SECRET`    | Secret for signing JWT tokens      | *(required)*                                |
| `JWT_EXPIRES_IN`| Token expiry duration              | `7d`                                        |
| `NODE_ENV`      | Environment mode                   | `development`                               |

---

## Seeding Demo Data

Run the seed script to create three demo users and 60 sample transactions:

```bash
npm run seed
```

Demo credentials:

| Role     | Email               | Password      |
|----------|---------------------|---------------|
| Admin    | admin@demo.com      | password123   |
| Analyst  | analyst@demo.com    | password123   |
| Viewer   | viewer@demo.com     | password123   |

---

## API Reference

All routes return JSON in the shape:
```json
{ "success": true, "message": "...", "data": { ... } }
```

### Authentication

| Method | Endpoint            | Access  | Description             |
|--------|---------------------|---------|-------------------------|
| POST   | /api/auth/register  | Public  | Register a new user     |
| POST   | /api/auth/login     | Public  | Login, receive JWT      |
| GET    | /api/auth/me        | Any     | Get current user info   |

**Register request body:**
```json
{
  "name": "Alice Admin",
  "email": "alice@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Login request body:**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

**Login response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGci...",
    "user": { "_id": "...", "name": "Alice Admin", "email": "...", "role": "admin" }
  }
}
```

All subsequent requests use the token as: `Authorization: Bearer <token>`

---

### Users (Admin only)

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | /api/users       | List all users           |
| GET    | /api/users/:id   | Get a single user        |
| PATCH  | /api/users/:id   | Update role/status/name  |
| DELETE | /api/users/:id   | Delete a user            |

**PATCH /api/users/:id body (all fields optional):**
```json
{
  "role": "analyst",
  "isActive": false,
  "name": "Updated Name"
}
```

---

### Transactions

| Method | Endpoint                | Access              | Description                    |
|--------|-------------------------|---------------------|--------------------------------|
| GET    | /api/transactions       | All roles           | List transactions (paginated)  |
| GET    | /api/transactions/:id   | All roles           | Get single transaction         |
| POST   | /api/transactions       | Admin, Analyst      | Create transaction             |
| PATCH  | /api/transactions/:id   | Admin, Analyst      | Update transaction             |
| DELETE | /api/transactions/:id   | Admin only          | Soft-delete transaction        |

**POST /api/transactions body:**
```json
{
  "amount": 2500.00,
  "type": "income",
  "category": "salary",
  "date": "2024-03-15",
  "notes": "March salary payment"
}
```

**GET /api/transactions query parameters:**

| Param      | Type   | Description                              |
|------------|--------|------------------------------------------|
| type       | string | Filter by `income` or `expense`          |
| category   | string | Filter by category name                  |
| startDate  | ISO date | Filter from this date                  |
| endDate    | ISO date | Filter to this date                    |
| page       | number | Page number (default: 1)                 |
| limit      | number | Results per page (default: 20, max: 100) |
| sort       | string | Sort field (default: `-date`)            |

**Supported types:** `income`, `expense`

**Supported categories:** `salary`, `freelance`, `investment`, `food`, `transport`, `utilities`, `entertainment`, `healthcare`, `education`, `rent`, `other`

---

### Dashboard (Admin, Analyst only)

| Method | Endpoint                      | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | /api/dashboard/summary        | Total income, expenses, net balance  |
| GET    | /api/dashboard/categories     | Breakdown of totals by category      |
| GET    | /api/dashboard/recent         | Most recent transactions             |
| GET    | /api/dashboard/trends/monthly | Monthly income vs expense for a year |
| GET    | /api/dashboard/trends/weekly  | Weekly breakdown for a given month   |

**GET /api/dashboard/summary** (optional `?startDate=&endDate=`):
```json
{
  "data": {
    "totalIncome": 15000,
    "totalExpenses": 8200,
    "netBalance": 6800,
    "totalTransactions": 34
  }
}
```

**GET /api/dashboard/trends/monthly?year=2024:**
```json
{
  "data": {
    "trends": [
      { "month": 1, "data": [{ "type": "income", "total": 5000, "count": 3 }, ...] },
      ...
    ]
  }
}
```

---

## Role & Access Control

| Action                     | Viewer | Analyst | Admin |
|----------------------------|:------:|:-------:|:-----:|
| Login / Register           | ✅     | ✅      | ✅    |
| View transactions          | ✅     | ✅      | ✅    |
| Create transactions        | ❌     | ✅      | ✅    |
| Update transactions        | ❌     | ✅      | ✅    |
| Delete transactions        | ❌     | ❌      | ✅    |
| View dashboard analytics   | ❌     | ✅      | ✅    |
| Manage users               | ❌     | ❌      | ✅    |

Access control is enforced using two middleware functions:
- `authenticate` — verifies the JWT and attaches the user to `req.user`
- `authorize(...roles)` — checks `req.user.role` is in the allowed list

---

## Data Models

### User
| Field     | Type    | Notes                              |
|-----------|---------|------------------------------------|
| name      | String  | Required, 2–100 chars              |
| email     | String  | Required, unique, lowercase        |
| password  | String  | Hashed with bcrypt, never returned |
| role      | String  | `viewer` / `analyst` / `admin`     |
| isActive  | Boolean | Deactivated users cannot log in    |
| createdAt | Date    | Auto-managed                       |

### Transaction
| Field     | Type     | Notes                                    |
|-----------|----------|------------------------------------------|
| amount    | Number   | Must be > 0                              |
| type      | String   | `income` or `expense`                    |
| category  | String   | Enum of 11 categories                    |
| date      | Date     | Defaults to now                          |
| notes     | String   | Optional, max 500 chars                  |
| createdBy | ObjectId | Reference to User                        |
| isDeleted | Boolean  | Soft delete flag (default: false)        |
| deletedAt | Date     | Set on soft delete                       |

---

## Design Decisions & Assumptions

**Soft delete** — Transactions are never hard-deleted. The `isDeleted` flag is set to `true` and they are excluded from all normal queries via a Mongoose pre-query hook. This preserves data integrity for auditing.

**Viewer cannot access dashboard** — A viewer role is meant for raw record visibility only. Analytics are considered a privileged operation for analysts and admins. This is a reasonable assumption for a finance system where summary data may be sensitive.

**Role assigned at registration** — In production, you would likely restrict role assignment to admins. For this assessment, any role can be specified on registration to make testing easier. This is documented as an intentional trade-off.

**Password never returned** — The `password` field has `select: false` in Mongoose, so it is never included in any response payload unless explicitly requested (only done internally in the login service).

**Pagination on transactions** — Defaults to 20 per page, capped at 100. This prevents performance issues on large datasets.

**MongoDB indexes** — Indexes are defined on `type`, `category`, `date`, and `createdBy` on the Transaction model to support efficient filtering and aggregation queries.

**Rate limiting** — 100 requests per 15-minute window per IP. Applied globally to all `/api/*` routes.

**JWT expiry** — Tokens expire in 7 days by default. No refresh token mechanism is implemented (out of scope for this assessment).

---

## Running Tests

Tests use Jest + Supertest against a real local MongoDB test database.

```bash
# Make sure MongoDB is running
npm test

# With coverage report
npm run test:coverage
```

Tests cover:
- User registration and login flows
- Token validation and authentication errors
- Role-based access enforcement (viewer/analyst/admin)
- Transaction CRUD including filtering and pagination
- Soft delete verification (deleted records excluded from listing)
- Input validation and error responses
