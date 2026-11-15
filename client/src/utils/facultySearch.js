/**
 * utils/facultySearch.js — Faculty Name & Initials Search Utility
 *
 * Implements robust matching for:
 * 1. Full faculty name (e.g., "Anirban Kumar Das")
 * 2. First name (e.g., "Anirban")
 * 3. Last name (e.g., "Das")
 * 4. Faculty initials & abbreviations (e.g., "AKD", "A.K.D.", "A.K.D", "akd", "a.k.d.")
 * 5. Partial name matches (e.g., "Anir", "Kumar", "Da")
 * 6. Case-insensitive and punctuation-agnostic search
 */

/**
 * Strips academic honorifics and titles to isolate the personal name.
 */
export const stripHonorifics = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/^(Dr\.|Dr|Prof\.|Prof|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs|Er\.|Er|Shri)\s+/i, '')
    .trim();
};

/**
 * Generates timetable initials from a faculty name.
 * e.g., "Anirban Kumar Das" -> "AKD"
 *       "Dr. Soumen Mukherjee" -> "SM"
 *       "Debashis De" -> "DD"
 */
export const generateInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const cleaned = stripHonorifics(name);
  const words = cleaned.split(/[\s\-]+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.map(w => w[0].toUpperCase()).join('');
};

/**
 * Resolves the display initials for a faculty record:
 * Returns the verified abbreviation if present, otherwise computes generated initials.
 */
export const getEffectiveInitials = (faculty) => {
  if (!faculty) return '';
  if (faculty.abbreviation && typeof faculty.abbreviation === 'string' && faculty.abbreviation.trim()) {
    return faculty.abbreviation.trim().toUpperCase();
  }
  return generateInitials(faculty.name);
};

/**
 * Normalizes an initials string by stripping dots, spaces, dashes, and hyphens.
 * e.g., "A.K.D." -> "AKD", "a. k. d." -> "AKD"
 */
export const normalizeInitials = (str) => {
  if (!str) return '';
  return str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};

/**
 * Checks whether a faculty record matches a user's search query.
 *
 * @param {Object} faculty - Faculty object { name, abbreviation, department, designation, employeeId }
 * @param {string} query - Raw search input string from student
 * @returns {boolean} True if faculty matches the query
 */
export const matchesFacultySearch = (faculty, query) => {
  if (!faculty) return false;
  if (!query || !query.trim()) return true;

  const rawQ = query.trim();
  const lowerQ = rawQ.toLowerCase();
  const cleanQ = normalizeInitials(rawQ); // e.g. "a.k.d." -> "AKD"

  // 1. Match full name (case-insensitive substring)
  const fullName = (faculty.name || '').toLowerCase();
  if (fullName.includes(lowerQ)) return true;

  // 2. Match individual name components (first name, middle name, last name)
  const cleanedName = stripHonorifics(faculty.name || '').toLowerCase();
  const nameParts = cleanedName.split(/[\s\-]+/).filter(Boolean);
  for (const part of nameParts) {
    if (part === lowerQ || part.startsWith(lowerQ) || part.includes(lowerQ)) {
      return true;
    }
  }

  // 3. Match against stored verified abbreviation
  if (faculty.abbreviation && typeof faculty.abbreviation === 'string') {
    const rawAbbr = faculty.abbreviation.trim();
    const lowerAbbr = rawAbbr.toLowerCase();
    const cleanAbbr = normalizeInitials(rawAbbr);

    if (lowerAbbr === lowerQ || lowerAbbr.includes(lowerQ)) return true;
    if (cleanAbbr === cleanQ || (cleanQ.length > 0 && cleanAbbr.startsWith(cleanQ))) return true;
  }

  // 4. Match against generated timetable initials (without honorifics)
  const genInitials = generateInitials(faculty.name); // e.g. "AKD"
  if (genInitials) {
    const cleanGen = normalizeInitials(genInitials);
    if (cleanGen === cleanQ || (cleanQ.length > 0 && cleanGen.startsWith(cleanQ))) return true;
  }

  // 5. Match against initials with honorifics included (e.g., "Dr. Anirban Kumar Das" -> "DAKD")
  const wordsWithHonorifics = (faculty.name || '').split(/[\s\-]+/).filter(Boolean);
  const honorificsInitials = wordsWithHonorifics.map(w => w[0].toUpperCase()).join('');
  const cleanHon = normalizeInitials(honorificsInitials);
  if (cleanHon === cleanQ || (cleanQ.length > 0 && cleanHon.startsWith(cleanQ))) return true;

  // 6. Match against Employee ID
  if (faculty.employeeId && faculty.employeeId.toLowerCase().includes(lowerQ)) {
    return true;
  }

  // 7. Match against Designation or Department
  if (faculty.designation && faculty.designation.toLowerCase().includes(lowerQ)) {
    return true;
  }

  return false;
};
