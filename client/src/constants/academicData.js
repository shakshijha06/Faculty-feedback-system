/**
 * constants/academicData.js
 *
 * Canonical departments, semester ranges, and institutional evaluation factors
 * for the University of Engineering & Management (UEM) and Institute of Engineering & Management (IEM).
 */

export const DEPARTMENTS = [
  { value: 'Computer Science and Engineering', label: 'Computer Science and Engineering (CSE)', code: 'CSE' },
  { value: 'Information Technology', label: 'Information Technology (IT)', code: 'IT' },
  { value: 'Electronics and Communication Engineering', label: 'Electronics and Communication Engineering (ECE)', code: 'ECE' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering (EE)', code: 'EE' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering (ME)', code: 'ME' },
  { value: 'Civil Engineering', label: 'Civil Engineering (CE)', code: 'CE' },
  { value: 'Internet of Things', label: 'Internet of Things (IOT)', code: 'IOT' },
  { value: 'Basic Science and Humanities', label: 'Basic Science and Humanities (BSH)', code: 'BSH' },
  { value: 'Management Studies', label: 'Management Studies (BBA/MBA)', code: 'MS' },
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8].map(s => ({
  value: s,
  label: `Semester ${s}`,
}));

/**
 * Normalizes user-entered or legacy department strings into canonical forms
 * for resilient filtering and cross-model matching.
 */
export const normalizeDepartment = (dept) => {
  if (!dept) return '';
  const d = dept.trim().toLowerCase();
  if (d.includes('computer') || d === 'cse') return 'Computer Science and Engineering';
  if (d.includes('information') || d === 'it') return 'Information Technology';
  if (d.includes('electronics') || d === 'ece') return 'Electronics and Communication Engineering';
  if (d.includes('electrical') || d === 'ee') return 'Electrical Engineering';
  if (d.includes('mechanical') || d === 'me') return 'Mechanical Engineering';
  if (d.includes('civil') || d === 'ce') return 'Civil Engineering';
  if (d.includes('things') || d === 'iot') return 'Internet of Things';
  if (d.includes('basic') || d.includes('humanities') || d === 'bsh') return 'Basic Science and Humanities';
  if (d.includes('management') || d === 'mba' || d === 'bba') return 'Management Studies';
  return dept.trim();
};

/**
 * The 7 official institutional feedback factors with descriptions.
 */
export const FEEDBACK_FACTORS = [
  {
    key: 'teaching_clarity',
    label: 'Teaching Clarity & Concept Explanation',
    desc: 'How clearly does the faculty break down and explain complex topics?',
  },
  {
    key: 'subject_expertise',
    label: 'Subject Expertise & Knowledge Depth',
    desc: 'How thoroughly does the faculty demonstrate subject mastery and technical command?',
  },
  {
    key: 'class_preparation',
    label: 'Lecture Preparation & Course Materials',
    desc: 'How well-structured and prepared are lectures, slide decks, and study resources?',
  },
  {
    key: 'approachability',
    label: 'Approachability & Doubt Resolution',
    desc: 'How accessible, respectful, and helpful is the faculty during and outside class?',
  },
  {
    key: 'punctuality_regularity',
    label: 'Punctuality & Syllabus Coverage',
    desc: 'Does the faculty conduct lectures on schedule and cover the syllabus methodically?',
  },
  {
    key: 'fairness_grading',
    label: 'Evaluation Fairness & Assessment Guidance',
    desc: 'Is the faculty objective, fair, and constructive in assignments and grading feedback?',
  },
  {
    key: 'overall',
    label: 'Overall Teaching Effectiveness',
    desc: 'Overall rating of learning value, classroom mentorship, and teaching quality.',
  },
];
