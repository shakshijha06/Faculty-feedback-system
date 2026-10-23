# System Architecture & Engineering Memory (BRAIN.md)

## 1. Project Overview & Institutional Context

The **Faculty Feedback System** is an institutional web platform serving the **University of Engineering & Management (UEM), Kolkata** and **Institute of Engineering & Management (IEM), Kolkata**. The system enables enrolled students to submit anonymous, quality-focused faculty feedback and participate in the annual **Award of Excellence** nomination process, while providing academic administrators with real-time analytics, user lifecycle controls, and nomination cycle administration.

---

## 2. Core Invariants & Architectural Decision Records (ADRs)

### ADR-01: Cryptographic Separation of Student Identity & Feedback Content
- **Problem:** Students hesitate to provide candid feedback if there is any possibility faculty or administrators can trace negative ratings or comments back to their student account.
- **Decision:** The system strictly separates **voter roll verification** from **ballot storage**:
  1. `SubmissionStatus`: Records `{ student, faculty, academicYear, submittedAt }`. This serves as the voter roll to prevent duplicate submissions by the same student for the same faculty in the same academic year.
  2. `FeedbackSubmission`: Stores ratings, mandatory justifications, strengths, and areas for improvement. This record contains **zero references** to `req.user._id` or `student`. Instead, it is linked only to an opaque UUID token (`anonymousToken`), the `faculty` ObjectId, and the `academicYear`.
  3. No database join, populated query, or foreign key exists between `SubmissionStatus` and `FeedbackSubmission`.

### ADR-02: Unified Portal with Dual Identifier Authentication
- **Problem:** Having separate student and admin login pages or demo login shortcuts leads to security holes and accidental admin privilege escalation.
- **Decision:** A single institutional login route (`/login`) accepts either a Student Enrollment Number (e.g., `1202200201001` stored in `rollNumber`) or an Administrator Institutional Email (e.g., `admin@uem.edu.in`). The backend identifies the user type securely, verifies the account's active state (`isActive === true`), generates a signed JWT containing role and identity claims, and responds with user metadata. The client routes students to `/dashboard` and admins to `/admin`.

### ADR-03: Department-Based Faculty Visibility
- **Problem:** Requiring manual creation of `FacultyAssignment` records for every semester, subject, and student section created an operational bottleneck that resulted in empty dashboards for students.
- **Decision:** Active students automatically view all active faculty belonging to their academic department via `GET /api/faculty/my-department`. This eliminates the prerequisite for pre-configured assignment mappings while ensuring students evaluate relevant professors.

### ADR-04: Nomination Cycle Lifecycle & Eligibility Bounds
- **Problem:** Unrestricted nominations allowed students to nominate arbitrary or inactive individuals, and nominations remained open indefinitely without structured review windows.
- **Decision:** The `NominationCycle` model establishes formal nomination cycles bounded by `academicYear` and explicit `status: 'open' | 'closed'`. Only faculty members explicitly listed in `eligibleFaculty` can be selected by students as primary or additional nominees. Exactly one cycle can be in an `open` state at any given time.

### ADR-05: Draft Persistence with Resumption
- **Problem:** Students evaluating multiple criteria with detailed justifications risked losing progress if interrupted or disconnected.
- **Decision:** The `FeedbackDraft` collection persists in-progress questionnaires indexed by `{ student, faculty, academicYear }`. On opening a feedback form, the client checks `GET /api/feedback/draft/:facultyId` and pre-populates previous responses. Once the final submission is committed to `FeedbackSubmission`, the draft is deleted atomically.

---

## 3. Component & Service Map

