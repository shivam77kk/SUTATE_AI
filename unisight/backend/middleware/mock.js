import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'unisight_super_secret_key_2024';
const CORS_ORIGIN = process.env.CLIENT_URL || 'http://localhost:3001';

// ─── Mock Users ───────────────────────────────────────────────────────────
const MOCK_USERS = {
  'shivam77@gmail.com':   { _id: 'admin1', name: 'Shivam', password: '9082249120', role: 'admin', department: 'University', studentId: null, email: 'shivam77@gmail.com' },
  'prof.sharma@cse.edu': { _id: 'fac1', name: 'Prof. Sharma', password: 'faculty123', role: 'faculty', department: 'CSE', studentId: null, email: 'prof.sharma@cse.edu' },
  'riya.shah@student.edu':  { _id: 'stu1', name: 'Riya Shah', password: 'student123', role: 'student', department: 'CSE', studentId: 'S001', email: 'riya.shah@student.edu' },
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie');
}

function sendJSON(res, data, status = 200) {
  setCors(res);
  res.status(status).json(data);
}

// ─── Mock Insight Data ────────────────────────────────────────────────────
const MOCK_INSIGHT = {
  riskLevel: 'MEDIUM',
  riskReason: 'DBMS and OS attendance below 75%. UT1 scores need improvement.',
  cgpa: 6.8,
  classRank: 14,
  predictedScore: { min: 65, max: 74 },
  recommendations: [
    { priority: 'HIGH', title: 'Attend DBMS lectures', description: 'Your DBMS attendance is 68% — below the 75% threshold. Missing more classes may result in exam debarment.' },
    { priority: 'HIGH', title: 'Improve OS scores', description: 'OS UT1 score is 12/30. Focus on process management and memory management chapters.' },
    { priority: 'MEDIUM', title: 'Practice DBMS queries', description: 'Solve past exam papers for SQL normalization and ER diagrams to boost your endSem score.' },
    { priority: 'LOW', title: 'Study group participation', description: 'Join the CSE study group that meets on Wednesdays to improve collaborative learning.' },
  ],
};

const MOCK_MARKS_TREND = {
  subjects: ['DBMS', 'OS', 'CN', 'MATHS'],
  data: [
    { exam: 'UT1', DBMS: 54, OS: 40, CN: 67, MATHS: 73 },
    { exam: 'MidSem', DBMS: 60, OS: 53, CN: 71, MATHS: 80 },
    { exam: 'UT2', DBMS: 63, OS: 60, CN: 75, MATHS: 83 },
    { exam: 'EndSem', DBMS: 58, OS: 55, CN: 68, MATHS: 77 },
  ],
};

const MOCK_ATTENDANCE = {
  subjects: [
    { subject: 'DBMS', attended: 22, total: 32, percentage: 68, status: 'danger' },
    { subject: 'OS',   attended: 24, total: 32, percentage: 75, status: 'warning' },
    { subject: 'CN',   attended: 28, total: 32, percentage: 87, status: 'safe' },
    { subject: 'MATHS',attended: 30, total: 32, percentage: 93, status: 'safe' },
  ],
};

const MOCK_RADAR = {
  data: [
    { subject: 'DBMS', score: 59 },
    { subject: 'OS',   score: 52 },
    { subject: 'CN',   score: 70 },
    { subject: 'MATHS',score: 78 },
  ],
};

const MOCK_TIMELINE = {
  events: [
    { event: 'DBMS Attendance Warning Issued', date: '2024-02-10', severity: 'danger' },
    { event: 'UT1 Low Score Alert — OS (12/30)', date: '2024-01-25', severity: 'warning' },
    { event: 'Mid Semester Exam Completed', date: '2024-02-20', severity: 'info' },
    { event: 'Attendance recovered to 75% in OS', date: '2024-03-01', severity: 'success' },
    { event: 'UT2 Completed — improving trend detected', date: '2024-03-10', severity: 'success' },
  ],
};

