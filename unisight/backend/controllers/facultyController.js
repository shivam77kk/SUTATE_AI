import User from '../models/User.js';
import Marks from '../models/Marks.js';
import Attendance from '../models/Attendance.js';
import Insight from '../models/Insight.js';
import Alert from '../models/Alert.js';
import UploadLog from '../models/UploadLog.js';
import TeacherInsight from '../models/TeacherInsight.js';
import PDFDocument from 'pdfkit';
import { callGemini } from '../services/geminiService.js';
import { textToSpeech } from '../services/voiceService.js';

// GET /api/faculty/dashboard
export const getFacultyDashboard = async (req, res) => {
  try {
    if (false && !global.dbConnected) {
      return res.json({
        latestUploadKpi: { processed: 15, atRiskFound: 3, improvements: 2 },
        recentUploads: [
          { _id: 'mock-upload-1', filename: 'cse_marks_sem4.csv', date: new Date(), status: 'COMPLETE', entries: 15, errors: 0 },
          { _id: 'mock-upload-2', filename: 'cse_attendance_march.csv', date: new Date(Date.now() - 86400000), status: 'COMPLETE', entries: 15, errors: 0 },
        ],
        proactiveAlerts: [
          { studentId: 'S007', name: 'Pooja Nair', riskLevel: 'HIGH', reason: 'Attendance dropped to 62%' },
          { studentId: 'S008', name: 'Dev Sharma', riskLevel: 'HIGH', reason: 'Failed OS mid-sem' },
        ],
      });
    }
    const latestLog = await UploadLog.findOne({ facultyId: req.user.userId, status: 'complete' }).sort({ createdAt: -1 });
    const recentUploads = await UploadLog.find({ facultyId: req.user.userId }).sort({ createdAt: -1 }).limit(5);
    const pendingAlerted = latestLog?.pendingAlerts || [];

    const latestUploadKpi = latestLog
      ? { processed: latestLog.studentCount || 0, atRiskFound: latestLog.pendingAlerts?.length || 0, improvements: 0 }
      : null;

    res.json({
      latestUploadKpi,
      recentUploads: recentUploads.map(u => ({
        _id: u._id,
        filename: u.originalFilename,
        date: u.createdAt,
        status: u.status?.toUpperCase() || 'PENDING',
        entries: u.studentCount || 0,
        errors: u.errorCount || 0,
      })),
      proactiveAlerts: [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/faculty/send-alert
export const sendStudentAlert = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });

    const student = await User.findOne({ studentId }).select('name email');
    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    const marks = await Marks.find({ studentId });
    const attendance = await Attendance.find({ studentId });

    const marksSummary = marks.map(m => {
      const total = (m.scores.ut1||0)+(m.scores.midSem||0)+(m.scores.ut2||0)+(m.scores.endSem||0);
      return `${m.subject}: ${total}/160`;
    }).join(', ');
    const attSummary = attendance.map(a => `${a.subject}: ${a.percentage}%`).join(', ');

    const prompt = `You are a university teacher. Write a professional, empathetic email to a student named ${student?.name || studentId} about their academic performance.

Student data:
- Risk Level: ${insight?.riskLevel || 'MEDIUM'}
- Risk Reason: ${insight?.riskReason || 'Poor academic performance'}
- Marks: ${marksSummary || 'No marks data'}
- Attendance: ${attSummary || 'No attendance data'}

Write a 150-200 word email that is warm but firm, explaining the concern and requesting them to take corrective action. Include a subject line at the top.`;

    const emailText = await callGemini(prompt, { maxTokens: 400 });

    // Log the alert
    await Alert.create({
      studentId,
      facultyId: req.user.userId,
      emailSubject: `Academic Performance Alert — ${studentId}`,
      emailBody: emailText,
      sentAt: new Date(),
    });

    res.json({ success: true, emailDraft: emailText, sentTo: student?.name || studentId });
  } catch (err) {
    console.error('[SendAlert] Error:', err);
    res.status(500).json({ error: 'Failed to generate alert: ' + err.message });
  }
};


// GET /api/faculty/classes
export const getMyClasses = async (req, res) => {
  try {
    if (false && !global.dbConnected) {
      return res.json({
        classes: [
          { classId: 'CSE_SEM4_2024', department: 'CSE', semester: 4, studentCount: 15, atRiskCount: 3, uploadedAt: new Date(), status: 'complete' },
          { classId: 'IT_SEM4_2024', department: 'IT', semester: 4, studentCount: 10, atRiskCount: 2, uploadedAt: new Date(), status: 'complete' },
        ]
      });
    }
    const logs = await UploadLog.find({ facultyId: req.user.userId })
      .sort({ createdAt: -1 });

    // If faculty has uploaded CSVs, use those
    if (logs.length > 0) {
      const classes = logs.map(log => ({
        classId: log.classId,
        department: log.department,
        semester: log.semester,
        studentCount: log.studentCount,
        atRiskCount: log.pendingAlerts?.length || 0,
        uploadedAt: log.createdAt,
        status: log.status,
      }));
      return res.json({ classes });
    }

    // Fallback: show classes from Insight collection (seeded data)
    const facultyUser = await User.findById(req.user.userId).select('department');
    const dept = facultyUser?.department;

    const allInsights = await Insight.find(dept ? { department: dept } : {})
      .select('classId department semester studentId');

    // Group by classId
    const classMap = {};
    for (const ins of allInsights) {
      if (!ins.classId) continue;
      if (!classMap[ins.classId]) {
        classMap[ins.classId] = {
          classId: ins.classId,
          department: ins.department,
          semester: ins.semester || 1,
          studentCount: 0,
          atRiskCount: 0,
          uploadedAt: new Date(),
          status: 'complete',
        };
      }
      classMap[ins.classId].studentCount++;
    }

    // Count at-risk per class
    const atRiskInsights = await Insight.find(dept ? { department: dept, riskLevel: { $ne: 'LOW' } } : { riskLevel: { $ne: 'LOW' } });
    for (const ins of atRiskInsights) {
      if (classMap[ins.classId]) classMap[ins.classId].atRiskCount++;
    }

    const classes = Object.values(classMap);
    res.json({ classes });
  } catch (err) {
    console.error('[GetMyClasses]', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// GET /api/faculty/pending-alerts
export const getPendingAlerts = async (req, res) => {
  try {
    if (!global.dbConnected) {
      return res.json({
        hasAlerts: true,
        count: 2,
        students: [
          { studentId: 'S007', name: 'Pooja Nair', riskLevel: 'HIGH', riskReason: 'Attendance < 65%', classId: 'CSE_SEM4_2024', avgScore: 42, avgAttendance: 64, dropoutProbabilityScore: 85, dropoutTier: 'HIGH' },
          { studentId: 'S008', name: 'Dev Sharma', riskLevel: 'HIGH', riskReason: 'Marks declining', classId: 'CSE_SEM4_2024', avgScore: 48, avgAttendance: 58, dropoutProbabilityScore: 82, dropoutTier: 'HIGH' },
        ]
      });
    }
    const latestLog = await UploadLog.findOne({ facultyId: req.user.userId, status: 'complete' })
      .sort({ createdAt: -1 });

    let studentIds = [];
    let sourceClassId = null;

    if (latestLog && latestLog.pendingAlerts?.length) {
      studentIds = latestLog.pendingAlerts;
      sourceClassId = latestLog.classId;
    } else {
      // Fallback: show all HIGH/MEDIUM risk students from faculty's department
      const facultyUser = await User.findById(req.user.userId).select('department');
      const dept = facultyUser?.department;
      const riskInsights = await Insight.find(
        dept
          ? { riskLevel: { $in: ['HIGH', 'MEDIUM'] }, department: dept }
          : { riskLevel: { $in: ['HIGH', 'MEDIUM'] } }
      ).sort({ riskLevel: 1, cgpa: 1 }).limit(20);
      studentIds = riskInsights.map(i => i.studentId);
    }

    if (!studentIds.length) {
      return res.json({ hasAlerts: false, count: 0, students: [] });
    }

    const studentData = await Promise.all(
      studentIds.slice(0, 20).map(async (studentId) => {
        const user = await User.findOne({ studentId }).select('name studentId');
        const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
        const marks = await Marks.find({ studentId });
        const attendance = await Attendance.find({ studentId });

        const scores = marks.map(m => (m.scores.ut1||0)+(m.scores.midSem||0)+(m.scores.ut2||0)+(m.scores.endSem||0));
        const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*100/160) : 0;
        const avgAttendance = attendance.length
          ? Math.round(attendance.reduce((a,b)=>a+b.percentage,0)/attendance.length) : 0;

        return {
          studentId,
          name: user?.name || studentId,
          riskLevel: insight?.riskLevel || 'MEDIUM',
          riskReason: insight?.riskReason || 'At-risk flagged by system',
          classId: sourceClassId || insight?.classId || null,
          avgScore,
          avgAttendance,
          dropoutProbabilityScore: insight?.dropoutProbabilityScore || null,
          dropoutTier: insight?.dropoutTier || null,
        };
      })
    );

    // Sort: HIGH first
    studentData.sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (order[a.riskLevel] ?? 2) - (order[b.riskLevel] ?? 2);
    });

    res.json({ hasAlerts: studentData.length > 0, count: studentData.length, students: studentData });
  } catch (err) {
    console.error('[PendingAlerts]', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// GET /api/faculty/class/:id/summary
export const getClassSummary = async (req, res) => {
  try {
    if (!global.dbConnected) {
      return res.json({
        kpi: { classAvgScore: 108, passPercent: 92, atRiskCount: 3, belowAttendanceCount: 2, totalStudents: 15 },
        atRiskStudents: [
          { studentId: 'S007', name: 'Pooja Nair', riskLevel: 'HIGH', riskReason: 'Attendance < 65%', avgScore: 42, avgAttendance: 64, dropoutProbabilityScore: 85, dropoutTier: 'HIGH', trend: 'down' },
          { studentId: 'S008', name: 'Dev Sharma', riskLevel: 'HIGH', riskReason: 'Marks declining', avgScore: 48, avgAttendance: 58, dropoutProbabilityScore: 82, dropoutTier: 'HIGH', trend: 'down' },
        ],
      });
    }
    const classId = req.params.id;
    const insights = await Insight.find({ classId });
    const marks = await Marks.find({ classId });
    const attendance = await Attendance.find({ classId });

    const totalStudents = insights.length;
    const atRiskCount = insights.filter(i => i.riskLevel !== 'LOW').length;

    const allScores = marks.map(m => (m.scores.ut1||0)+(m.scores.midSem||0)+(m.scores.ut2||0)+(m.scores.endSem||0));
    const classAvgScore = allScores.length ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length) : 0;
    const passPercent = allScores.length ? Math.round(allScores.filter(s=>s>=40).length/allScores.length*100) : 0;
    const belowAttendanceCount = attendance.filter(a => a.percentage < 75).length;

    const atRiskStudents = await Promise.all(
      insights.filter(i => i.riskLevel !== 'LOW').map(async (insight) => {
        const user = await User.findOne({ studentId: insight.studentId }).select('name');
        const stuMarks = marks.filter(m => m.studentId === insight.studentId);
        const stuScores = stuMarks.map(m => (m.scores.ut1||0)+(m.scores.midSem||0)+(m.scores.ut2||0)+(m.scores.endSem||0));
        const avgScore = stuScores.length ? Math.round(stuScores.reduce((a,b)=>a+b,0)/stuScores.length) : 0;
        const stuAtt = attendance.filter(a => a.studentId === insight.studentId);
        const avgAttendance = stuAtt.length ? Math.round(stuAtt.reduce((a,b)=>a+b.percentage,0)/stuAtt.length) : 0;

        return {
          studentId: insight.studentId,
          name: user?.name || insight.studentId,
          riskLevel: insight.riskLevel,
          riskReason: insight.riskReason,
          avgScore,
          avgAttendance,
          dropoutProbabilityScore: insight.dropoutProbabilityScore || null,
          dropoutTier: insight.dropoutTier || null,
          trend: avgScore < 50 ? 'down' : 'same',
        };
      })
    );

    const students = await Promise.all(
      insights.map(async (ins) => {
        const user = await User.findOne({ studentId: ins.studentId }).select('name');
        return {
          studentId: ins.studentId,
          name: user?.name || ins.studentId,
          dropoutTier: ins.dropoutTier || ins.riskLevel || 'LOW',
          cgpa: ins.cgpa || 0,
        };
      })
    );
    const heatmap = marks.slice(0, 20).map((m) => ({
      studentId: m.studentId,
      subject: m.subject,
      score: (m.scores?.ut1 || 0) + (m.scores?.midSem || 0) + (m.scores?.ut2 || 0) + (m.scores?.endSem || 0),
    }));
    const narrative = `Class ${classId} has ${atRiskCount} at-risk students out of ${totalStudents}.`;
    res.json({
      students,
      heatmap,
      narrative,
      kpi: { classAvgScore, passPercent, atRiskCount, belowAttendanceCount, totalStudents },
      atRiskStudents,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/faculty/class/:id/heatmap
export const getClassHeatmap = async (req, res) => {
  try {
    if (!global.dbConnected) {
      return res.json({
        students: ['S001', 'S007', 'S008'],
        subjects: ['DBMS', 'OS', 'CN', 'DSA', 'Maths'],
        data: [
          { studentId: 'S001', name: 'Riya Shah', DBMS: 95, OS: 88, CN: 98, DSA: 92, Maths: 90, _avg: 93 },
          { studentId: 'S007', name: 'Pooja Nair', DBMS: 45, OS: 38, CN: 52, DSA: 40, Maths: 35, _avg: 42 },
          { studentId: 'S008', name: 'Dev Sharma', DBMS: 50, OS: 42, CN: 55, DSA: 45, Maths: 48, _avg: 48 },
        ]
      });
    }
    const classId = req.params.id;
    const marks = await Marks.find({ classId });

    const studentIds = [...new Set(marks.map(m => m.studentId))];
    const subjects = [...new Set(marks.map(m => m.subject))];

    const users = await User.find({ studentId: { $in: studentIds } }).select('name studentId');
    const userMap = Object.fromEntries(users.map(u => [u.studentId, u.name]));

    const data = studentIds.map(studentId => {
      const row = { studentId, name: userMap[studentId] || studentId };
      for (const subject of subjects) {
        const m = marks.find(mk => mk.studentId === studentId && mk.subject === subject);
        if (m) {
          const total = (m.scores.ut1||0)+(m.scores.midSem||0)+(m.scores.ut2||0)+(m.scores.endSem||0);
          row[subject] = Math.round((total / 160) * 100);
        } else {
          row[subject] = 0;
        }
      }
      // add avg for sorting
      const vals = subjects.map(s => row[s] || 0);
      row._avg = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
      return row;
    });

    data.sort((a, b) => a._avg - b._avg); // worst at top

    res.json({ students: studentIds, subjects, data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/faculty/class/:id/report/pdf
export const downloadClassReport = async (req, res) => {
  try {
    const classId = req.params.id;
    const insights = await Insight.find({ classId });
    const marks = await Marks.find({ classId });
    const attendance = await Attendance.find({ classId });
    const log = await UploadLog.findOne({ classId });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="class-report-${classId}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#059669').text('UniSight Class Report', { align: 'center' });
    doc.fontSize(12).fillColor('#333').text(`Class: ${classId}`, { align: 'center' });
    doc.text(`Department: ${log?.department || 'N/A'} | Semester: ${log?.semester || 'N/A'}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    const allScores = marks.map(m => (m.scores.ut1||0)+(m.scores.midSem||0)+(m.scores.ut2||0)+(m.scores.endSem||0));
    const classAvg = allScores.length ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length) : 0;
    const passCount = allScores.filter(s=>s>=40).length;
    const atRiskCount = insights.filter(i => i.riskLevel !== 'LOW').length;

    doc.fontSize(14).fillColor('#059669').text('Class Summary');
    doc.fontSize(11).fillColor('#333');
    doc.text(`Total Students: ${insights.length}`);
    doc.text(`Class Average Score: ${classAvg}/160`);
    doc.text(`Pass Percentage: ${allScores.length ? Math.round(passCount/allScores.length*100) : 0}%`);
    doc.text(`At Risk Students: ${atRiskCount}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#059669').text('At-Risk Students');
    doc.fontSize(10).fillColor('#333');
    for (const insight of insights.filter(i => i.riskLevel !== 'LOW')) {
      doc.text(`[${insight.riskLevel}] ${insight.studentId}: ${insight.riskReason}`);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'PDF generation failed' });
  }
};

// GET /api/faculty/student/:id/full-profile
export const getStudentFullProfile = async (req, res) => {
  try {
    if (!global.dbConnected) {
      return res.json({
        student: { name: 'Riya Shah', email: 'riya.shah@student.edu', studentId: 'S001', department: 'CSE' },
        marks: [
          { subject: 'DBMS', scores: { ut1: 28, midSem: 27, ut2: 29, endSem: 65 }, semester: 4, classId: 'CSE_SEM4_2024' },
          { subject: 'OS', scores: { ut1: 24, midSem: 22, ut2: 25, endSem: 58 }, semester: 4, classId: 'CSE_SEM4_2024' },
        ],
        attendance: [
          { subject: 'DBMS', attended: 22, total: 24, percentage: 92, status: 'safe' },
          { subject: 'OS', attended: 20, total: 24, percentage: 83, status: 'warning' },
        ],
        insight: { riskLevel: 'LOW', riskReason: 'Consistent high performer.', recommendations: [], cgpa: 8.42, classRank: 4, classPercentile: 95, dropoutProbabilityScore: 12, dropoutTier: 'LOW' },
        timeline: { events: [{ date: '2024-03-20', event: 'High quiz score in DBMS', severity: 'info' }] },
        alerts: [],
      });
    }
    const studentId = req.params.id;
    const student = await User.findOne({ studentId }).select('-password');
    const marks = await Marks.find({ studentId });
    const attendance = await Attendance.find({ studentId });
    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    const alerts = await Alert.find({ studentId }).sort({ sentAt: -1 }).limit(10);

    // Timeline events
    const events = [];
    for (const m of marks) {
      const total = (m.scores.ut1||0)+(m.scores.midSem||0)+(m.scores.ut2||0)+(m.scores.endSem||0);
      if (total < 40) events.push({ date: m.createdAt.toISOString().split('T')[0], event: `${m.subject} score low (${total}/160)`, severity: 'danger' });
    }
    for (const a of attendance) {
      if (a.percentage < 75) events.push({ date: a.createdAt.toISOString().split('T')[0], event: `Low attendance in ${a.subject} (${a.percentage}%)`, severity: 'warning' });
    }
    for (const al of alerts) {
      events.push({ date: al.sentAt.toISOString().split('T')[0], event: `Alert: ${al.emailSubject}`, severity: 'info' });
    }
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    const subjects = [...new Set(marks.map(m => m.subject))];
    const marksTrend = ['UT1','MidSem','UT2','EndSem'].map((exam, i) => {
      const scoreKeys = ['ut1','midSem','ut2','endSem'];
      const row = { exam };
      for (const sub of subjects) {
        const m = marks.find(mk => mk.subject === sub);
        row[sub] = m ? (m.scores[scoreKeys[i]] || 0) : 0;
      }
      return row;
    });

    res.json({
      student: student ? { name: student.name, email: student.email, studentId: student.studentId, department: student.department } : { studentId },
      marks: marks.map(m => ({
        subject: m.subject,
        scores: m.scores,
        semester: m.semester,
        classId: m.classId
      })),
      attendance: attendance.map(a => ({ 
        subject: a.subject, 
        attended: a.attended, 
        total: a.total, 
        percentage: a.percentage, 
        status: a.percentage >= 85 ? 'safe' : a.percentage >= 75 ? 'warning' : 'danger' 
      })),
      insight: insight ? { 
        riskLevel: insight.riskLevel, 
        riskReason: insight.riskReason, 
        recommendations: insight.recommendations, 
        cgpa: insight.cgpa, 
        classRank: insight.classRank,
        classPercentile: insight.classPercentile,
        dropoutProbabilityScore: insight.dropoutProbabilityScore,
        dropoutTier: insight.dropoutTier
      } : null,
      timeline: { events },
      alerts: alerts.map(a => ({ sentAt: a.sentAt, emailSubject: a.emailSubject })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/faculty/class/:id/voice-summary
export const getClassVoiceSummary = async (req, res) => {
  try {
    const { id: classId } = req.params;

    const insights = await Insight.find({ classId });
    if (!insights.length) {
      return res.status(404).json({ error: 'No data for this class yet' });
    }

    const total = insights.length;
    const atRisk = insights.filter(i => ['HIGH', 'CRITICAL'].includes(i.riskLevel)).length;
    const passing = insights.filter(i => (i.cgpa || 0) >= 4).length;
    const avgCgpa = (insights.reduce((s, i) => s + (i.cgpa || 0), 0) / total).toFixed(1);

    const prompt = `
Write a 40-word spoken summary for a faculty member about their class.
Data: ${total} students, ${atRisk} high-risk, ${passing} passing, average CGPA ${avgCgpa}.
Write as if speaking aloud. Natural sentences. No bullet points. No markdown.
Start with: "Here is your class summary."
`;

    const summary = await callGemini(prompt, { maxTokens: 100, temperature: 0.3 });
    const audioData = await textToSpeech(summary);

    res.json({
      summary,
      audio: audioData,
      voiceAvailable: !!audioData,
    });
  } catch (err) {
    console.error('[ClassVoiceSummary] Error:', err);
    res.status(500).json({ error: 'Could not generate voice summary' });
  }
};


// GET /api/faculty/effectiveness
export const getFacultyEffectiveness = async (req, res) => {
  try {
    const facultyId = req.user.userId;
    const insight = await TeacherInsight.findOne({ facultyId }).sort({ createdAt: -1 });
    
    if (!insight) {
      return res.json({
        overall: { score: 0, badge: 'New', studentPassRate: 0, avgImprovement: 0 },
        history: []
      });
    }
    
    res.json({
      overall: {
        score: insight.effectivenessScore || 0,
        badge: insight.effectivenessScore >= 85 ? 'Excellent' : insight.effectivenessScore >= 70 ? 'Good' : 'Developing',
        studentPassRate: insight.classPassRate || 0,
        avgImprovement: insight.scoreChangeVsPrevSem || 0
      },
      history: []
    });
  } catch (err) {
    console.error('[FacultyEffectiveness]', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/faculty/effectiveness-history
export const getFacultyEffectivenessHistory = async (req, res) => {
  try {
    const facultyId = req.user.userId;
    const insights = await TeacherInsight.find({ facultyId }).sort({ createdAt: 1 }).limit(10);
    
    const history = insights.map((ins, idx) => ({
      period: `Period ${idx + 1}`,
      score: ins.effectivenessScore || 0,
      badge: ins.effectivenessScore >= 85 ? 'Excellent' : ins.effectivenessScore >= 70 ? 'Good' : 'Developing',
      studentPassRate: ins.classPassRate || 0,
      avgImprovement: ins.scoreChangeVsPrevSem || 0,
      studentCount: ins.studentCount || 0
    }));
    
    const latest = insights[insights.length - 1];
    const overall = latest ? {
      score: latest.effectivenessScore || 0,
      badge: latest.effectivenessScore >= 85 ? 'Excellent' : latest.effectivenessScore >= 70 ? 'Good' : 'Developing',
      studentPassRate: latest.classPassRate || 0,
      avgImprovement: latest.scoreChangeVsPrevSem || 0
    } : { score: 0, badge: 'New', studentPassRate: 0, avgImprovement: 0 };
    
    res.json({ overall, history });
  } catch (err) {
    console.error('[FacultyEffectivenessHistory]', err);
    res.status(500).json({ error: 'Server error' });
  }
};
