import Intervention from '../models/Intervention.js';
import User from '../models/User.js';

// GET /api/interventions/my
export const getMyInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find({ facultyId: req.user.userId })
      .sort({ sentAt: -1 })
      .lean();

    // Enrich with student names
    const studentIds = [...new Set(interventions.map(i => i.studentId))];
    const students = await User.find({ studentId: { $in: studentIds } }).select('name studentId');
    const nameMap = {};
    students.forEach(s => { nameMap[s.studentId] = s.name; });

    const enriched = interventions.map(i => ({
      ...i,
      studentName: nameMap[i.studentId] || i.studentId,
    }));

    const total = enriched.length;
    const improved = enriched.filter(i => i.outcome === 'improved').length;
    const worsened = enriched.filter(i => i.outcome === 'worsened').length;
    const pending = enriched.filter(i => i.outcome === 'pending').length;
    const unchanged = enriched.filter(i => i.outcome === 'unchanged').length;
    const resolutionRate = total > 0 ? `${Math.round((improved / total) * 100)}%` : '0%';

    res.json({
      interventions: enriched,
      stats: { total, improved, unchanged, worsened, pending, resolutionRate },
    });
  } catch (err) {
    console.error('[GetMyInterventions]', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/interventions/stats
export const getInterventionStats = async (req, res) => {
  try {
    const filter = req.user.role === 'faculty' ? { facultyId: req.user.userId } : {};
    const all = await Intervention.find(filter).lean();

    const total = all.length;
    const improved = all.filter(i => i.outcome === 'improved').length;
    const pending = all.filter(i => i.outcome === 'pending').length;
    const resolutionRate = total > 0 ? `${Math.round((improved / total) * 100)}%` : '0%';

    res.json({ total, improved, pending, resolutionRate });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
