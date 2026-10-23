# Technical Requirements Document (TRD)

## Project: Faculty Feedback System (MERN Stack)
**Architecture:** Monolithic Client-Server Single Page Application  
**Version:** 2.0.0

---

## 1. Technology Stack Specification

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | >= 18.0.0 | JavaScript runtime environment |
| **Backend Framework** | Express.js | ^4.19.2 | REST API routing and middleware pipeline |
| **Database** | MongoDB Atlas | >= 6.0 | Document-oriented cloud database |
| **ODM** | Mongoose | ^8.5.1 | Data modeling, validation, and schema definitions |
| **Authentication** | jsonwebtoken / bcryptjs | ^9.0.2 / ^2.4.3 | Stateless JWT tokens and salt-hashed passwords |
| **Frontend Framework** | React | ^18.3.1 | Declarative component hierarchy |
| **Build Tool** | Vite | ^5.3.4 | Development bundling and optimized production build |
| **Routing** | React Router DOM | ^6.24.1 | Client-side routing and protected navigation |
| **HTTP Client** | Axios | ^1.7.3 | Promise-based HTTP client with interceptors |
| **Validation** | express-validator | ^7.1.0 | Request body schema validation |

---

## 2. Database Schema & Mongoose Models

### 2.1 User (`server/models/User.js`)
```javascript
{
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  role:        { type: String, enum: ['student', 'admin'], default: 'student' },
  rollNumber:  { type: String, unique: true, sparse: true, uppercase: true, trim: true },
  department:  { type: String, trim: true },
  semester:    { type: Number, min: 1, max: 8 },
  division:    { type: String, trim: true },
  isActive:    { type: Boolean, default: true }
}
```
*Indexes:* `{ email: 1 }` (unique), `{ rollNumber: 1 }` (unique, sparse), `{ role: 1 }`.

### 2.2 Faculty (`server/models/Faculty.js`)
```javascript
{
  name:        { type: String, required: true, trim: true },
  employeeId:  { type: String, required: true, unique: true, uppercase: true, trim: true },
  department:  { type: String, required: true, trim: true },
  designation: { type: String, trim: true },
  isActive:    { type: Boolean, default: true }
}
```
*Indexes:* `{ employeeId: 1 }` (unique), `{ department: 1 }`, `{ isActive: 1 }`.

### 2.3 FeedbackSubmission (`server/models/FeedbackSubmission.js`)
```javascript
{
  faculty:         { type: ObjectId, ref: 'Faculty', required: true },
  academicYear:    { type: String, required: true },
  department:      { type: String, required: true },
  anonymousToken:  { type: String, required: true },
  ratings: [{
    criterionKey:  { type: String, required: true },
    score:         { type: Number, required: true, min: 1, max: 5 },
    reason:        { type: String, required: true, minlength: 5, trim: true }
  }],
  positiveComment:    { type: String, trim: true },
  improvementComment: { type: String, trim: true }
}
```
*Indexes:* `{ faculty: 1, academicYear: 1 }`, `{ anonymousToken: 1, faculty: 1, academicYear: 1 }` (unique).

### 2.4 SubmissionStatus (`server/models/SubmissionStatus.js`)
```javascript
{
  student:      { type: ObjectId, ref: 'User', required: true },
  faculty:      { type: ObjectId, ref: 'Faculty', required: true },
  academicYear: { type: String, required: true },
  department:   { type: String, required: true },
  submittedAt:  { type: Date, default: Date.now }
}
```
*Indexes:* `{ student: 1, faculty: 1, academicYear: 1 }` (unique compound index).

### 2.5 FeedbackDraft (`server/models/FeedbackDraft.js`)
```javascript
{
  student:      { type: ObjectId, ref: 'User', required: true },
  faculty:      { type: ObjectId, ref: 'Faculty', required: true },
  academicYear: { type: String, required: true },
  ratings: [{
    criterionKey: { type: String, required: true },
    score:        { type: Number, min: 1, max: 5 },
    reason:       { type: String, trim: true }
  }],
  positiveComment:    { type: String, trim: true },
  improvementComment: { type: String, trim: true },
  lastSaved:          { type: Date, default: Date.now }
}
```
*Indexes:* `{ student: 1, faculty: 1, academicYear: 1 }` (unique compound index).

### 2.6 NominationCycle (`server/models/NominationCycle.js`)
```javascript
{
  title:           { type: String, required: true, trim: true },
  academicYear:    { type: String, required: true },
  status:          { type: String, enum: ['open', 'closed'], default: 'closed' },
  eligibleFaculty: [{ type: ObjectId, ref: 'Faculty' }],
  createdBy:       { type: ObjectId, ref: 'User' },
  openedAt:        { type: Date },
  closedAt:        { type: Date }
}
```
*Indexes:* `{ academicYear: 1 }`, `{ status: 1 }`.

### 2.7 AwardNomination (`server/models/AwardNomination.js`)
```javascript
{
  nominator:       { type: ObjectId, ref: 'User', required: true },
  academicYear:    { type: String, required: true },
  primaryFaculty:  { type: ObjectId, ref: 'Faculty', required: true },
  primaryReason:   { type: String, required: true, minlength: 10, trim: true },
  additionalNominees: [{
    faculty:       { type: ObjectId, ref: 'Faculty', required: true },
    reason:        { type: String, required: true, minlength: 10, trim: true }
  }],
  status:          { type: String, enum: ['pending', 'shortlisted'], default: 'pending' }
}
```
*Indexes:* `{ nominator: 1, academicYear: 1 }` (unique compound index).

---

## 3. REST API Specifications

### 3.1 Authentication
- `POST /api/auth/login`
  - Body: `{ identifier: "<rollNumber or email>", password: "<password>" }`
  - Response: `{ success: true, token: "<JWT>", user: { id, name, role, email, rollNumber, department, semester } }`
