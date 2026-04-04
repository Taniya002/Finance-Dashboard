# Finance Dashboard API

A RESTful backend for a finance dashboard system that handles financial records, user roles, and summary analytics. Built with Node.js, Express, and MongoDB.

---

## Features
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seed Demo Data](#seed-demo-data)
- [API Reference](#api-reference)
- [Role and Access Control](#role-and-access-control)
- [Data Models](#data-models)
- [Design Decisions](#design-decisions)
- [Running Tests](#running-tests)

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | Node.js | Fast, non-blocking I/O |
| Framework | Express | Simple and flexible |
| Database | MongoDB + Mongoose | Great for aggregation queries |
| Auth | JWT | Stateless and easy to verify |
| Validation | express-validator | Clean, in-route validation |
| Password | bcryptjs | Industry-standard hashing |
| Rate Limiting | express-rate-limit | Brute-force protection |
| Testing | Jest + Supertest | Integration tests on real routes |

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # HTTP request/response handling
│   ├── middleware/     # Auth, validation, error handler
│   ├── models/         # User and Transaction schemas
│   ├── routes/         # Route definitions with validators
│   ├── services/       # Business logic layer
│   └── utils/          # Response helpers and seed script
├── tests/              # Integration tests
├── .env.example
├── package.json
└── README.md
```

Controllers handle HTTP only. All business logic lives in services, keeping things clean and testable. Models own their own validation rules.

---

## Getting Started

**Prerequisites:** Node.js v18+ and MongoDB (local or Atlas)

```bash
git clone <your-repo-url>
cd finance-dashboard
npm install
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET in .env
npm run dev
```

Server starts at `http://localhost:3000`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/finance_dashboard` |
| `JWT_SECRET` | JWT signing secret | required |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `NODE_ENV` | Environment | `development` |

---

## Seed Demo Data

Creates 3 users and 60 sample transactions:

```bash
npm run seed
```

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Analyst | analyst@demo.com | password123 |
| Viewer | viewer@demo.com | password123 |

---

## API Reference

All responses follow this shape:
```json
{ "success": true, "message": "...", "data": { ... } }
```

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Register a new user |
| POST | /api/auth/login | Public | Login and get JWT token |
| GET | /api/auth/me | Any | Get current user info |

**Register body:**
```json
{
  "name": "Alice Admin",
  "email": "alice@example.com",
  "password": "password123",
  "role": "admin"
}
```

Use token in all requests: `Authorization: Bearer <token>`

---

### Users (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get a single user |
| PATCH | /api/users/:id | Update role, status, or name |
| DELETE | /api/users/:id | Delete a user |

---

### Transactions

| Method | Endpoint | Who can access |
|--------|----------|----------------|
| GET | /api/transactions | Viewer, Analyst, Admin |
| GET | /api/transactions/:id | Viewer, Analyst, Admin |
| POST | /api/transactions | Analyst, Admin |
| PATCH | /api/transactions/:id | Analyst, Admin |
| DELETE | /api/transactions/:id | Admin only |

**Create transaction body:**
```json
{
  "amount": 2500,
  "type": "income",
  "category": "salary",
  "date": "2024-03-15",
  "notes": "March salary"
}
```

**Supported types:** `income`, `expense`

**Supported categories:** `salary`, `freelance`, `investment`, `food`, `transport`, `utilities`, `entertainment`, `healthcare`, `education`, `rent`, `other`

**Filter options (query params):**

| Param | Description |
|-------|-------------|
| type | income or expense |
| category | any supported category |
| startDate | filter from date (ISO 8601) |
| endDate | filter to date (ISO 8601) |
| page | page number (default: 1) |
| limit | results per page (default: 20, max: 100) |

---

### Dashboard (Analyst, Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/summary | Total income, expenses, net balance |
| GET | /api/dashboard/categories | Totals grouped by category |
| GET | /api/dashboard/recent | Most recent transactions |
| GET | /api/dashboard/trends/monthly | Monthly trends for a year |
| GET | /api/dashboard/trends/weekly | Weekly trends for a month |

**Summary response:**
```json
{
  "totalIncome": 15000,
  "totalExpenses": 8200,
  "netBalance": 6800,
  "totalTransactions": 34
}
```

---

## Role and Access Control

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| Login / Register | Allowed | Allowed | Allowed |
| View transactions | Allowed | Allowed | Allowed |
| Create transactions | Not allowed | Allowed | Allowed |
| Update transactions | Not allowed | Allowed | Allowed |
| Delete transactions | Not allowed | Not allowed | Allowed |
| View dashboard analytics | Not allowed | Allowed | Allowed |
| Manage users | Not allowed | Not allowed | Allowed |

Access control uses two middleware functions — `authenticate` checks the JWT token, and `authorize(...roles)` checks if the user's role is permitted for that route.

---

## Data Models

### User
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required, 2-100 chars |
| email | String | Required, unique |
| password | String | Hashed with bcrypt, never returned in responses |
| role | String | viewer / analyst / admin |
| isActive | Boolean | Inactive users cannot log in |

### Transaction
| Field | Type | Notes |
|-------|------|-------|
| amount | Number | Must be greater than 0 |
| type | String | income or expense |
| category | String | One of 11 supported categories |
| date | Date | Defaults to current date |
| notes | String | Optional, max 500 chars |
| createdBy | ObjectId | References the User who created it |
| isDeleted | Boolean | Soft delete flag |
| deletedAt | Date | Set when soft deleted |

---

## Design Decisions

**Soft delete on transactions** — Financial records should never be permanently deleted. Setting `isDeleted: true` keeps the data for auditing while hiding it from normal queries. A Mongoose pre-query hook handles this automatically.

**Viewer cannot access dashboard** — The viewer role is meant for looking at raw records only. Analytics and summaries are treated as privileged data, so only analysts and admins can access them.

**Role at registration** — In a real production system, role assignment would be restricted to admins. For this project, roles can be set at registration to make testing easier. This is an intentional tradeoff.

**Password never exposed** — The password field uses `select: false` in Mongoose so it never appears in any API response.

**Pagination defaults** — Transactions default to 20 per page with a max of 100. This keeps responses fast even with large datasets.

**MongoDB indexes** — Indexes on `type`, `category`, `date`, and `createdBy` make filtering and aggregation queries efficient.

**Rate limiting** — 100 requests per 15 minutes per IP across all `/api/*` routes.

---

## Running Tests

```bash
npm test

# With coverage
npm run test:coverage
```

Tests cover registration and login, token validation, role-based access for all three roles, transaction CRUD, soft delete behaviour, filtering, pagination, and input validation errors.
