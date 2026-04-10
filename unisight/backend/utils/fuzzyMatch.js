import { distance } from 'fastest-levenshtein';
import User from '../models/User.js';

/**
 * Finds potential registered student matches for a given unknown ID
 * @param {string} unknownId - The student ID from CSV that isn't in User collection
 * @param {string} department - Faculty's department to narrow search
 * @returns {Promise<Array>} - List of suggestions with similarity scores
 */
export async function findSuggestions(unknownId, department) {
  // 1. Fetch all registered students in that department
  const registeredStudents = await User.find({ 
    role: 'student', 
    department 
  }).select('studentId name').lean();

  if (!registeredStudents.length) return [];

  // 2. Score each one using Levenshtein distance
  const suggestions = registeredStudents.map(student => {
    const d = distance(unknownId.toUpperCase(), student.studentId.toUpperCase());
    // Convert distance to a similarity score (approx)
    // distance 0 = 100%, distance 1 = 90%, etc.
    const similarity = Math.max(0, 100 - (d * 15)); 
    return {
      studentId: student.studentId,
      name: student.name,
      similarity
    };
  });

  // 3. Filter for decent matches (similarity > 50%) and sort
  return suggestions
    .filter(s => s.similarity > 50)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3); // Top 3 suggestions
}

export default { findSuggestions };
