# Faculty Feedback System

A full-stack MERN (MongoDB, Express, React, Node.js) application for collecting anonymous faculty feedback from college students.

## Features

- **Student Portal:** View assigned courses, submit anonymous faculty feedback (star ratings + comments), nominate faculty for Award of Excellence
- **Admin Dashboard:** Manage faculty, courses, and assignments; review aggregated feedback results; manage award nominations
- **Privacy by Design:** Student identities are never linked to feedback content — separate SubmissionStatus (who submitted) from FeedbackSubmission (what was submitted)
- **Secure Auth:** JWT-based authentication with bcrypt password hashing
- **Graceful DB handling:** Server starts without a database and returns clear errors for DB operations

---

## Project Structure

```
mernproject/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Navbar, PrivateRoute
│   │   ├── context/         # AuthContext (JWT + localStorage)
│   │   ├── data/            # Mock data (Phase 3)
│   │   ├── pages/           # Login, Dashboard, FeedbackForm, Nominations, AdminDashboard
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx          # Router
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles / design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                  # Express + MongoDB backend
│   ├── config/db.js         # Mongoose connection (graceful failure)
│   ├── controllers/         # authController, facultyController, courseController,
│   │                        # assignmentController, feedbackController,
│   │                        # nominationController, adminController
│   ├── middleware/           # errorHandler, authMiddleware (protect, adminOnly)
│   ├── models/              # User, Faculty, Course, FacultyAssignment,
│   │                        # FeedbackSubmission, SubmissionStatus, AwardNomination
│   ├── routes/              # authRoutes, facultyRoutes, courseRoutes,
│   │                        # assignmentRoutes, feedbackRoutes,
│   │                        # nominationRoutes, adminRoutes
│   ├── scripts/seedAdmin.js # One-time admin account creation
│   ├── app.js               # Express app setup
│   ├── index.js             # Server entry point
│   ├── .env.example         # Environment variable template
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **MongoDB Atlas** account (or local MongoDB) — not required to start the frontend

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Faculty-feedback-system
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

### 4. Configure environment variables

```bash
cd ../server
cp .env.example .env
```

Edit `server/.env` and fill in:

| Variable         | Description                                    | Example                                                  |
|------------------|------------------------------------------------|----------------------------------------------------------|
| `MONGODB_URI`    | MongoDB Atlas connection string                | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/ffs`   |
| `PORT`           | Express server port                            | `5000`                                                   |
| `JWT_SECRET`     | Random secret for signing JWTs                 | `my-super-secret-key-change-this`                        |
| `NODE_ENV`       | Environment mode                               | `development`                                            |
| `ADMIN_EMAIL`    | Initial admin email (for seed script)          | `admin@example.com`                                      |
| `ADMIN_PASSWORD` | Initial admin password (for seed script)       | `replace_with_a_strong_password`                                         |

> **ADMIN_EMAIL and ADMIN_PASSWORD - These are example values only. Set your own credentials in your local .env file....Never commit your `.env` file.** It is already in `.gitignore`.

---

## Running the Application

### Start the backend (server)

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`.
If `MONGODB_URI` is not configured, the server will still start but DB operations will return 503 errors.

### Start the frontend (client)

```bash
cd client
npm run dev
```

The React app will start on `http://localhost:5173`.
API requests are automatically proxied to the Express server.

> **Tip:** The frontend works with mock data even without the backend running — use the "Quick Login" buttons on the login page to explore the UI.

---

## Verify the Server

### Health check

```bash
curl http://localhost:5000/api/health
```

Expected response (without DB):
```json
{
  "success": true,
  "server": "running",
  "database": "disconnected",
  "message": "Server is up. Database is not connected — check your MONGODB_URI in server/.env."
}
```

---

## Create Initial Admin Account

After configuring `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in your `.env`:

```bash
cd server
node scripts/seedAdmin.js
```

This is safe to run multiple times — it checks for existing admins before creating one.

---

## API Reference

| Method | Path                              | Auth       | Description                        |
|--------|-----------------------------------|------------|------------------------------------|
| POST   | `/api/auth/login`                 | Public     | Log in (student or admin)          |
| GET    | `/api/auth/me`                    | Token      | Get current user profile           |
| POST   | `/api/auth/logout`                | Token      | Client-side logout                 |
| GET    | `/api/faculty`                    | Token      | List all active faculty            |
| POST   | `/api/faculty`                    | Admin      | Create faculty member              |
| PUT    | `/api/faculty/:id`                | Admin      | Update faculty                     |
| DELETE | `/api/faculty/:id`                | Admin      | Deactivate faculty                 |
| GET    | `/api/courses`                    | Token      | List all courses                   |
| POST   | `/api/courses`                    | Admin      | Create course                      |
| GET    | `/api/assignments/my`             | Student    | Get my open assignments            |
| GET    | `/api/assignments`                | Admin      | Get all assignments                |
| POST   | `/api/assignments`                | Admin      | Create assignment                  |
| PUT    | `/api/assignments/:id`            | Admin      | Update assignment                  |
| POST   | `/api/feedback/submit`            | Student    | Submit anonymous feedback          |
| GET    | `/api/feedback/status/:assignId`  | Student    | Check submission status            |
| GET    | `/api/feedback/results/:assignId` | Admin      | Aggregated results (anonymous)     |
| POST   | `/api/nominations`                | Student    | Nominate faculty for award         |
| GET    | `/api/nominations/mine`           | Student    | View own nomination                |
| GET    | `/api/nominations`                | Admin      | All nominations                    |
| PUT    | `/api/nominations/:id/status`     | Admin      | Update nomination status           |
| GET    | `/api/admin/dashboard`            | Admin      | Dashboard stats                    |
| GET    | `/api/admin/users`                | Admin      | List students                      |
| POST   | `/api/admin/users`                | Admin      | Create student account             |
| PUT    | `/api/admin/users/:id`            | Admin      | Update student                     |
| DELETE | `/api/admin/users/:id`            | Admin      | Deactivate student                 |

---

## Privacy Design

```
SubmissionStatus      FeedbackSubmission
(WHO submitted)       (WHAT was submitted)
┌─────────────┐       ┌──────────────────┐
│ student  ────┼───×   │ anonymousToken   │
│ assignment   │       │ assignment       │
│ hasSubmitted │       │ ratings[]        │
│ submittedAt  │       │ comments         │
└─────────────┘       └──────────────────┘
     ↑ NO link between these two models ↑
```

- **Faculty never see** SubmissionStatus records
- **Results API** returns only averages and anonymous comments
- **Duplicate prevention** is enforced at the DB level (unique index)

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React 18, Vite 5        |
| Routing    | React Router v6         |
| HTTP       | Axios                   |
| Backend    | Express 4, Node.js      |
| Database   | MongoDB, Mongoose 8     |
| Auth       | JWT, bcryptjs           |
| Validation | express-validator       |

---

## Manual Steps Required

1. **Create a MongoDB Atlas cluster** and get your connection string
2. **Fill in `server/.env`** with your credentials (copy from `.env.example`)
3. **Run `node scripts/seedAdmin.js`** to create the first admin account
4. **Install dependencies** in both `client/` and `server/` directories
