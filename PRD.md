# Product Requirements Document (PRD)

## Project: University Faculty Feedback & Award of Excellence System
**Target Institutions:** University of Engineering & Management (UEM), Kolkata & Institute of Engineering & Management (IEM), Kolkata  
**Version:** 2.0.0  
**Stack:** MERN (MongoDB Atlas, Express.js, React + Vite, Node.js)

---

## 1. Problem Statement & Objectives

### 1.1 The Problem
Traditional college evaluation methods face critical hurdles:
- **Fear of Reprisal:** Students fear negative feedback will impact academic standing if responses can be linked to roll numbers.
- **Low Constructive Depth:** Generic 1–5 number ratings yield insufficient actionable context without qualitative reasoning.
- **Workflow Friction:** Complex mapping dependencies prevent students from evaluating faculty directly.
- **Unstructured Recognition:** Excellence recognition lacks structured nomination windows, transparent criteria, and administrative auditing.

### 1.2 System Objectives
1. Provide an official institutional portal for UEM/IEM Kolkata with student and administrative authentication.
2. Ensure **100% cryptographic anonymity** for student feedback submissions.
3. Mandate concrete qualitative justifications for each numerical rating to ensure actionable feedback.
4. Provide draft save and resume capabilities so evaluations are thorough and uninterrupted.
5. Introduce a structured **Award of Excellence** cycle system enabling students to nominate outstanding educators and administrators to review citations and shortlist finalists.
6. Deliver real-time administrative analytics on faculty performance and institutional participation.

---

## 2. User Personas & Workflows

### 2.1 Student Persona
- **Identifier:** Enrollment Number / Roll Number (e.g., `1202200201001`).
- **Primary Actions:**
  - Log in securely via the institutional portal.
  - View department faculty members available for semester evaluation.
  - Complete multi-step faculty evaluation with 1–5 star ratings and mandatory justifications (minimum 5 characters per criterion).
  - Save progress as a draft and resume later.
  - Review all answers before final anonymous submission.
  - Submit one primary nomination (and up to two additional nominees) for the open Award of Excellence cycle.
  - Update account password with current credential verification.

### 2.2 Administrator Persona
- **Identifier:** Institutional Email (e.g., `admin@uem.edu.in`).
- **Primary Actions:**
  - Access system-wide metrics (student count, faculty count, submission count, pending nominations).
  - Register new student accounts and generate one-time credentials.
  - Manage faculty profiles (name, employee ID, department, designation, active status).
  - Inspect aggregated faculty evaluation scores and anonymous student comments.
  - Create, open, and close Award of Excellence nomination cycles, selecting eligible faculty.
  - Review nomination leaderboard rankings and toggle shortlist status for committee review.

---

## 3. Detailed Functional Requirements

### FR-01: Authentication & Institutional Access Control
- **1.1 Single Entrypoint:** A single institutional login screen with UEM and IEM logos, username field (accepting roll number or email), and password.
- **1.2 Server-Side Role Enforcement:** Server parses credentials, verifies status, signs a JWT token, and passes role data. No client-side bypasses or demo buttons exist.
- **1.3 Private Route Protection:** Protected routes verify token validity against `/api/auth/me` on mount to terminate stale or invalid sessions immediately.
- **1.4 Password Management:** Both student and admin users can update passwords through `/change-password`, requiring verification of the existing password and a minimum 6-character new password.

### FR-02: Faculty Feedback & Evaluation Engine
- **2.1 Department-Scoped Faculty Access:** Students automatically view faculty belonging to their academic department.
- **2.2 Status Indicators:** Each faculty card displays whether evaluation is pending, in draft, or completed for the academic term.
- **2.3 Multi-Step Evaluation Flow:**
  - Step 1: Core Performance Criteria (Teaching Clarity, Subject Expertise, Approachability, Class Preparation, Overall Rating). Each star rating (1–5) requires a mandatory textual reason (min 5 characters).
  - Step 2: Qualitative Comments (Optional Strengths and Opportunities for Improvement).
  - Step 3: Comprehensive Review Step prior to un-reversible submission.
- **2.4 Draft Preservation:** Students can click "Save Draft" at any time. When returning to the faculty member's form, previous ratings and notes are automatically restored.
- **2.5 One-Time Submission Constraint:** Once submitted, a student cannot resubmit feedback for that faculty member within the same academic year.

### FR-03: Anonymity & Voter Roll Decoupling
- **3.1 Identity Segregation:** Feedback records (`FeedbackSubmission`) store zero references to student identity, user IDs, or enrollment numbers.
- **3.2 Anti-Duplicate Verification:** Student identity is recorded exclusively in `SubmissionStatus` to track participation status without recording specific ratings.

### FR-04: Award of Excellence Nomination System
- **4.1 Cycle Governance:** Admin controls when nomination cycles open and close. Exactly one cycle can be open at a time.
- **4.2 Eligibility Boundary:** Admin selects eligible faculty per cycle. Students can only select from this approved roster.
- **4.3 Submission Rules:**
  - One primary nominee required with a mandatory citation (min 10 characters).
  - Up to two optional additional nominees, each requiring a valid justification.
  - Strict enforcement of one nomination submission per student per academic year.
- **4.4 Administrative Review:** Admin reviews faculty ranked by primary nomination count and individual anonymous citations, with the ability to toggle finalist status (`shortlisted` / `pending`).

### FR-05: Administrative Analytics & User Management
- **5.1 Overview Metrics:** Real-time counters for registered students, faculty members, feedback submissions, and pending nominations.
- **5.2 Student Administration:** Add, edit, deactivate, and reactivate student accounts. Initial password displayed once upon creation.
- **5.3 Faculty Performance Analytics:** Breakdown of average ratings across all criteria and consolidated view of constructive comments.

---

## 4. Non-Functional Requirements (NFRs)

- **Security:** Passwords salted with bcrypt (12 rounds). Bearer JWT tokens in Authorization headers.
- **Resilience:** Graceful handling when MongoDB Atlas is unreachable (HTTP 503 with friendly messaging).
- **Usability:** Responsive layout built with clean institutional typography, high contrast, and accessible form controls.
- **Auditability:** Timestamped audit records for account creations, status changes, and cycle transitions.
