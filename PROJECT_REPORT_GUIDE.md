# Comprehensive College Project Report Writing Guide
## Institutional Faculty Feedback & Award of Excellence System (MERN Stack)

> **Document Purpose:**  
> This guide is the official blueprint for preparing the final academic project report for the **Faculty Feedback System**. It is authored directly from the actual implemented codebase, database architecture, authentication models, user workflows, and UI redesign. Team members must consult this document to write their assigned chapters accurately without fabricating details or repeating generic textbook filler.

---

## Guide Overview & Table of Contents

1. [Preliminary Pages Guide](#preliminary-pages)
   - Cover / Title Page
   - Certificate of Originality
   - Student Declaration
   - Acknowledgement
   - Abstract & Project Draft
   - Table of Contents, List of Figures, List of Tables
2. [Chapter 1: Introduction](#chapter-1--introduction)
3. [Chapter 2: Problem Statement & Existing Limitations](#chapter-2--problem-statement)
4. [Chapter 3: Proposed System & Software Requirements Specification (SRS)](#chapter-3--proposed-solution)
5. [Chapter 4: Experimental Setup, System Implementation & Result Analysis](#chapter-4--experimental-setup-and-result-analysis)
   - 4.1 Frontend Architecture & Component Organisation
   - 4.2 Backend Architecture & API Pipeline
   - 4.3 System Connectivity & Environment Setup
   - 4.4 Test Cases & Result Verification Framework
6. [Chapter 5: Conclusion and Future Scope](#chapter-5--conclusion-and-future-scope)
7. [Chapter 6: Bibliography & Technical References](#chapter-6--bibliography)
8. [Comprehensive Screenshot Collection Checklist](#screenshot-collection-checklist)
9. [Report Writing Standards: What to Write & What NOT to Write](#what-to-write-and-what-not-to-write)

---

# Preliminary Pages

Every formal academic engineering report begins with standardized preliminary matter numbered with lowercase Roman numerals (`i`, `ii`, `iii`, etc.).

---

### 1. Cover Page / Title Page
- **What to Include:**
  - Full Project Title: `DESIGN AND IMPLEMENTATION OF AN INSTITUTIONAL FACULTY EVALUATION AND EXCELLENCE RECOGNITION SYSTEM WITH CRYPTOGRAPHIC VOTER DECOUPLING AND TIMETABLE INITIALS DIRECTORY SEARCH`
  - Subtitle: `A MERN-Stack Single Page Enterprise Application for Academic Quality Assurance`
  - Institutional Affiliation: University of Engineering & Management (UEM), Kolkata / Institute of Engineering & Management (IEM), Kolkata.
  - Department Name (e.g., Department of Computer Science and Engineering / Information Technology).
  - Degree Name (e.g., Bachelor of Technology in Computer Science and Engineering).
  - Student Names, University Roll Numbers, and Registration Numbers.
  - Supervisor / Guide Name, Designation, and Department.
  - Academic Session / Year (e.g., 2024–2025).
- **What to Avoid:**
  - Colorful decorative borders, non-standard fonts, clip art, or emojis.
  - Unofficial abbreviations for department or degree.
- **Manual Verification:** Confirm exact spelling of supervisors' names, official degree titles, and institution logos.

---

### 2. Certificate
- **What to Include:**
  - Formal institutional certification statement that the project entitled *"[Project Title]"* submitted by *[Student Names with Roll Numbers]* is a bona fide record of work carried out under the supervisor's guidance.
  - Signatures, dates, and designation placeholders:
    - Project Supervisor / Guide
    - Head of Department (HOD)
    - External Examiner
    - Internal Examiner
- **What to Avoid:**
  - Claiming work was done for an outside commercial client unless formally sponsored.
- **Manual Verification:** Ensure signature lines match department format guidelines.

---

### 3. Declaration
- **What to Include:**
  - Explicit statement that the work presented in this report is original and developed by the team members.
  - Declaration that this report has not been submitted elsewhere for the award of any other degree or diploma.
  - References and citations to third-party open-source libraries (React, Express, Mongoose, Node.js, Lucide).
  - Date, place (Kolkata), and signatures of all team members.

---

### 4. Acknowledgement
- **What to Include:**
  - Professional appreciation to the Project Supervisor for technical direction and code review.
  - Gratitude to the Head of Department (HOD) and Principal / Dean for laboratory facilities and administrative permissions.
  - Appreciation to faculty members of the department who participated in testing routine initials and evaluation factors.
  - Thanks to fellow students for feedback testing, and to family members for encouragement.
- **What to Avoid:**
  - Informal slang, casual nicknames, or overly sentimental personal notes.

---

### 5. Abstract

#### Abstract Writing Guide for this System
The abstract must be a dense, structured, single-paragraph summary (250–350 words) answering six core questions:
1. **Context & Motivation:** Why is institutional faculty evaluation critical in higher education?
2. **Core Problems:** What prevents honest participation? (Fear of reprisal if ratings link to student identities, lack of actionable qualitative justification, and difficulty finding faculty members whose routines list timetable abbreviations/initials).
3. **Proposed Architecture:** How is the system constructed? (MERN stack — MongoDB Atlas, Express.js, React + Vite, Node.js — with cryptographic voter-roll separation).
4. **Key Technical Features:** Dual-identifier authentication (roll number or email), timetable initials search engine matching full names, partial names, and routine abbreviations (e.g., "AKD" / "A.K.D."), inline 7-factor evaluation with real-time draft debouncing, and an Award of Excellence nomination cycle governance module.
5. **Privacy Model:** How is anonymity handled? (`SubmissionStatus` tracks voter eligibility, while `FeedbackSubmission` stores unlinked anonymous records with UUID tokens, ensuring zero foreign-key linking to student IDs).
6. **Outcomes & Conclusion:** How does this application provide administrative decision support while upholding student trust?

#### Project-Specific Abstract Draft (Ready for Team Customisation)
> In contemporary higher education institutions, student feedback serves as a cornerstone for academic quality assurance and pedagogical enhancement. However, conventional feedback collection mechanisms frequently suffer from structural impediments: student apprehension regarding academic retaliation, superficial numerical ratings lacking qualitative justification, and operational friction in identifying professors whose identities are abbreviated on academic timetables. This project presents the design and implementation of an institutional Faculty Evaluation and Excellence Recognition System developed using the MERN stack (MongoDB Atlas, Express.js, React, Node.js). The system introduces a cryptographic voter-roll separation architecture wherein student participation is audited through an isolated `SubmissionStatus` registry to prevent duplicate evaluations, while qualitative feedback records are committed to `FeedbackSubmission` accompanied exclusively by transient anonymous tokens, eliminating student identifiers from administrative reports. To resolve routine navigation friction, a multi-pattern search engine was engineered that indexes full names, individual name components, and timetable abbreviations (e.g., resolving "AKD" and "A.K.D." to "Anirban Kumar Das"), accommodating multiple faculty sharing identical initials. An inline seven-factor evaluation interface with debounced draft persistence allows continuous autosaving across sessions. Additionally, an administrative Award of Excellence module manages nomination cycles, eligible faculty rosters, and transparent citation leaderboards. Built upon a corporate institutional design system with role-guarded routing, the resulting portal delivers an auditable, high-trust administrative solution for academic institutions.

---

### 6. Table of Contents, List of Figures & List of Tables
- **Table of Contents:** Must list all preliminary pages (`i` to `vii`), major chapter titles, primary numbered subsections (`1.1`, `1.2`, `2.1`), bibliography, and appendices with exact corresponding page numbers.
- **List of Figures:** Tabulates figure numbers, captions, and page numbers (e.g., `Figure 3.1: System Architecture Diagram ..... 24`).
- **List of Tables:** Tabulates table numbers, titles, and page numbers (e.g., `Table 4.1: Database Schema Specifications ..... 42`).

---

# CHAPTER 1 — INTRODUCTION

### 1.1 Background of the Project
- **What to write:**
  - Introduce institutional accreditation requirements (NAAC, NBA, NIRF) mandating periodic, structured student feedback on teaching effectiveness and course coverage.
  - Contextualize the deployment environment: University of Engineering & Management (UEM), Kolkata and Institute of Engineering & Management (IEM), Kolkata.
  - Discuss the transition from subjective, unstructured complaints to structured academic feedback systems.
- **What to avoid:**
  - Do not write generic essays on the history of the internet or computers. Keep focus strictly on educational evaluation systems.

### 1.2 The Need for a Digital Feedback Mechanism
- **What to write:**
  - Manual paper forms or basic Google Forms fail institutional integrity:
    1. Paper forms require labor-intensive manual data entry and risk handwriting recognition compromising student identity.
    2. Google Forms either require collecting Google email accounts (destroying anonymity) or allow untracked links (enabling ballot-stuffing and repeated submissions).
    3. Neither approach integrates with college routines or semester rosters.
- **Suggested Diagram:** A flowchart contrasting *Manual Paper Collection vs. Digital Cryptographic Feedback Pipeline*.

### 1.3 Purpose and Objectives
- **What to write:**
  - **Objective 1:** Implement secure authentication accepting student enrollment numbers and administrative emails through a unified institutional entry point.
  - **Objective 2:** Enforce voter decoupling to ensure student identities cannot be queried alongside evaluation scores.
  - **Objective 3:** Implement an intelligent timetable directory search allowing students to search faculty by full name, first name, last name, or timetable initials (e.g., `AKD` or `A.K.D.`).
  - **Objective 4:** Provide structured seven-factor evaluations requiring qualitative justifications (min. 5 characters) for every numerical score (1–5) and an overall course evaluation (min. 10 characters).
  - **Objective 5:** Implement real-time draft debouncing to preserve in-progress feedback against accidental tab closures or disconnections.
  - **Objective 6:** Build a formal Award of Excellence lifecycle system enabling administrative cycle scheduling, student citations, and committee shortlisting.

### 1.4 Scope of the Project
- **What to write:**
  - **In Scope:**
    - Student authentication, profile view, department-scoped faculty listing.
    - Full-text and initial-based faculty search.
    - Inline evaluation forms with 1–5 segmented scores, per-criterion justifications, and autosave.
    - Award of Excellence nomination submissions (primary nominee + up to 2 additional nominees with citations).
    - Administrative management of students and faculty members (CRUD, deactivation/reactivation).
    - Aggregated evaluation analytics per faculty member (averages, distributions, unlinked comments).
    - Award cycle governance (opening, closing, eligible faculty scoping, leaderboard review, shortlist toggle).
    - Password management with credential verification.
  - **Out of Scope (Explicit Boundaries):**
    - Automatic timetable generation or attendance tracking (this is an evaluation system, not an ERP).
    - Direct messaging or chat between students and professors.
    - Public social media sharing.

### 1.5 Intended Users & Personas
- **Student Persona:** Enrolled undergraduate or postgraduate student identified by University Enrollment Number (e.g., `1202200201001`). Primary intent: evaluate department professors and nominate outstanding mentors without fear of reprisal.
- **Administrator Persona:** Department head or academic registrar identified by institutional email (`admin@uem.edu.in`). Primary intent: manage student registries, maintain faculty directory with verified timetable initials, inspect feedback metrics, and supervise award cycles.

### 1.6 Technology Stack Overview
- **Frontend:** React 18.3.1, Vite 5.3.4, React Router DOM 6.24.1, Axios 1.7.3, Lucide React icons.
- **Backend:** Node.js, Express.js 4.19.2, jsonwebtoken (JWT), bcryptjs (12 salt rounds), express-validator.
- **Database:** MongoDB Atlas (Cloud Database), Mongoose 8.5.1 ODM.

---

# CHAPTER 2 — PROBLEM STATEMENT

### 2.1 Existing System and Its Critical Limitations
Detail the specific operational hurdles that motivated the development of this platform:

1. **The Fear of Reprisal (Identity Compromise):**
   - In traditional college environments, students worry that negative feedback will lead to punitive internal assessment grading.
   - Most institutional surveys fail to separate voter auditing from answer recording.
2. **Superficial Numerical Data (The "Star Only" Trap):**
   - Generic 1–5 star ratings without mandatory reasoning provide zero actionable insight. An educator receiving a "2" cannot determine if the issue was speech pacing, slide clarity, or syllabus difficulty.
3. **Routine / Timetable Initials Disconnect:**
   - College routines and timetables distribute faculty codes as 2- or 3-letter abbreviations (e.g., "AKD", "DD", "SM").
   - First- and second-year students frequently do not know the complete formal spelling of their professors' names, resulting in feedback forms being submitted for the wrong faculty member or left incomplete.
4. **Data Loss During Long Evaluations:**
   - Multi-factor surveys with written comments cause cognitive fatigue. When students navigate away or experience network drops, progress is lost in standard web forms lacking server-backed draft persistence.
5. **Unstructured Recognition Mechanisms:**
   - Institutional awards are often decided through informal popularity contests rather than documented student citations with auditable committee oversight.

### 2.2 Specific Problems Solved by this Implementation
Explicitly distinguish general educational problems from what the software actually solves:
- **Solved:** Cryptographic separation of student records from rating records (`SubmissionStatus` vs. `FeedbackSubmission`).
- **Solved:** Dual-search engine supporting exact names, substrings, and timetable initials with dot-agnostic normalization.
- **Solved:** Mandatory textual context enforcement (minimum character validation).
- **Solved:** Automatic debounced server draft persistence per student and faculty member.
- **Solved:** Structured nomination cycles with administrative bounds and auditable citation leaderboards.
- **Not Solved / Institutional Responsibility:** Resolving internal faculty disputes, forcing students to submit evaluations, or automatically revising syllabi.

---

# CHAPTER 3 — PROPOSED SOLUTION

### 3.1 Overall System Architecture
- **Architecture Pattern:** Client-Server Single Page Application (SPA) RESTful Architecture.
- **Interaction Model:**
  - Client sends JSON payloads over HTTPS to Express route handlers.
  - Middleware inspects incoming Bearer JWT tokens in `Authorization` headers.
  - Database queries execute against MongoDB Atlas collections using Mongoose models.
  - Responses return standardized JSON envelopes `{ success: true, data: ..., message: ... }`.

```
+-----------------------------------------------------------------------------------+
|                              REACT FRONTEND (Vite SPA)                             |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  | Auth Context & JWT|  | Faculty Search Bar |  | Inline Evaluation / Autosave  | |
|  +-------------------+  +--------------------+  +-------------------------------+ |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON (Axios REST)
                                           v
+-----------------------------------------------------------------------------------+
|                             EXPRESS.JS REST API SERVER                             |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  | authMiddleware    |  | Validation Pipeline|  | Controllers (Feedback/Faculty)| |
|  | (JWT Bearer Token)|  | (express-validator)|  | (Decoupled Submission Engine) | |
|  +-------------------+  +--------------------+  +-------------------------------+ |
+------------------------------------------+----------------------------------------+
                                           | Mongoose 8.5.1 ODM
                                           v
+-----------------------------------------------------------------------------------+
|                               MONGODB ATLAS CLUSTER                               |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  | users (Students/  |  | faculties (Name,   |  | feedbacksubmissions (Anonym-  | |
|  |  Admins, bcrypt)  |  |  Initials, Dept)   |  |  ous Token, Ratings, Reasons) | |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  | submissionstatuses|  | feedbackdrafts     |  | nominationcycles &            | |
|  | (Voter Roll Audit)|  | (Debounced Drafts) |  | awardnominations (Leaderboard)| |
|  +-------------------+  +--------------------+  +-------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 3.2 User Roles, Permissions & Workflows

#### A. Student Workflow
1. Student navigates to `/login`, enters Enrollment Number and password.
2. System identifies `role: 'student'` and redirects to `/dashboard`.
3. Dashboard displays student metadata (Name, Roll Number, Department, Semester).
4. Student clicks **"Submit Semester Feedback"** (`/feedback-list`).
5. Student searches faculty directory by name (e.g., "Anirban Das") or routine initials (e.g., "AKD" or "A.K.D.").
6. Clicking a faculty card expands an inline 7-factor evaluation form.
7. Background autosave debounces changes every 700ms and updates server drafts.
8. Student submits feedback; backend records completion in `SubmissionStatus` and anonymous ratings in `FeedbackSubmission`, then deletes the draft.
9. Student clicks **"Nominate Faculty"** (`/nominations`) to nominate an eligible professor for the active Award of Excellence cycle.

#### B. Administrator Workflow
1. Administrator logs in using institutional email (`admin@uem.edu.in`).
2. Redirected to `/admin?tab=overview` displaying live metric counters.
3. In **Students Tab** (`/admin?tab=students`), administrator registers new students, edits enrollment details, or toggles active status.
4. In **Faculty Tab** (`/admin?tab=faculty`), administrator manages faculty records, specifies timetable initials/abbreviations, and clicks any faculty member to inspect aggregated score distributions and anonymous comments.
5. In **Award of Excellence Tab** (`/admin?tab=awards`), administrator opens/closes nomination cycles, selects eligible faculty rosters, reviews citation leaderboards, and shortlists finalists.

### 3.3 Faculty Search Engine Implementation (Name & Initials)
Explain the exact matching pipeline implemented in `server/utils/facultySearch.js` and `client/src/utils/facultySearch.js`:

1. **Punctuation Normalization:** Strips dots, hyphens, and whitespace:
   $$\text{normalizeInitials}("A.K.D.") \rightarrow "AKD"$$
2. **Honorific Stripping:** Removes academic titles before computing initials:
   $$\text{stripHonorifics}("Dr.\ Anirban\ Kumar\ Das") \rightarrow "Anirban\ Kumar\ Das"$$
3. **Initials Derivation:** Takes first characters of remaining words:
   $$\text{generateInitials}("Anirban\ Kumar\ Das") \rightarrow "AKD"$$
4. **Hierarchy of Matching Rules:**
   - Full name substring match (`name.toLowerCase().includes(q)`).
   - Word prefix match (first name starts with "Anir", last name starts with "Das").
   - Verified timetable abbreviation match (`faculty.abbreviation === cleanQ`).
   - Derived initials match (`generateInitials === cleanQ`).
   - Honorifics-inclusive initials match (`"Dr. AKD" -> "DAKD"`).
5. **Multiple Match Handling:** Returns all faculty members matching the query simultaneously.

### 3.4 Cryptographic Voter-Roll Decoupling
Detail the schema separation that enforces privacy:
- **`SubmissionStatus` Collection:**
  ```javascript
  { student: ObjectId, faculty: ObjectId, academicYear: "2024-25", submittedAt: Date }
  ```
  Enforces a compound unique index on `{ student: 1, faculty: 1, academicYear: 1 }`.
- **`FeedbackSubmission` Collection:**
  ```javascript
  { faculty: ObjectId, academicYear: "2024-25", anonymousToken: UUID, ratings: [...], overallComment: "..." }
  ```
  Contains zero references to the student user ID or enrollment number.
- **Privacy Proof:** No database query or foreign-key relationship can join `FeedbackSubmission` back to `User`.

---

### 3.5 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

#### A. Purpose and Scope
The software is an enterprise web application designed to collect anonymous, quality-focused student feedback and manage institutional faculty recognition awards within an academic department or university.

#### B. User Classes
1. **Student:** Authenticated via Enrollment Number. Can view assigned department faculty, execute search queries, save drafts, submit evaluations, and nominate faculty for awards.
2. **Administrator:** Authenticated via Institutional Email. Full authority over student accounts, faculty profiles, analytics inspection, and award cycle governance.

#### C. Functional Requirements Grouped by Module

##### Module 1: Authentication & Session Management
- **FR-01.1:** Unified login endpoint accepting enrollment numbers or emails.
- **FR-01.2:** Bcrypt password hashing (12 salt rounds) with pre-save Mongoose middleware.
- **FR-01.3:** JWT token generation with 7-day validity containing role and user ID claims.
- **FR-01.4:** Password change verification requiring current password confirmation.

##### Module 2: Faculty Directory & Routine Initials Search
- **FR-02.1:** Department-scoped active faculty listing.
- **FR-02.2:** Real-time dynamic search supporting full name, first name, last name, and timetable initials.
- **FR-02.3:** Punctuation-agnostic abbreviation resolution (matching `AKD` and `A.K.D.`).
- **FR-02.4:** Verified abbreviation persistence with automatic fallback to derived initials.

##### Module 3: Feedback Intake & Draft Persistence
- **FR-03.1:** Horizontal 1–5 segmented rating control for 7 institutional evaluation factors.
- **FR-03.2:** Mandatory per-criterion justification requirement (min. 5 characters).
- **FR-03.3:** Mandatory overall constructive summary comment (min. 10 characters).
- **FR-03.4:** Real-time debounced draft autosave preserving in-progress forms in `FeedbackDraft`.
- **FR-03.5:** Voter-roll decoupling recording audit logs in `SubmissionStatus` and ratings in `FeedbackSubmission`.
- **FR-03.6:** One-time evaluation constraint per faculty member per academic year.

##### Module 4: Award of Excellence Governance
- **FR-04.1:** Administrative creation of award cycles with explicit `academicYear` and title.
- **FR-04.2:** Restriction permitting exactly one open nomination cycle at any given time.
- **FR-04.3:** Primary nominee selection with mandatory citation (min. 10 characters) and up to two optional nominees.
- **FR-04.4:** Real-time nomination leaderboard ranking faculty by nomination count.
- **FR-04.5:** Committee finalist shortlisting toggle (`shortlisted` vs. `pending`).

##### Module 5: Administrative Analytics & User Management
- **FR-05.1:** Overview metric dashboard tabulating student counts, faculty counts, and total evaluations.
- **FR-05.2:** Student CRUD with standardized department and semester selection.
- **FR-05.3:** Faculty CRUD with verified timetable abbreviation configuration.
- **FR-05.4:** Detailed faculty feedback analytics modal showing per-criterion arithmetic averages, 1–5 rating distributions, and unlinked student comments.

#### D. Non-Functional Requirements
- **Security:** Salted password hashing, JWT HTTP Authorization headers, SQL/NoSQL injection mitigation via Mongoose typing.
- **Privacy:** Anonymity by design through schema isolation.
- **Usability:** Corporate institutional design system, zero decorative distractions, high-contrast typography, responsive mobile drawer.
- **Reliability:** Graceful degradation via `isDBConnected()` returning HTTP 503 instead of crashing on network timeout.
- **Maintainability:** Modular architecture separating routes, controllers, middleware, models, and client utilities.

#### E. Hardware Requirements
- **Development & Server Environment:**
  - Processor: 64-bit Dual Core Intel i3 / AMD Ryzen 3 or higher.
  - RAM: 4 GB minimum (8 GB recommended for concurrent Vite development and Node execution).
  - Storage: 500 MB free disk space for node dependencies and build artifacts.
- **Client Device Environment:**
  - Any standard desktop, laptop, tablet, or smartphone capable of running a modern web browser (Chrome >= 90, Firefox >= 88, Edge >= 90, Safari >= 14).

#### F. Software Requirements
- **Operating System:** Cross-platform (Windows 10/11, macOS, Ubuntu Linux).
- **Node.js:** Version >= 18.0.0.
- **Database:** MongoDB Atlas (Cloud Cluster, M0 tier or higher).
- **Frontend Build Tools:** Vite 5.3.4, React 18.3.1.
- **Backend Libraries:** Express 4.19.2, Mongoose 8.5.1, bcryptjs 2.4.3, jsonwebtoken 9.0.2, express-validator 7.1.0, cors 2.8.5, dotenv 16.4.5.

#### G. Constraints and Assumptions
- Active internet connectivity is required to reach MongoDB Atlas.
- Students must belong to a recognized institutional department.
- A single nomination cycle can be active in any given evaluation window.

---

# CHAPTER 4 — EXPERIMENTAL SETUP AND RESULT ANALYSIS

### 4.1 Frontend Implementation Details
- **Component Hierarchy:**
  - `App.jsx` establishes client routing and role guards (`PrivateRoute`).
  - `Navbar.jsx` manages the responsive corporate sidebar and top header bar.
  - `FeedbackList.jsx` integrates the directory search engine and inline expandable form engine.
  - `AdminDashboard.jsx` orchestrates tabs for Overview, Students, Faculty, and Awards.
- **Design System Implementation:**
  - Built with pure CSS custom properties in `index.css`.
  - Palette: Institutional Oxford Navy (`#1b365d`), slate canvas (`#f8fafc`), pure white cards (`#ffffff`), and charcoal text (`#0f172a`).
  - Eliminates pastel gradients, floating card hovers, and cartoon emojis in favor of Lucide vector icons.

### 4.2 Backend Implementation Details
- **Middleware Pipeline:**
  1. `cors()` handles cross-origin resource sharing.
  2. `express.json()` parses inbound JSON request bodies.
  3. `protect` middleware decodes JWT Bearer tokens and attaches `req.user`.
  4. `adminOnly` middleware enforces administrative authorization.
  5. `errorHandler` middleware catches uncaught exceptions and sends uniform error envelopes.
- **Database Indexing:**
  - `User`: `{ email: 1 }` (unique), `{ rollNumber: 1 }` (unique, sparse).
  - `Faculty`: `{ employeeId: 1 }` (unique), `{ department: 1 }`.
  - `SubmissionStatus`: `{ student: 1, faculty: 1, academicYear: 1 }` (compound unique).
  - `FeedbackDraft`: `{ student: 1, faculty: 1, academicYear: 1 }` (compound unique).

### 4.3 Connection and Setup Guide
- **Vite Proxy Configuration (`client/vite.config.js`):**
  Enables seamless frontend routing to `http://localhost:5000` during local development without CORS friction.
- **Environment Configuration:**
  - `server/.env`:
    ```ini
    PORT=5000
    MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
    JWT_SECRET=<secure_random_hex_key>
    JWT_EXPIRES_IN=7d
    ```
- **Application Startup Procedure:**
  1. Start server: `cd server && npm install && npm start`
  2. Start client: `cd client && npm install && npm run dev`
  3. Production build test: `cd client && npm run build`

---

### 4.4 Result Analysis & Test Case Matrix
Document actual test execution using the structured matrix below. Pass/Fail statuses and notes should be recorded by the team after physical test runs:

| Test Case ID | Test Module | Scenario Description | Test Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-AUTH-01** | Authentication | Student login with valid enrollment number | User: `CS22001`, Pass: `correct_pwd` | 200 OK, JWT issued, redirect to `/dashboard` | *Fill upon test* | *Pending* |
| **TC-AUTH-02** | Authentication | Admin login with institutional email | User: `admin@uem.edu.in`, Pass: `correct_pwd` | 200 OK, JWT issued, redirect to `/admin` | *Fill upon test* | *Pending* |
| **TC-AUTH-03** | Authentication | Login attempt with invalid credentials | User: `CS22001`, Pass: `wrong_pwd` | 401 Unauthorized with error message | *Fill upon test* | *Pending* |
| **TC-SRCH-01** | Faculty Search | Search by full faculty name | Query: `Anirban Kumar Das` | Exact faculty card rendered | *Fill upon test* | *Pending* |
| **TC-SRCH-02** | Faculty Search | Search by first name or last name | Query: `Anirban` or `Das` | Matching faculty cards returned | *Fill upon test* | *Pending* |
| **TC-SRCH-03** | Faculty Search | Search by routine initials (uppercase) | Query: `AKD` | All faculty with initials `AKD` displayed | *Fill upon test* | *Pending* |
| **TC-SRCH-04** | Faculty Search | Search by routine initials with dots | Query: `A.K.D.` or `a.k.d.` | Punctuation stripped, matches `AKD` | *Fill upon test* | *Pending* |
| **TC-SRCH-05** | Faculty Search | Multiple faculty sharing same initials | Query: `AKD` | Returns both `Anirban Kumar Das` & `Abhishek Kumar Dey` | *Fill upon test* | *Pending* |
| **TC-SRCH-06** | Faculty Search | Search with zero matching records | Query: `XYZ999` | Helpful empty state with clear button | *Fill upon test* | *Pending* |
| **TC-FEED-01** | Evaluation | Inline expansion of evaluation form | Click on faculty directory card | Form expands with 7 factors & autosave | *Fill upon test* | *Pending* |
| **TC-FEED-02** | Evaluation | Autosave draft debouncing | Input text into justification box | Status shows "Saving draft...", then "Draft saved" | *Fill upon test* | *Pending* |
| **TC-FEED-03** | Evaluation | Validation on short justification | Score: 4, Reason: `Good` (< 5 chars) | Submission blocked with validation error | *Fill upon test* | *Pending* |
| **TC-FEED-04** | Evaluation | Final submission execution | All criteria >= 5 chars, overall >= 10 chars | Submission accepted, card shows "✓ Completed" | *Fill upon test* | *Pending* |
| **TC-FEED-05** | Evaluation | Duplicate submission prevention | Attempt to re-evaluate completed faculty | Form blocked, status marked as completed | *Fill upon test* | *Pending* |
| **TC-AWARD-01**| Nominations | Primary nomination submission | Select faculty + 12-character citation | 201 Created, nomination committed | *Fill upon test* | *Pending* |
| **TC-AWARD-02**| Nominations | Duplicate nomination prevention | Attempt second nomination in same cycle | Message: "Already submitted for this cycle" | *Fill upon test* | *Pending* |
| **TC-ADMIN-01**| Administration | Student account creation | Fill name, enrollment, dept, sem | Student appears in registry with initial credentials | *Fill upon test* | *Pending* |
| **TC-ADMIN-02**| Administration | Faculty creation with custom abbreviation| Name: `Debashis De`, Abbr: `DDE` | Stored with verified timetable initials `DDE` | *Fill upon test* | *Pending* |
| **TC-ADMIN-03**| Administration | Inspection of anonymous faculty stats | Click faculty name in admin directory | Modal displays score averages and comments | *Fill upon test* | *Pending* |

---

# CHAPTER 5 — CONCLUSION AND FUTURE SCOPE

### 5.1 Project Summary & Outcomes
- Summarize the delivery of a production-grade Faculty Evaluation and Recognition Portal.
- Reiterate how the cryptographic separation between `SubmissionStatus` and `FeedbackSubmission` guarantees voter anonymity while completely eliminating duplicate submissions.
- Highlight the usability impact of the timetable initials directory search, allowing students to navigate using routine abbreviations (`AKD`, `A.K.D.`).
- Emphasize how the corporate office redesign establishes visual authority appropriate for university governance.

### 5.2 Current System Limitations
- Feedback analytics are aggregated on-demand rather than pre-calculated into cached analytical rollups.
- Requires manual entry or bulk database seeding of student enrollment rosters.
- Notifications are in-app; automated email alerts are not integrated into this phase.

### 5.3 Future Scope & Potential Enhancements
Clearly distinguish proposed future work from existing functionality:
1. **Automated Enterprise Timetable Sync:** Direct read-only database connectors to university ERPs (SAP, PeopleSoft) to pull routine updates dynamically.
2. **Natural Language Sentiment Analysis:** Applying NLP models to cluster anonymous student comments into thematic tags (e.g., "Pacing", "Practical Examples", "Exam Guidance").
3. **Multi-Factor Authentication (MFA):** Integrating TOTP or institutional Google Workspace SSO via OAuth 2.0.
4. **Automated PDF Accreditation Reports:** One-click generation of NAAC/NBA formatted PDF dossiers summarizing department-wide faculty performance.

---

# CHAPTER 6 — BIBLIOGRAPHY

Format references consistently using standard IEEE style. Include verified official documentation for tools actually used:

1. **React Documentation:**  
   Facebook Open Source, "React – A JavaScript library for building user interfaces," React Documentation, 2024. [Online]. Available: `https://react.dev/`  
   *Usage in project: Component tree architecture, hooks (`useState`, `useEffect`, `useCallback`, `useMemo`), and declarative UI rendering.*

2. **Node.js Technical Documentation:**  
   OpenJS Foundation, "Node.js v18 LTS Documentation," Node.js API Reference, 2024. [Online]. Available: `https://nodejs.org/en/docs/`  
   *Usage in project: Server-side JavaScript runtime environment executing Express REST services.*

3. **Express.js Framework:**  
   OpenJS Foundation, "Express – Fast, unopinionated, minimalist web framework for Node.js," Express Reference Manual, 2024. [Online]. Available: `https://expressjs.com/`  
   *Usage in project: Routing, middleware pipeline (`cors`, `express.json`), and REST controller handlers.*

4. **MongoDB & Mongoose:**  
   MongoDB Inc., "MongoDB Atlas Cloud Database Manual," 2024. [Online]. Available: `https://www.mongodb.com/docs/`; Automattic, "Mongoose ODM v8.5 Documentation," 2024. [Online]. Available: `https://mongoosejs.com/docs/`  
   *Usage in project: Document schema modeling, compound unique indexing, and transactional operations.*

5. **JSON Web Token Standards:**  
   M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," RFC 7519, Internet Engineering Task Force (IETF), May 2015. [Online]. Available: `https://datatracker.ietf.org/doc/html/rfc7519`  
   *Usage in project: Stateless bearer authentication for protected student and administrative routes.*

6. **Bcrypt Password Security:**  
   N. Provos and D. Mazières, "A Future-Adaptable Password Scheme," in *Proc. of the FREENIX Track: 1999 USENIX Annual Technical Conference*, Monterey, CA, 1999.  
   *Usage in project: Cryptographic salt hashing of account passwords with 12 computational rounds.*

7. **Vite Frontend Tooling:**  
   E. You and Vite Contributors, "Vite: Next Generation Frontend Tooling," 2024. [Online]. Available: `https://vitejs.dev/`  
   *Usage in project: Hot module replacement (HMR), development proxy, and optimized roll-up production bundling.*

8. **Lucide Icons Library:**  
   Lucide Contributors, "Lucide: Beautiful & consistent icon toolkit," 2024. [Online]. Available: `https://lucide.dev/`  
   *Usage in project: Corporate UI icons across sidebar, navigation headers, search inputs, and modal dialogs.*

---

# SCREENSHOT COLLECTION CHECKLIST

All screenshots must be captured from the actual live application running locally. Use the standardized checklist below to organize figures across the report chapters:

| Screenshot ID | Page / Screen Feature | What to Capture in Viewport | Suggested Figure Caption | Chapter Placement | Priority |
|---|---|---|---|---|---|
| **SS-01** | Institutional Login | Full `/login` view showing UEM & IEM branding, enrollment/email input, password toggle, and portal badge. | *Figure 4.1: Unified Institutional Login Portal* | Section 4.1 | Mandatory |
| **SS-02** | Student Dashboard | Full `/dashboard` view with student profile banner (Name, Roll No., Department, Semester) and two action cards. | *Figure 4.2: Student Academic Portal Overview* | Section 4.1 | Mandatory |
| **SS-03** | Faculty Directory Default | `/feedback-list` view showing department title, evaluation progress counter, and directory search bar with cards. | *Figure 4.3: Department Faculty Evaluation Directory* | Section 4.1 | Mandatory |
| **SS-04** | Faculty Search by Full Name | Directory search bar with query `"Anirban Kumar Das"` filtering results to the target professor card. | *Figure 4.4: Dynamic Faculty Search by Full Name* | Section 4.1 | Mandatory |
| **SS-05** | Faculty Search by Initials | Directory search bar with query `"AKD"` showing matching faculty members with verified initials badges. | *Figure 4.5: Timetable Routine Initials Resolution (AKD)* | Section 4.1 | Mandatory |
| **SS-06** | Search with Punctuation Dots | Directory search bar with query `"A.K.D."` demonstrating dot-agnostic normalization. | *Figure 4.6: Dot-Agnostic Abbreviation Search (A.K.D.)* | Section 4.1 | Mandatory |
| **SS-07** | Search Multiple Initials Match | Directory search showing two professors sharing the same initials (e.g., `AKD` matching both candidates). | *Figure 4.7: Multi-Candidate Initial Collision Resolution* | Section 4.1 | Mandatory |
| **SS-08** | Search Empty State | Search bar with non-matching query showing helpful empty state and "Clear Search Filter" button. | *Figure 4.8: Search Directory Empty State Feedback* | Section 4.1 | Mandatory |
| **SS-09** | Inline Evaluation Form | Expanded faculty card showing horizontal 1–5 segmented scores, justification inputs, and autosave status indicator. | *Figure 4.9: Inline Seven-Factor Evaluation Form with Real-Time Autosave* | Section 4.1 | Mandatory |
| **SS-10** | Award Nomination Form | Full `/nominations` view showing active cycle title, primary nominee dropdown with initials, and citation textarea. | *Figure 4.10: Award of Excellence Nomination Workflow* | Section 4.1 | Mandatory |
| **SS-11** | Admin Portal: Overview | Full `/admin?tab=overview` view showing institutional stat cards (Students, Faculty, Submissions, Cycles). | *Figure 4.11: Administrative Executive Overview Dashboard* | Section 4.1 | Mandatory |
| **SS-12** | Admin: Student Registry | `/admin?tab=students` view displaying student table with enrollment numbers, departments, semesters, and status pills. | *Figure 4.12: Standardized Student Account Registry* | Section 4.1 | Mandatory |
| **SS-13** | Admin: Faculty Directory | `/admin?tab=faculty` view displaying faculty table with Timetable Initials column and directory search bar. | *Figure 4.13: Faculty Management Registry with Timetable Initials* | Section 4.1 | Mandatory |
| **SS-14** | Admin: Faculty Analytics Modal | Open modal showing average scores per factor, 1–5 distribution bars, and anonymous student comments. | *Figure 4.14: Aggregated Faculty Feedback Analytics & Distribution Modal* | Section 4.1 | Mandatory |
| **SS-15** | Admin: Award Leaderboard | `/admin?tab=awards&sub=leaderboard` showing faculty ranked by nomination count with citations and shortlist toggles. | *Figure 4.15: Award of Excellence Committee Leaderboard* | Section 4.1 | Mandatory |
| **SS-16** | Account Security | Full `/change-password` view showing credential verification inputs and security notice. | *Figure 4.16: User Password Security Interface* | Section 4.1 | Optional |

---

### Screenshot Quality & Hygiene Guidelines
1. **Resolution & Consistency:** Set browser viewport width to exactly **1280px or 1440px** with 100% zoom level before capturing.
2. **Hide Sensitive Data:** Ensure browser bookmarks bar, personal browser tabs, personal desktop taskbars, and development devtools are cropped out.
3. **No Credential Exposure:** Never capture real API keys, `.env` file credentials, or MongoDB connection strings in terminal screenshots.
4. **Clean Test Data:** Use clean academic sample data (e.g., `CS22001`, `Anirban Kumar Das`, `Dr. Debashis De`) rather than placeholder gibberish (`asdf`, `test123`).

---

# WHAT TO WRITE AND WHAT NOT TO WRITE

To ensure the report meets the highest university engineering standards, adhere strictly to the dos and don'ts below:

### What TO Write:
- **Write Specific Technical Facts:** Explain how the React `useMemo` hook filters faculty records in memory while typing, while the Express controller supports optional `?q=` queries.
- **Explain Design Rationale:** Detail why segmented horizontal radio buttons (1–5) were chosen over star ratings to promote objective academic evaluation rather than consumer-product rating habits.
- **Acknowledge Architectural Nuances:** Clearly explain that voter roll tracking (`SubmissionStatus`) is decoupled from ballot storage (`FeedbackSubmission`) by omitting foreign keys, rather than claiming "unbreakable quantum encryption".
- **Use Formal Engineering Tone:** Write in passive or third-person objective voice (*"The system was configured with..."*, *"Authentication is verified via..."*).

### What NOT to Write:
- **DO NOT Claim Untrue or Unimplemented Technologies:**  
  - Do NOT write that the system uses "Artificial Intelligence", "Machine Learning", "Neural Networks", or "Blockchain" if those libraries are not in `package.json`.
  - Do NOT claim "guaranteed mathematical anonymity across network interception" if communication relies on standard TLS.
- **DO NOT Copy Generic Textbook Chapters:**  
  - Do NOT spend 10 pages explaining what JavaScript or HTML is. Focus on how React and Express are configured in *this* project.
- **DO NOT Dump Full Source Code Files:**  
  - Never paste hundreds of lines of raw code into the report body. Use short, focused 5–15 line snippets illustrating key algorithms (e.g., the `matchesFacultySearch` function).
- **DO NOT Fabricate Testing Results:**  
  - Do not state that 10,000 concurrent students were stress-tested if load testing was not physically conducted. Leave test case results to be validated during testing.
- **DO NOT Include Security Secrets:**  
  - Never expose MongoDB Atlas connection passwords, JWT secrets, or local file paths containing personal usernames in figures or code blocks.
