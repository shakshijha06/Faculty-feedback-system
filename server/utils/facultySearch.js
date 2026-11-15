/**
 * utils/facultySearch.js — Backend Faculty Search & Initials Utility
 */

const stripHonorifics = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/^(Dr\.|Dr|Prof\.|Prof|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs|Er\.|Er|Shri)\s+/i, '')
    .trim();
};

const generateInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const cleaned = stripHonorifics(name);
  const words = cleaned.split(/[\s\-]+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.map(w => w[0].toUpperCase()).join('');
};

const normalizeInitials = (str) => {
  if (!str) return '';
  return str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};

const getEffectiveInitials = (faculty) => {
  if (!faculty) return '';
  if (faculty.abbreviation && typeof faculty.abbreviation === 'string' && faculty.abbreviation.trim()) {
    return faculty.abbreviation.trim().toUpperCase();
  }
  return generateInitials(faculty.name);
};

const matchesFacultySearch = (faculty, query) => {
  if (!faculty) return false;
  if (!query || !query.trim()) return true;

  const rawQ = query.trim();
  const lowerQ = rawQ.toLowerCase();
  const cleanQ = normalizeInitials(rawQ);

  const fullName = (faculty.name || '').toLowerCase();
  if (fullName.includes(lowerQ)) return true;

  const cleanedName = stripHonorifics(faculty.name || '').toLowerCase();
  const nameParts = cleanedName.split(/[\s\-]+/).filter(Boolean);
  for (const part of nameParts) {
    if (part === lowerQ || part.startsWith(lowerQ) || part.includes(lowerQ)) {
      return true;
    }
  }

  if (faculty.abbreviation && typeof faculty.abbreviation === 'string') {
    const rawAbbr = faculty.abbreviation.trim();
    const lowerAbbr = rawAbbr.toLowerCase();
    const cleanAbbr = normalizeInitials(rawAbbr);

    if (lowerAbbr === lowerQ || lowerAbbr.includes(lowerQ)) return true;
    if (cleanAbbr === cleanQ || (cleanQ.length > 0 && cleanAbbr.startsWith(cleanQ))) return true;
  }

  const genInitials = generateInitials(faculty.name);
  if (genInitials) {
    const cleanGen = normalizeInitials(genInitials);
    if (cleanGen === cleanQ || (cleanQ.length > 0 && cleanGen.startsWith(cleanQ))) return true;
  }

  const wordsWithHonorifics = (faculty.name || '').split(/[\s\-]+/).filter(Boolean);
  const honorificsInitials = wordsWithHonorifics.map(w => w[0].toUpperCase()).join('');
  const cleanHon = normalizeInitials(honorificsInitials);
  if (cleanHon === cleanQ || (cleanQ.length > 0 && cleanHon.startsWith(cleanQ))) return true;

  if (faculty.employeeId && faculty.employeeId.toLowerCase().includes(lowerQ)) {
    return true;
  }

  if (faculty.designation && faculty.designation.toLowerCase().includes(lowerQ)) {
    return true;
  }

  return false;
};

module.exports = {
  stripHonorifics,
  generateInitials,
  normalizeInitials,
  getEffectiveInitials,
  matchesFacultySearch,
};
