/**
 * Temp password rule (from INU login guideline):
 *   Grandfather's name (lowercase, no spaces) + "1234abcd#"
 * Example: grandfather "Abebe" → "abebe1234abcd#"
 */
module.exports = (grandfatherName) => {
  const clean = String(grandfatherName || 'student')
    .toLowerCase()
    .replace(/\s+/g, '');
  return `${clean}1234abcd#`;
};