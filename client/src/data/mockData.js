/**
 * data/mockData.js
 *
 * ⚠️  MOCK DATA — for UI development only.
 * All values here are fictional. No real student or faculty data.
 * These are replaced by real API calls in Phase 5.
 */

export const MOCK_STUDENT = {
  name: 'Priya Sharma',
  email: 'priya.s@college.edu',
  rollNumber: 'CS22001',
  semester: 5,
  department: 'Computer Science',
  division: 'A',
  role: 'student',
};

export const MOCK_ASSIGNMENTS = [
  {
    _id: 'assign_1',
    faculty: { _id: 'f1', name: 'Dr. Ravi Kumar', designation: 'Professor', department: 'Computer Science' },
    course:  { _id: 'c1', courseCode: 'CS501', title: 'Data Structures & Algorithms', semester: 5, credits: 4 },
    feedbackWindowOpen: true,
    submitted: false,
  },
  {
    _id: 'assign_2',
    faculty: { _id: 'f2', name: 'Prof. Anjali Desai', designation: 'Assistant Professor', department: 'Computer Science' },
    course:  { _id: 'c2', courseCode: 'CS502', title: 'Database Management Systems', semester: 5, credits: 4 },
    feedbackWindowOpen: true,
    submitted: true,
  },
  {
    _id: 'assign_3',
    faculty: { _id: 'f3', name: 'Dr. Suresh Mehta', designation: 'Associate Professor', department: 'Computer Science' },
    course:  { _id: 'c3', courseCode: 'CS503', title: 'Operating Systems', semester: 5, credits: 3 },
    feedbackWindowOpen: false,
    submitted: false,
  },
];

export const FEEDBACK_QUESTIONS = [
  { key: 'teaching_clarity',   label: 'How clearly does the faculty explain concepts?' },
  { key: 'subject_knowledge',  label: 'How well does the faculty demonstrate subject expertise?' },
  { key: 'student_interaction',label: 'How approachable and interactive is the faculty?' },
  { key: 'preparation',        label: 'How well prepared is the faculty for each class?' },
  { key: 'overall_rating',     label: 'Overall rating of this faculty member' },
];

export const MOCK_FACULTY = [
  { _id: 'f1', name: 'Dr. Ravi Kumar',    department: 'Computer Science', designation: 'Professor',           employeeId: 'EMP001' },
  { _id: 'f2', name: 'Prof. Anjali Desai',department: 'Computer Science', designation: 'Assistant Professor',  employeeId: 'EMP002' },
  { _id: 'f3', name: 'Dr. Suresh Mehta', department: 'Computer Science', designation: 'Associate Professor',  employeeId: 'EMP003' },
];

export const MOCK_ADMIN_STATS = {
  studentCount:       120,
  facultyCount:        14,
  assignmentCount:     32,
  submissionCount:    240,
  pendingNominations:   5,
};

export const MOCK_NOMINATIONS = [
  { _id: 'n1', faculty: MOCK_FACULTY[0], reason: 'Exceptional teaching clarity and always available after class.', status: 'pending', createdAt: '2024-10-10' },
  { _id: 'n2', faculty: MOCK_FACULTY[1], reason: 'Makes databases interesting and explains complex joins very well.', status: 'shortlisted', createdAt: '2024-10-09' },
];
