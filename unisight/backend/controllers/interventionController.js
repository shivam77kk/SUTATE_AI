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
    const resolved = all.filter(i => i.outcome === 'improved' || i.resolvedAt).length;
    const pending = all.filter(i => i.outcome === 'pending').length;
    const resolutionRate = total > 0 ? `${Math.round((resolved / total) * 100)}%` : '0%';

    res.json({ total, resolved, pending, resolutionRate });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/interventions
export const getAllInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find()
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = interventions.map(i => i.studentId);
    const facultyIds = interventions.map(i => i.facultyId);

    const [students, faculties] = await Promise.all([
      User.find({ studentId: { $in: studentIds } }).select('name studentId'),
      User.find({ _id: { $in: facultyIds } }).select('name'),
    ]);

    const studentMap = Object.fromEntries(students.map(s => [s.studentId, s.name]));
    const facultyMap = Object.fromEntries(faculties.map(f => [f._id.toString(), f.name]));

    const enriched = interventions.map(i => ({
      ...i,
      studentName: studentMap[i.studentId] || i.studentId,
      facultyName: facultyMap[i.facultyId.toString()] || 'Unknown',
      status: i.outcome,
      type: 'Academic Warning', // Placeholder or add to model
    }));

    res.json({ interventions: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

