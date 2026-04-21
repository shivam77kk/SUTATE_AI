import cron from 'node-cron';
import User from '../models/User.js';
import StudentGoal from '../models/StudentGoal.js';
import ActivityData from '../models/ActivityData.js';

class DigestService {
  constructor() {
    this.startWeeklyDigest();
  }

  startWeeklyDigest() {
    cron.schedule('0 9 * * 0', async () => {
      console.log('Running weekly digest generation for all students...');
      try {
        const students = await User.find({ role: 'student' });
        
        for (const student of students) {
          await this.generateDigestForStudent(student);
        }
        console.log(`Weekly digest completed for ${students.length} students.`);
      } catch (err) {
        console.error('Error generating weekly digest:', err);
      }
    });
  }

  async generateDigestForStudent(student) {
    if (!student.email) return;
    try {
      const goal = await StudentGoal.findOne({ studentId: student.studentId })
        .sort({ updatedAt: -1 });
      const activity = await ActivityData.findOne({ studentId: student.studentId })
        .sort({ updatedAt: -1 });

      const cgpa = goal ? goal.currentCgpa : 'N/A';
      const activitiesScore = activity ? activity.overallScore : 'N/A';
      
      const emailContent = `
        Hello ${student.name},
        Here is your SUTATE AI Weekly Digest:
        - Current CGPA: ${cgpa}
        - Activity Score: ${activitiesScore}
        Log in to your dashboard to view personalized AI recommendations and ensure you're on track for your goals!
      `;
      // Email sending logic can be added here
    } catch (err) {
      console.error(`Failed digest for ${student.email}:`, err);
    }
  }
}

export default new DigestService();