- `GET /api/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ success: true, user: { ... } }`
- `PUT /api/auth/change-password`
  - Header: `Authorization: Bearer <token>`
  - Body: `{ currentPassword: "<str>", newPassword: "<str (min 6)>" }`
  - Response: `{ success: true, message: "Password updated successfully." }`
- `POST /api/auth/logout`
  - Response: `{ success: true, message: "Logged out." }`

### 3.2 Faculty Management & Scoped Queries
- `GET /api/faculty/my-department` (Student)
  - Returns active faculty matching the student's department.
- `GET /api/faculty/all` (Authenticated)
  - Returns all registered faculty members.
- `GET /api/faculty/:id/stats` (Admin)
  - Returns calculated average rating per question, overall mean, and anonymous student feedback comments.
- `POST /api/faculty` (Admin)
  - Body: `{ name, employeeId, department, designation }`
- `PUT /api/faculty/:id` (Admin)
  - Body: `{ name, employeeId, department, designation }`
- `DELETE /api/faculty/:id` (Admin)
  - Soft-deactivates faculty (`isActive = false`).
- `PUT /api/faculty/:id/reactivate` (Admin)
  - Reactivates faculty account (`isActive = true`).

### 3.3 Feedback & Drafts
- `GET /api/feedback/status/:facultyId` (Student)
  - Returns `{ hasSubmitted: Boolean, submittedAt: Date }` from `SubmissionStatus`.
- `POST /api/feedback/submit` (Student)
  - Body: `{ facultyId, academicYear, ratings: [{ criterionKey, score, reason }], positiveComment, improvementComment }`
  - Atomically writes to `SubmissionStatus` and `FeedbackSubmission` (with unlinked UUID token) and purges any active `FeedbackDraft`.
- `POST /api/feedback/draft` (Student)
  - Body: `{ facultyId, academicYear, ratings, positiveComment, improvementComment }`
  - Upserts draft in `FeedbackDraft`.
- `GET /api/feedback/draft/:facultyId` (Student)
  - Returns saved in-progress draft or `null`.

### 3.4 Nomination Cycles & Award Submissions
- `GET /api/nomination-cycles/active` (Authenticated)
  - Returns the open cycle with populated eligible faculty, or `null`.
- `GET /api/nomination-cycles` (Admin)
  - Returns all cycles with eligible faculty counts.
- `POST /api/nomination-cycles` (Admin)
  - Body: `{ title, academicYear, status, eligibleFaculty: [ObjectId] }`
- `PUT /api/nomination-cycles/:id` (Admin)
  - Body: `{ title, status, eligibleFaculty: [ObjectId] }`
- `POST /api/nominations` (Student)
  - Body: `{ primaryFaculty, primaryReason, additionalNominees: [{ faculty, reason }] }`
  - Validates active cycle status, faculty eligibility, and enforces one nomination per student.
- `GET /api/nominations/mine` (Student)
  - Returns current user's submitted nomination details.
- `GET /api/nominations/leaderboard` (Admin)
  - Aggregates nominations by faculty, sorted in descending order of count, including citation quotes without nominator identity.
- `GET /api/nominations` (Admin)
  - Returns all nominations with primary and additional nominees.
- `PUT /api/nominations/:id/status` (Admin)
  - Body: `{ status: 'pending' | 'shortlisted' }`

### 3.5 Administration & Statistics
- `GET /api/admin/dashboard` (Admin)
  - Returns counts: `{ studentCount, activeStudentCount, facultyCount, submissionCount, pendingNominations }`.
- `GET /api/admin/users` (Admin)
  - Returns student list with roll numbers, departments, semesters, and active states.
- `POST /api/admin/users` (Admin)
  - Body: `{ name, email, rollNumber, password, department, semester, division }`
- `PUT /api/admin/users/:id` (Admin)
  - Updates student profile.
- `DELETE /api/admin/users/:id` (Admin)
  - Soft-deactivates student.
- `PUT /api/admin/users/:id/reactivate` (Admin)
  - Reactivates student.

---

## 4. Frontend Route Architecture

| Route | Guard | Target Component | Description |
|---|---|---|---|
| `/login` | Public | `Login.jsx` | Institutional portal login |
| `/dashboard` | `PrivateRoute(role="student")` | `Dashboard.jsx` | Student landing page with profile & action cards |
| `/feedback-list` | `PrivateRoute(role="student")` | `FeedbackList.jsx` | Department faculty selection list |
| `/feedback/:facultyId` | `PrivateRoute(role="student")` | `FeedbackForm.jsx` | 3-Step feedback form with star ratings, reasons & draft save |
| `/nominations` | `PrivateRoute(role="student")` | `Nominations.jsx` | Cycle-aware Award of Excellence nomination form |
| `/admin` | `PrivateRoute(role="admin")` | `AdminDashboard.jsx` | Overview, Students, Faculty, and Award Cycles/Leaderboard |
| `/change-password` | `PrivateRoute()` | `ChangePassword.jsx` | Authenticated password modification for all roles |
| `*` | Public | `HomeRedirect` | Directs authenticated users to dashboard, others to `/login` |

---

## 5. Verification & Testing Evidence

1. **Frontend Vite Build:** `npm --prefix client run build` completed cleanly in 2.91s generating 100 modules into `dist/assets/index-BjdtFto3.js` and `dist/assets/index-CPOS5eXE.css` without errors.
2. **Backend Syntax Check:** `node --check` executed across all server entry points, controllers, models, routes, and middleware files with exit code 0.
3. **Graceful Database Handling:** Database access methods check `isDBConnected()` and respond with HTTP 503 instead of crashing or hanging.
