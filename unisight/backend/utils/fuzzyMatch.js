import { distance } from 'fastest-levenshtein';
import User from '../models/User.js';


export async function findSuggestions(unknownId, department) {
 
  const registeredStudents = await User.find({ 
    role: 'student', 
    department 
  }).select('studentId name').lean();

  if (!registeredStudents.length) return [];

 
  const suggestions = registeredStudents.map(student => {
    const d = distance(unknownId.toUpperCase(), student.studentId.toUpperCase());
   
   
    const similarity = Math.max(0, 100 - (d * 15)); 
    return {
      studentId: student.studentId,
      name: student.name,
      similarity
    };
  });

 
  return suggestions
    .filter(s => s.similarity > 50)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}

export default { findSuggestions };
