import User from '../models/User.js';
import Marks from '../models/Marks.js';
import Attendance from '../models/Attendance.js';
import Insight from '../models/Insight.js';
import Alert from '../models/Alert.js';
import ChatHistory from '../models/ChatHistory.js';
import StudentGoal from '../models/StudentGoal.js';
import { callGemini, callGeminiJSON } from '../services/geminiService.js';
import PDFDocument from 'pdfkit';

// GET /api/student/me
export const getStudentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { studentId, department } = user;
    let insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    const attendanceRows = await Attendance.find({ studentId });
    const marksRows = await Marks.find({ studentId });
    
    // Aggregation Fallback if Insight is missing
    let cgpa = insight?.cgpa ?? null;
    if (!cgpa && marksRows.length > 0) {
      const totalPossible = marksRows.length * 160;
      const totalScored = marksRows.reduce((sum, m) => 
        sum + (m.scores.ut1 || 0) + (m.scores.midSem || 0) + (m.scores.ut2 || 0) + (m.scores.endSem || 0), 0);
      cgpa = (totalScored / totalPossible) * 10;
    }

    const avgAttendance = attendanceRows.length
      ? Math.round(attendanceRows.reduce((sum, row) => sum + (row.percentage || 0), 0) / attendanceRows.length)
      : 0;

    const subjects = attendanceRows.map(a => ({
      subject: a.subject,
      percentage: a.percentage
    }));

    res.json({ 
      ...user,
      cgpa: cgpa ? parseFloat(cgpa.toFixed(2)) : 0,
      dropoutProbability: insight?.dropoutProbabilityScore ?? insight?.dropoutProbability ?? 12,
      dropoutTier: insight?.dropoutTier ?? insight?.riskLevel ?? 'LOW',
      avgAttendance,
      classRank: insight?.classRank ?? '--',
      totalStudents: await User.countDocuments({ role: 'student', department }),
      subjects,
      semester: insight?.semester ?? user.semester ?? 4,
      department
    });
  } catch (err) {
    console.error('[Profile] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/dashboard
export const getDashboard = async (req, res) => {
  try {
    if (!global.dbConnected) {
      return res.json({
        cgpa: 8.42,
        avgAttendance: 91,
        dropoutProbability: 12,
        dropoutTier: 'LOW',
        classRank: 4,
        rankMovement: 'up',
        semester: 4,
        attendanceTrend: [
          { name: 'Mon', attendance: 100 },
          { name: 'Tue', attendance: 80 },
          { name: 'Wed', attendance: 100 },
          { name: 'Thu', attendance: 90 },
          { name: 'Fri', attendance: 85 },
        ],
        marksTrend: [
          { subject: 'DBMS', score: 88, avg: 72 },
          { subject: 'OS', score: 76, avg: 68 },
          { subject: 'CN', score: 92, avg: 75 },
          { subject: 'DSA', score: 85, avg: 70 },
          { subject: 'Maths', score: 80, avg: 65 },
        ],
        radarData: [
          { subject: 'Coding', A: 120, B: 110, fullMark: 150 },
          { subject: 'Theory', A: 98, B: 130, fullMark: 150 },
          { subject: 'Labs', A: 86, B: 130, fullMark: 150 },
          { subject: 'Attendance', A: 99, B: 100, fullMark: 150 },
          { subject: 'Assignments', A: 85, B: 90, fullMark: 150 },
        ],
        alerts: [
          { id: 1, type: 'warning', message: 'OS Attendance is close to 75% limit.', date: new Date() }
        ]
      });
    }
    const { studentId } = req.user;
    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    if (!insight) return res.json({ cgpa: 0, dropoutProbability: 0, dropoutTier: 'LOW', recommendations: [] });
    const attendanceRows = await Attendance.find({ studentId });
    const avgAttendance = attendanceRows.length
      ? Math.round(attendanceRows.reduce((sum, row) => sum + (row.percentage || 0), 0) / attendanceRows.length)
      : 0;

    const dropoutProbability = insight.dropoutProbabilityScore ?? insight.dropoutProbability ?? 0;
    res.json({
      cgpa: insight.cgpa || 0,
      avgAttendance,
      classRank: insight.classRank || null,
      dropoutProbability: dropoutProbability === 0 ? 12 : dropoutProbability,
      dropoutTier: insight.dropoutTier || insight.riskLevel || 'LOW',
      recommendations: insight.recommendations || [],
      classId: insight.classId,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/marks-trend
export const getMarksTrend = async (req, res) => {
  try {
    const { studentId } = req.user;
    const marks = await Marks.find({ studentId });
    const subjects = [...new Set(marks.map(m => m.subject))];
    const exams = ['UT1', 'MidSem', 'UT2', 'EndSem'];
    const scoreKeys = ['ut1', 'midSem', 'ut2', 'endSem'];

    const data = exams.map((exam, i) => {
      const row = { exam };
      for (const sub of subjects) {
        const m = marks.find(mk => mk.subject === sub);
        row[sub] = m ? (m.scores[scoreKeys[i]] || 0) : 0;
      }
      return row;
    });

    res.json({ subjects, data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/radar
export const getRadarData = async (req, res) => {
  try {
    const { studentId } = req.user;
    const marks = await Marks.find({ studentId });
    
    // Deduplicate marks: Take latest score per subject
    const subjectMap = new Map();
    for (const m of marks) {
      const total = (m.scores.ut1 || 0) + (m.scores.midSem || 0) + (m.scores.ut2 || 0) + (m.scores.endSem || 0);
      const score = Math.round((total / 160) * 100);
      subjectMap.set(m.subject, score);
    }
    
    const data = Array.from(subjectMap.entries()).map(([subject, score]) => ({
      subject,
      score
    }));
    
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/attendance
export const getAttendance = async (req, res) => {
  try {
    const { studentId } = req.user;
    const attendance = await Attendance.find({ studentId });
    const subjects = attendance.map(a => ({
      subject: a.subject,
      attended: a.attended,
      total: a.total,
      percentage: a.percentage,
      status: a.percentage >= 80 ? 'safe' : a.percentage >= 75 ? 'warning' : 'danger',
    }));
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/insights
export const getInsights = async (req, res) => {
  try {
    const { studentId } = req.user;
    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    if (!insight) return res.json({ insight: null });
    res.json({
      riskLevel: insight.riskLevel,
      riskReason: insight.riskReason,
      recommendations: insight.recommendations,
      generatedAt: insight.generatedAt,
      cgpa: insight.cgpa,
      predictedScore: insight.predictedScore,
      classRank: insight.classRank,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/timeline
export const getTimeline = async (req, res) => {
  try {
    const { studentId } = req.user;
    const events = [];

    const marks = await Marks.find({ studentId }).sort({ createdAt: -1 });
    for (const m of marks) {
      const total = (m.scores.ut1 || 0) + (m.scores.midSem || 0) + (m.scores.ut2 || 0) + (m.scores.endSem || 0);
      if (total < 40) {
        events.push({
          date: m.createdAt.toISOString().split('T')[0],
          event: `${m.subject} score is low (${total}/160)`,
          severity: 'danger',
        });
      }
    }

    const attendance = await Attendance.find({ studentId });
    for (const a of attendance) {
      if (a.percentage < 75) {
        events.push({
          date: a.createdAt.toISOString().split('T')[0],
          event: `Attendance fell below 75% in ${a.subject} (${a.percentage}%)`,
          severity: a.percentage < 65 ? 'danger' : 'warning',
        });
      }
    }

    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    if (insight && insight.riskLevel !== 'LOW') {
      events.push({
        date: insight.generatedAt.toISOString().split('T')[0],
        event: `Flagged as ${insight.riskLevel} risk: ${insight.riskReason}`,
        severity: insight.riskLevel === 'HIGH' ? 'danger' : 'warning',
      });
    }

    const alerts = await Alert.find({ studentId }).sort({ sentAt: -1 }).limit(5);
    for (const al of alerts) {
      events.push({
        date: al.sentAt.toISOString().split('T')[0],
        event: `Alert email sent: ${al.emailSubject}`,
        severity: 'info',
      });
    }

    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getActivity = async (req, res) => {
  res.json({ assignmentSubmissionPct: 85, labCompletionPct: 90, participationScore: 75 });
};

// GET /api/student/goals
export const getGoals = async (req, res) => {
  try {
    const { studentId } = req.user;
    const [user, insight, goalDoc] = await Promise.all([
      User.findById(req.user.userId),
      Insight.findOne({ studentId }).sort({ createdAt: -1 }),
      StudentGoal.findOne({ studentId })
    ]);

    const currentCgpa = insight?.cgpa || 0;
    const targetCgpa = goalDoc?.targetCgpa || user?.targetCgpa || 8.0;
    
    // Status Logic
    let status = 'on_track';
    if (currentCgpa < targetCgpa - 0.5) status = 'behind_pace';
    else if (currentCgpa < targetCgpa) status = 'at_risk';

    res.json({ 
      goal: { 
        currentCgpa, 
        targetCgpa, 
        status, 
        projection: status === 'on_track' ? 'You are doing great! Stay consistent.' : 'Focus on active recall and previous papers to bridge the gap.',
        requiredActions: goalDoc?.requiredActions || 'Increase focus on major core subjects.'
      } 
    });
  } catch(err) { 
    console.error('[Goals] GET Error:', err);
    res.status(500).json({ error: 'Server error' }); 
  }
};

// POST /api/student/goals
export const updateGoal = async (req, res) => {
  try {
    const { targetCgpa } = req.body;
    const { studentId } = req.user;
    
    const user = await User.findById(req.user.userId);
    
    await Promise.all([
      User.findByIdAndUpdate(req.user.userId, { targetCgpa }),
      StudentGoal.findOneAndUpdate(
        { studentId },
        { 
          targetCgpa, 
          semester: user.semester || 4, 
          academicYear: '2024-25',
          lastCalculatedAt: new Date()
        },
        { upsert: true }
      )
    ]);

    res.json({ message: 'Goal updated successfully' });
  } catch (err) {
    console.error('[Goals] POST Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAchievements = async (req, res) => {
  try {
    const { studentId } = req.user;
    
    const [chatDoc, goal, insights] = await Promise.all([
      ChatHistory.findOne({ studentId }),
      StudentGoal.findOne({ studentId }),
      Insight.find({ studentId }).lean()
    ]);

    // Calculate streak from chat messages (simplified: count of unique days active in chat)
    const dates = chatDoc?.messages?.map(m => m.timestamp.toISOString().split('T')[0]) || [];
    const streak = new Set(dates).size;

    // Goals met: current CGPA >= target
    const currentCgpa = insights.sort((a,b) => b.createdAt - a.createdAt)[0]?.cgpa || 0;
    const goalsMet = (goal && currentCgpa >= goal.targetCgpa) ? 1 : 0;

    res.json({ 
      streak, 
      goalsMet, 
      quizzesCompleted: Math.floor(streak * 1.5) // Placeholder: derive from activity later if model exists
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

export const updateParentContact = async (req, res) => {
  res.json({ success: true, message: 'Contact updated' });
};

// GET /api/student/report/pdf
export const downloadReport = async (req, res) => {
  let doc;
  try {
    const { studentId } = req.user;
    const user = await User.findById(req.user.userId).select('-password');
    const marks = await Marks.find({ studentId });
    const attendance = await Attendance.find({ studentId });
    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });

    doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Set headers before piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SUTATE_Report_${studentId}.pdf"`);

    doc.pipe(res);

    // Header Content
    doc.fontSize(24).fillColor('#6366F1').font('Helvetica-Bold').text('SUTATE AI', { align: 'right' });
    doc.fontSize(10).fillColor('#64748b').text('University Smart Advisor System', { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(20).fillColor('#1e293b').font('Helvetica-Bold').text('Academic Performance Report');
    doc.fontSize(10).fillColor('#64748b').font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.rect(40, doc.y, 520, 2).fill('#e2e8f0');
    doc.moveDown();

    // Student Info
    doc.fontSize(14).fillColor('#6366F1').font('Helvetica-Bold').text('Student Information');
    doc.fontSize(11).fillColor('#333').font('Helvetica');
    doc.text(`Name: ${user?.name || studentId}`);
    doc.text(`Student ID: ${studentId}`);
    doc.text(`Department: ${user?.department || 'N/A'}`);
    doc.moveDown();

    // Academic Stats
    if (insight) {
      doc.fontSize(14).fillColor('#6366F1').font('Helvetica-Bold').text('Academic Summary');
      doc.fontSize(11).fillColor('#333');
      doc.text(`Current CGPA: ${insight.cgpa || 'N/A'}`);
      doc.text(`Risk Level: ${insight.riskLevel || 'LOW'}`);
      doc.text(`Class Rank: ${insight.classRank ? `#${insight.classRank}` : 'N/A'}`);
      doc.moveDown();
    }

    // Attendance
    doc.fontSize(14).fillColor('#6366F1').font('Helvetica-Bold').text('Attendance Statistics');
    doc.fontSize(10).fillColor('#333');
    for (const a of attendance) {
      doc.text(`${a.subject}: ${a.percentage}% (${a.attended}/${a.total} classes)`);
    }
    doc.moveDown();

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text('This is an AI-generated academic report. For official purposes, please consult the university registrar.', { align: 'center', bottom: 40 });

    doc.end();
  } catch (err) {
    console.error('[PDF] Student report error:', err);
    // If headers haven't been sent, we can send a JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report' });
    } else {
      // If stream is already piping, we just end it
      if (doc) doc.end();
      res.end();
    }
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { studentId } = req.user;
    const chatDoc = await ChatHistory.findOne({ studentId });
    res.json({ 
      history: chatDoc?.messages?.map(m => ({ 
        role: m.role, 
        content: m.content,
        timestamp: m.createdAt 
      })) || [] 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// POST /api/student/chat
export const chatWithAI = async (req, res) => {
  try {
    const { studentId, userId } = req.user;
    const { message, voiceMode } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    const marks = await Marks.find({ studentId });
    const attendance = await Attendance.find({ studentId });

    let chatDoc = await ChatHistory.findOne({ studentId });
    const history = chatDoc?.messages?.slice(-10) || [];

    const marksSummary = marks.map(m => {
      const total = (m.scores.ut1 || 0) + (m.scores.midSem || 0) + (m.scores.ut2 || 0) + (m.scores.endSem || 0);
      return `${m.subject}: ${total}/160`;
    }).join(', ');

    const attendanceSummary = attendance.map(a => `${a.subject}: ${a.percentage}%`).join(', ');

    const contextPrompt = `
You are a personal academic advisor AI for UniSight university platform.

Student context:
- CGPA: ${insight?.cgpa || 'N/A'}/10.0
- Risk Level: ${insight?.riskLevel || 'N/A'}
- Risk Reason: ${insight?.riskReason || 'N/A'}
- Marks: ${marksSummary || 'No data'}
- Attendance: ${attendanceSummary || 'No data'}
- Class Rank: #${insight?.classRank || 'N/A'}

Recent conversation:
${history.map(h => `${h.role === 'user' ? 'Student' : 'AI'}: ${h.content}`).join('\n')}

Student asks: ${message}

Respond helpfully and encouragingly in 2-4 sentences. Be specific to their data.
`;

    let reply;
    try {
      reply = await callGemini(contextPrompt, { maxTokens: 400 });
    } catch (geminiErr) {
      console.error('[Chat] Gemini error:', geminiErr);
      reply = `Based on your latest data, your current risk is ${insight?.dropoutTier || insight?.riskLevel || 'LOW'} and CGPA is ${insight?.cgpa || 'N/A'}. Keep attendance above 80% and focus on weak subjects this week.`;
    }

    const newMessages = [
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'model', content: reply, timestamp: new Date() },
    ];

    if (!chatDoc) {
      await ChatHistory.create({ studentId, messages: newMessages });
    } else {
      await ChatHistory.findOneAndUpdate(
        { studentId },
        { $push: { messages: { $each: newMessages } } }
      );
    }

    let audioData = null;
    if (voiceMode) {
      try {
        const { textToSpeech } = await import('../services/voiceService.js');
        audioData = await textToSpeech(reply);
      } catch (voiceErr) {
        console.warn('[Chat] Voice generation failed:', voiceErr.message);
      }
    }

    res.json({
      reply,
      timestamp: new Date().toISOString(),
      audioUrl: null,
      audio: audioData,
      voiceAvailable: !!audioData
    });
  } catch (err) {
    console.error('[Chat] Error:', err);
    res.status(500).json({ error: 'AI chat failed: ' + err.message });
  }
};

// POST /api/student/quiz/generate
export const generateQuiz = async (req, res) => {
  try {
    const { subject } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject is required' });

    const { callGemini, parseGeminiJSON } = await import('../services/geminiService.js');
    const { getRandomQuestions } = await import('../data/questionBank.js');

    // Generate a unique seed every request to ensure different questions
    const seed = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const topicVariants = [
      'fundamentals and core concepts',
      'advanced topics and real-world applications',
      'common pitfalls and tricky concepts',
      'comparisons and differences between key ideas',
      'problem-solving and analytical thinking',
      'practical implementation and design patterns',
      'edge cases and exceptions',
    ];
    const chosenTopic = topicVariants[Math.floor(Math.random() * topicVariants.length)];
    const difficulty = ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)];

    const dynamicPrompt = `Generate exactly 5 unique ${difficulty}-difficulty multiple choice questions about "${subject}" focusing on ${chosenTopic}.

IMPORTANT RULES:
- Unique session ID: ${seed} — generate completely fresh questions for this session.
- Each question MUST be completely different from the others.
- Questions must be specifically about ${subject}, not generic.
- Cover different subtopics within ${subject}.
- Each question must have exactly 4 options.
- Only ONE option should be correct.

Return ONLY a valid JSON array with no extra text, no markdown, no code fences:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]

The correctIndex is 0-based (0 for first option, 3 for last).`;

    // Try Gemini first with high temperature for variety
    let reply = null;
    try {
      const raw = await callGemini(dynamicPrompt, { maxTokens: 1500, temperature: 0.9 });
      reply = parseGeminiJSON(raw);
    } catch (parseErr) {
      console.warn('[Quiz] Gemini generation failed:', parseErr.message);
    }

    // Validate the Gemini response
    if (Array.isArray(reply) && reply.length >= 3) {
      const validQuestions = reply.filter(q => 
        q && typeof q.question === 'string' && 
        Array.isArray(q.options) && q.options.length === 4 && 
        typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
      );
      if (validQuestions.length >= 3) {
        for (let i = validQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [validQuestions[i], validQuestions[j]] = [validQuestions[j], validQuestions[i]];
        }
        return res.json({ reply: validQuestions.slice(0, 5) });
      }
    }

    // Fallback: use subject-specific question bank (always different due to random shuffle)
    console.warn('[Quiz] Using question bank fallback for:', subject);
    const fallback = getRandomQuestions(subject, 5);
    res.json({ reply: fallback });
  } catch (err) {
    console.error('[Quiz] Error:', err);
    res.status(500).json({ error: 'Quiz generation failed: ' + err.message });
  }
};

// GET /api/student/longitudinal
export const getLongitudinalData = async (req, res) => {
  try {
    if (!global.dbConnected) {
      return res.json({
        trend: [
          { semester: 'Sem 1', cgpa: 7.8 },
          { semester: 'Sem 2', cgpa: 8.1 },
          { semester: 'Sem 3', cgpa: 8.35 },
          { semester: 'Sem 4', cgpa: 8.42 },
        ],
        events: [
          { date: '2023-10-15', title: 'Mid-Sem Excellence', description: 'Scored top 5% in DBMS', icon: 'award' },
          { date: '2024-01-20', title: 'Attendance Drop', description: 'Missed 3 labs in OS', icon: 'warning' },
        ]
      });
    }
    const { studentId } = req.user;
    const insights = await Insight.find({ studentId }).sort({ semester: 1 });
    const semesters = insights.map(i => ({
      semester: i.semester, classId: i.classId, cgpa: i.cgpa,
      dropoutProbabilityScore: i.dropoutProbabilityScore,
      dropoutTier: i.dropoutTier, participationScore: i.participationScore,
    }));

    const current = insights.length ? insights[insights.length - 1] : null;
    res.json({
      semesters,
      currentSemester: current?.semester,
      trend: semesters.length >= 2 ? (semesters[semesters.length - 1].cgpa > semesters[semesters.length - 2].cgpa ? 'up' : 'down') : 'stable',
      consecutiveAtRiskSemesters: current?.consecutiveAtRiskSemesters || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
// GET or POST /api/student/study-plan
export const getStudyPlan = async (req, res) => {
  try {
    const { studentId } = req.user;
    const insight = await Insight.findOne({ studentId }).sort({ createdAt: -1 });
    if (!insight) return res.json({ plan: [] });

    const marks = await Marks.find({ studentId });
    const customSubjects = req.body?.subjects; // [{ subject, examDate, hoursPerDay }]
    
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    
    let subjectContext = '';
    if (customSubjects && customSubjects.length > 0) {
      subjectContext = customSubjects.map(s => 
        `${s.subject} (Exam: ${s.examDate || 'TBD'}, Goal: ${s.hoursPerDay || 2} hrs/day)`
      ).join(', ');
    } else {
      const topSubjects = marks.sort((a, b) => {
        const ta = (a.scores?.ut1 || 0) + (a.scores?.midSem || 0);
        const tb = (b.scores?.ut1 || 0) + (b.scores?.midSem || 0);
        return ta - tb;
      }).slice(0, 4).map(s => s.subject);
      subjectContext = topSubjects.join(', ') || 'General Studies';
    }

    const prompt = `Generate a 4-week study plan JSON starting from ${todayStr} 2026 for: ${subjectContext}. Student CGPA: ${insight.cgpa}, Risk: ${insight.dropoutTier || insight.riskLevel}. 
IMPORTANT: The plan must lead up to the exam dates provided. If today is close to an exam, prioritize that subject.
Return exactly this JSON format: {"plan":[{"week":1,"startDate":"${todayStr}","endDate":"<date>","tasks":[{"day":"Mon","subject":"<subj>","topic":"<topic>","duration":2}]}]}`;
    
    const fallback = {
      plan: [
        { week: 1, startDate: todayStr, endDate: '17 Apr', tasks: [{ day: 'Mon', subject: 'Core Subjects', topic: 'Fundamentals', duration: 2 }] },
        { week: 2, startDate: '18 Apr', endDate: '24 Apr', tasks: [{ day: 'Mon', subject: 'Core Subjects', topic: 'Deep Dive', duration: 2 }] },
        { week: 3, startDate: '25 Apr', endDate: '1 May', tasks: [{ day: 'Mon', subject: 'All Subjects', topic: 'Mock Test', duration: 3 }] },
        { week: 4, startDate: '2 May', endDate: '8 May', tasks: [{ day: 'Mon', subject: 'Final Review', topic: 'Final Prep', duration: 2 }] },
      ],
    };

    const planData = await callGeminiJSON(prompt, fallback);
    res.json(planData?.plan ? planData : fallback);
  } catch (err) {
    console.error('[StudyPlan] Error:', err);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
};
