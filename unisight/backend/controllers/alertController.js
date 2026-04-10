import User from '../models/User.js';
import Insight from '../models/Insight.js';
import UploadLog from '../models/UploadLog.js';
import { sendStudentAlert } from '../services/emailService.js';

// POST /api/alerts/:studentId
export const sendAlert = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findOne({ studentId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    if (!insight) return res.status(404).json({ error: 'No insight found for student' });

    const faculty = await User.findById(req.user.userId);

    await sendStudentAlert({ student, insight, faculty });

    // Remove from pending alerts in the latest upload log
    await UploadLog.updateMany(
      { facultyId: req.user.userId },
      { $pull: { pendingAlerts: studentId } }
    );

    res.json({ success: true, message: `Alert sent to ${student.name}` });
  } catch (err) {
    console.error('[Alert] Error:', err);
    res.status(500).json({ error: 'Failed to send alert: ' + err.message });
  }
};