### Backend Modules (`server/`)
- `app.js` — Express application wiring, CORS configuration, JSON body parsing, route mounting, and centralized error middleware.
- `config/db.js` — Mongoose connection wrapper exposing `isDBConnected()` for graceful service degradation when database connectivity is unavailable.
- `models/User.js` — User model supporting both `student` and `admin` roles, pre-save bcrypt password hashing, and sparse unique enrollment indexing.
- `models/Faculty.js` — Faculty registry with department, designation, employee ID, and active toggle.
- `models/FeedbackSubmission.js` — Anonymous feedback storage with per-criterion rating justifications.
- `models/SubmissionStatus.js` — Voter roll tracking student submission state per faculty and academic year.
- `models/FeedbackDraft.js` — In-progress draft storage per student and faculty.
- `models/NominationCycle.js` — Administrative award cycles with eligible faculty bounds.
- `models/AwardNomination.js` — Primary and optional additional nominations submitted by students.
- `controllers/authController.js` — Authentication, session validation (`/me`), and authenticated password changes.
- `controllers/facultyController.js` — Faculty directory CRUD, department-scoped queries, and feedback aggregation.
- `controllers/feedbackController.js` — Anonymous submission intake, voter roll recording, draft save/load, and results computation.
- `controllers/nominationCycleController.js` — Cycle lifecycle management and eligible faculty configuration.
- `controllers/nominationController.js` — Student nomination submission, student nomination retrieval, leaderboard ranking, and committee status shortlisting.
- `controllers/adminController.js` — High-level dashboard statistics and student account administration.

### Frontend Modules (`client/src/`)
- `App.jsx` — Client routing with authenticated layouts and role-guarded routes.
- `context/AuthContext.jsx` — React Context managing authentication tokens, stored user identity, and Axios authorization headers.
- `components/PrivateRoute.jsx` — Route guard with server-side token validation via `/api/auth/me`.
- `components/Navbar.jsx` — Institutional navigation bar displaying user identity, role badge, password change access, and logout.
- `pages/Login.jsx` — University portal login with UEM and IEM branding.
- `pages/Dashboard.jsx` — Student home screen with profile summary and primary action cards.
- `pages/FeedbackList.jsx` — Department faculty directory with per-faculty submission status.
- `pages/FeedbackForm.jsx` — Multi-step evaluation form with interactive star ratings, mandatory justifications, draft saving, and pre-submit review.
- `pages/Nominations.jsx` — Award of Excellence form with active cycle detection, eligible faculty validation, and citation input.
- `pages/AdminDashboard.jsx` — Administrative portal with Overview metrics, Student Registry, Faculty Directory (with performance statistics), and Award Cycle/Leaderboard Management.
- `pages/ChangePassword.jsx` — Password modification form requiring current password verification and policy compliance.
- `index.css` — Institutional design system defining CSS custom properties, utility cards, badges, buttons, modals, and responsive tables.

---

## 4. Security & Cryptographic Guidelines

1. **Password Hashing:** Passwords are never stored in plaintext. Passwords are salted and hashed using `bcryptjs` with 12 salt rounds via Mongoose pre-save middleware.
2. **JWT Signing:** JWT tokens contain `{ id, role }` signed using HMAC SHA-256 (`process.env.JWT_SECRET`) with a 7-day expiration window.
3. **API Authorization:**
   - Public: `POST /api/auth/login`, `GET /health`
   - Authenticated: `GET /api/auth/me`, `PUT /api/auth/change-password`, `GET /api/faculty/my-department`, `POST /api/feedback/submit`, `POST /api/nominations`, `GET /api/nominations/mine`, `GET /api/nomination-cycles/active`
   - Admin-only: `/api/admin/*`, `/api/nomination-cycles` (POST/PUT), `/api/nominations/leaderboard`, `/api/faculty` (POST/PUT/DELETE)
4. **Student Privacy Protection:**
   - Feedback results APIs (`/api/feedback/results/:facultyId` and `/api/faculty/:id/stats`) only expose arithmetic averages and unlinked student comment strings.
   - Nomination leaderboard queries (`/api/nominations/leaderboard`) group by faculty and omit nominator IDs entirely.