const MOCK_AT_RISK = [
  { studentId: 'S001', name: 'Rahul Verma', riskLevel: 'HIGH', riskReason: 'DBMS attendance 68%, UT scores poor', avgScore: 54, avgAttendance: 68, classId: 'CSE_SEM4_2024' },
  { studentId: 'S002', name: 'Priya Kapoor', riskLevel: 'MEDIUM', riskReason: 'OS score declining trend', avgScore: 62, avgAttendance: 76, classId: 'CSE_SEM4_2024' },
  { studentId: 'S003', name: 'Amit Singh', riskLevel: 'HIGH', riskReason: 'Multiple attendance shortages', avgScore: 48, avgAttendance: 58, classId: 'CSE_SEM4_2024' },
];

const MOCK_USERS_LIST = Object.values(MOCK_USERS).map(u => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  studentId: u.studentId,
}));

// ─── Middleware ────────────────────────────────────────────────────────────
export function mockMiddleware(req, res, next) {
  // If DB is connected, use real controllers
  if (global.dbConnected) return next();

  const { method, path: p } = req;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }

  // ─── AUTH ────────────────────────────────────────────────────────────
  if (p === '/auth/login' && method === 'POST') {
    const { email, password } = req.body || {};
    const user = MOCK_USERS[email?.toLowerCase()];
    if (!user || password !== user.password) {
      return sendJSON(res, { error: 'Invalid email or password' }, 401);
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, department: user.department, studentId: user.studentId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000, sameSite: 'lax' });
    setCors(res);
    return res.json({
      message: 'Login successful',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, studentId: user.studentId },
      token,
    });
  }

  if (p === '/auth/me' && method === 'GET') {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return sendJSON(res, { error: 'Not authenticated' }, 401);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = Object.values(MOCK_USERS).find(u => u._id === decoded.userId);
      if (!user) return sendJSON(res, { error: 'User not found' }, 404);
      return sendJSON(res, { user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, studentId: user.studentId } });
    } catch { return sendJSON(res, { error: 'Invalid token' }, 401); }
  }

  if (p === '/auth/logout' && method === 'POST') {
    res.clearCookie('token');
    return sendJSON(res, { message: 'Logged out' });
  }

  // ─── STUDENT ─────────────────────────────────────────────────────────
  if (p === '/student/me' && method === 'GET') {
    return sendJSON(res, { student: { name: 'Rahul Verma', email: 'student001@unisight.edu', role: 'student', department: 'CSE', studentId: 'S001' } });
  }

  if (p === '/student/dashboard' && method === 'GET') {
    return sendJSON(res, {
      kpi: { cgpa: 6.8, classRank: 14, predictedScore: { min: 65, max: 74 }, riskLevel: 'MEDIUM' },
    });
  }

  if (p === '/student/marks-trend' && method === 'GET') {
    return sendJSON(res, MOCK_MARKS_TREND);
  }

  if (p === '/student/radar' && method === 'GET') {
    return sendJSON(res, MOCK_RADAR);
  }

  if (p === '/student/attendance' && method === 'GET') {
    return sendJSON(res, MOCK_ATTENDANCE);
  }

  if (p === '/student/insights' && method === 'GET') {
    return sendJSON(res, MOCK_INSIGHT);
  }

  if (p === '/student/timeline' && method === 'GET') {
    return sendJSON(res, MOCK_TIMELINE);
  }

  if (p === '/student/report/pdf' && method === 'GET') {
    setCors(res);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    // Return a minimal placeholder PDF bytes
    return res.status(200).send(Buffer.from('%PDF-1.4 placeholder'));
  }

  if (p === '/student/chat' && method === 'POST') {
    const { message } = req.body || {};
    const replies = [
      `Based on your marks and attendance, ${message?.includes('CGPA') ? 'your current CGPA is 6.8. To improve, focus on DBMS and OS which are your weakest subjects.' : 'I recommend focusing on DBMS attendance and OS scores first.'}`,
      'Your attendance in DBMS is 68% which is below the 75% threshold. You need to attend at least 4 more classes to avoid debarment.',
      'For your predicted score range of 65-74%, you should aim to score at least 55/70 in your end-semester exam.',
      'The AI analysis shows you are at MEDIUM risk. Improving your DBMS and OS scores by 10% would move you to LOW risk.',
    ];
    return sendJSON(res, { reply: replies[Math.floor(Math.random() * replies.length)], timestamp: new Date().toISOString() });
  }

  // ─── FACULTY ─────────────────────────────────────────────────────────
  if (p === '/faculty/dashboard' && method === 'GET') {
    return sendJSON(res, {
      latestUploadKpi: { processed: 42, atRiskFound: 8, improvements: 12 },
      recentUploads: [
        { _id: 'ul1', filename: 'CSE_SEM4_marks.csv', date: new Date().toISOString(), status: 'COMPLETED', entries: 42, errors: 0 },
        { _id: 'ul2', filename: 'IT_SEM2_marks.csv', date: new Date(Date.now()-86400000).toISOString(), status: 'COMPLETED', entries: 38, errors: 2 },
      ],
    });
  }

  if (p === '/faculty/pending-alerts' && method === 'GET') {
    return sendJSON(res, { students: MOCK_AT_RISK });
  }

  if (p === '/faculty/classes' && method === 'GET') {
    return sendJSON(res, {
      classes: [
        { classId: 'CSE_SEM4_2024', department: 'CSE', semester: 4, studentCount: 42 },
        { classId: 'CSE_SEM2_2024', department: 'CSE', semester: 2, studentCount: 38 },
        { classId: 'IT_SEM4_2024',  department: 'IT',  semester: 4, studentCount: 35 },
      ],
    });
  }

  if (p === '/faculty/send-alert' && method === 'POST') {
    const { studentId } = req.body || {};
    return sendJSON(res, {
      success: true,
      sentTo: studentId,
      emailDraft: `Subject: Academic Performance Alert\n\nDear Student,\n\nThis is to inform you that your academic performance requires immediate attention. Your current marks and attendance are below the required threshold.\n\nPlease meet with your faculty advisor at the earliest convenience.\n\nRegards,\nFaculty`,
    });
  }

  if (p.startsWith('/faculty/class/') && p.endsWith('/summary') && method === 'GET') {
    return sendJSON(res, {
      kpi: { totalStudents: 42, classAvgScore: 112, passPercent: 78, atRiskCount: 8, belowAttendanceCount: 5 },
      atRiskStudents: MOCK_AT_RISK,
    });
  }

  if (p.startsWith('/faculty/class/') && p.endsWith('/heatmap') && method === 'GET') {
    return sendJSON(res, {
      subjects: ['DBMS', 'OS', 'CN', 'MATHS'],
      data: [
        { studentId: 'S001', name: 'Rahul Verma', DBMS: 59, OS: 52, CN: 70, MATHS: 78, _avg: 65 },
        { studentId: 'S002', name: 'Priya Kapoor', DBMS: 72, OS: 68, CN: 80, MATHS: 85, _avg: 76 },
        { studentId: 'S003', name: 'Amit Singh',   DBMS: 40, OS: 38, CN: 52, MATHS: 55, _avg: 46 },
        { studentId: 'S004', name: 'Neha Gupta',   DBMS: 88, OS: 85, CN: 91, MATHS: 88, _avg: 88 },
      ],
    });
  }

  if (p.startsWith('/faculty/class/') && p.endsWith('/report/pdf') && method === 'GET') {
    setCors(res);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="class-report.pdf"');
    return res.status(200).send(Buffer.from('%PDF-1.4 placeholder'));
  }

  if (p.startsWith('/faculty/student/') && method === 'GET') {
    return sendJSON(res, {
      student: { name: 'Rahul Verma', email: 'student001@unisight.edu', studentId: 'S001', department: 'CSE' },
      marks: [
        { subject: 'DBMS', scores: { ut1: 16, midSem: 19, ut2: 18, endSem: 38 } },
        { subject: 'OS',   scores: { ut1: 12, midSem: 16, ut2: 18, endSem: 33 } },
      ],
      attendance: MOCK_ATTENDANCE.subjects,
      insight: MOCK_INSIGHT,
    });
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────
  if (p === '/admin/overview' && method === 'GET') {
    return sendJSON(res, {
      kpi: { totalStudents: 1240, overallPassPercent: 74, atRiskCount: 87, avgAttendance: 81 },
      departmentComparison: [
        { department: 'CSE',  passPercent: 81 },
        { department: 'IT',   passPercent: 77 },
        { department: 'Mech', passPercent: 68 },
        { department: 'Civil',passPercent: 72 },
      ],
      semesterTrend: [
        { semester: 1, CSE: 85, IT: 80, Mech: 75, Civil: 78 },
        { semester: 2, CSE: 82, IT: 78, Mech: 70, Civil: 74 },
        { semester: 3, CSE: 79, IT: 76, Mech: 68, Civil: 71 },
        { semester: 4, CSE: 81, IT: 77, Mech: 68, Civil: 72 },
      ],
    });
  }

  if (p === '/admin/top-atrisk' && method === 'GET') {
    return sendJSON(res, {
      students: MOCK_AT_RISK.map((s, i) => ({ ...s, rank: i + 1 })),
    });
  }

  if (p === '/admin/trends' && method === 'GET') {
    return sendJSON(res, {
      trend: [
        { month: 'Jan', atRisk: 80, safe: 1120 },
        { month: 'Feb', atRisk: 92, safe: 1108 },
        { month: 'Mar', atRisk: 87, safe: 1153 },
      ],
    });
  }

  if (p === '/admin/report/pdf' && method === 'GET') {
    setCors(res);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="executive-report.pdf"');
    return res.status(200).send(Buffer.from('%PDF-1.4 placeholder'));
  }

  if (p === '/admin/ask' && method === 'POST') {
    const { question } = req.body || {};
    return sendJSON(res, {
      answer: `Based on the university data for question: "${question}", the analysis shows that CSE department has the highest pass rate at 81%, while Mech has the lowest at 68%. A total of 87 students are currently at high risk requiring immediate attention.`,
      title: 'Department Performance Analysis',
      chartType: 'bar',
      xKey: 'department',
      yKey: 'passPercent',
      data: [
        { department: 'CSE', passPercent: 81 },
        { department: 'IT', passPercent: 77 },
        { department: 'Mech', passPercent: 68 },
        { department: 'Civil', passPercent: 72 },
      ],
    });
  }

  if (p === '/admin/ask/history' && method === 'GET') {
    return sendJSON(res, { history: [] });
  }

  if (p === '/admin/users' && method === 'GET') {
    return sendJSON(res, { users: MOCK_USERS_LIST });
  }

  if (p === '/admin/users' && method === 'POST') {
    const { name, email, role } = req.body || {};
    return sendJSON(res, { success: true, user: { _id: 'new_' + Date.now(), name, email, role } }, 201);
  }

  if (p.startsWith('/admin/users/') && method === 'DELETE') {
    return sendJSON(res, { success: true, message: 'User deleted (mock)' });
  }

  // ─── UPLOAD ─────────────────────────────────────────────────────────────
  if (p === '/upload/csv' && method === 'POST') {
    const uploadId = 'mock_' + Date.now();
    return sendJSON(res, { uploadId, message: 'Processing started (mock mode — DB offline)' });
  }

  if (p === '/upload/logs' && method === 'GET') {
    return sendJSON(res, { logs: [] });
  }

  // ─── ALERTS ─────────────────────────────────────────────────────────────
  if (p.startsWith('/alerts') && method === 'GET') {
    return sendJSON(res, { alerts: [] });
  }

  // ─── Health ──────────────────────────────────────────────────────────────
  if (p === '/health' || p === '/mock') {
    return sendJSON(res, {
      status: 'running',
      mode: 'OFFLINE MOCK MODE',
      dbConnected: false,
      message: 'MongoDB not connected. Using static mock data.',
    });
  }

  // Fall through to real route (handles any route not listed above)
  next();
}
