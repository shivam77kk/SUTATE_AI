import Marks from '../models/Marks.js';
import Attendance from '../models/Attendance.js';
import Insight from '../models/Insight.js';
import UploadLog from '../models/UploadLog.js';
import Notification from '../models/Notification.js';
import Intervention from '../models/Intervention.js';
import StudentGoal from '../models/StudentGoal.js';
import User from '../models/User.js';
import ParentContact from '../models/ParentContact.js';
// import nodemailer from 'nodemailer';
import { callGeminiJSON } from './geminiService.js';
import { runTeacherEffectivenessAgent } from './teacherEffectivenessAgent.js';
import PQueue from 'p-queue';

let ioInstance = null;
export function setIO(io) { ioInstance = io; }

const transporter = {
  sendMail: async () => {}
};

// Agent 1: Column Normaliser
function normaliseColumns(rawRows) {
  if (!rawRows.length) throw new Error('CSV is empty');

  const RULES = [
    { keys: ['roll no', 'roll_no', 'rollno', 'student id', 'student_id', 'studentid', 'id', 'regno', 'reg no', 'enrolment', 'enrollment'], target: 'studentId' },
    { keys: ['name', 'student name', 'student_name', 'full name', 'fullname'], target: 'name' },
    { keys: ['subject', 'subject name', 'course', 'paper'], target: 'subject' },
    { keys: ['ut1', 'unit test 1', 'unit_test_1', 'ut-1', 'ut 1', 'test1', 'test 1', 'ia1', 'ia 1'], target: 'ut1' },
    { keys: ['midsem', 'mid sem', 'mid-sem', 'midterm', 'mid term', 'mid semester', 'mid-semester', 'midexam', 'mid'], target: 'midSem' },
    { keys: ['ut2', 'unit test 2', 'unit_test_2', 'ut-2', 'ut 2', 'test2', 'test 2', 'ia2', 'ia 2'], target: 'ut2' },
    { keys: ['endsem', 'end sem', 'end-sem', 'endterm', 'end term', 'end semester', 'final', 'final exam', 'semester exam', 'total marks', 'total_marks'], target: 'endSem' },
    { keys: ['attendance %', 'attendance%', 'att %', 'att%', 'attendance percent', 'attendance percentage', 'overall attendance', 'attendance'], target: 'attendancePct' },
    { keys: ['attended', 'classes attended', 'attendance attended', 'present'], target: 'attendanceAttended' },
    { keys: ['total classes', 'total', 'attendance total', 'classes held', 'max attendance'], target: 'attendanceTotal' },
    { keys: ['activity score', 'overall activity', 'participation', 'participation score', 'activity'], target: 'overallActivityScore' },
  ];

  const headers = Object.keys(rawRows[0]);
  const mapping = {};
  const mappedOriginals = new Set();

  for (const header of headers) {
    const lh = header.toLowerCase().trim();
    for (const rule of RULES) {
      if (rule.keys.includes(lh)) {
        mapping[header] = rule.target;
        mappedOriginals.add(header);
        break;
      }
    }
  }

  return rawRows.map(row => {
    const norm = { _unmapped: {} };
    // Map standard fields
    for (const [original, standardised] of Object.entries(mapping)) {
      if (row[original] !== undefined) norm[standardised] = row[original];
    }
    // Collect unmapped numeric/potential subject data
    for (const header of headers) {
      if (!mappedOriginals.has(header)) {
        norm._unmapped[header] = row[header];
      }
    }
    // Derive attendance if only Pct is provided
    if (norm.attendancePct !== undefined && norm.attendanceAttended === undefined) {
      const pct = parseFloat(norm.attendancePct);
      if (!isNaN(pct)) {
        norm.attendanceAttended = Math.round((pct / 100) * 24);
        norm.attendanceTotal = 24;
      }
    }
    return norm;
  });
}

// Agent 2: Performance Analyser
function analysePerformance(normRows) {
  const studentMap = {};
  for (const row of normRows) {
    const id = String(row.studentId || '').trim();
    if (!id) continue;
    if (!studentMap[id]) studentMap[id] = { studentId: id, name: row.name || id, subjects: [] };

    // Standard Long Format (Subject per row)
    if (row.subject) {
      const totalScore = (Number(row.ut1)||0) + (Number(row.midSem)||0) +
                         (Number(row.ut2)||0) + (Number(row.endSem)||0);
      const attendancePct = row.attendanceTotal > 0
        ? (Number(row.attendanceAttended) / Number(row.attendanceTotal)) * 100
        : null;
      
      studentMap[id].subjects.push({
        subject: row.subject,
        scores: {
          ut1: Number(row.ut1) || null,
          midSem: Number(row.midSem) || null,
          ut2: Number(row.ut2) || null,
          endSem: Number(row.endSem) || null,
        },
        totalScore,
        attendanceAttended: Number(row.attendanceAttended) || 0,
        attendanceTotal: Number(row.attendanceTotal) || 0,
        attendancePct: attendancePct ? Math.round(attendancePct) : null,
        overallActivityScore: row.overallActivityScore !== undefined ? Number(row.overallActivityScore) : null,
      });
    } 
    // Wide Format (Multiple subjects as columns)
    else {
      for (const [key, value] of Object.entries(row._unmapped || {})) {
        const score = Number(value);
        // If it's a number and not obviously a metadata column
        if (!isNaN(score) && !['semester', 'year', 'sem', 'id', 'classid', 'batch'].includes(key.toLowerCase())) {
          studentMap[id].subjects.push({
            subject: key,
            scores: { ut1: 0, midSem: 0, ut2: 0, endSem: score },
            totalScore: score,
            attendanceAttended: row.attendanceAttended || 20,
            attendanceTotal: row.attendanceTotal || 24,
            attendancePct: row.attendancePct ? Math.round(Number(row.attendancePct)) : 85,
          });
        }
      }
    }
  }

  return Object.values(studentMap).map(student => {
    const scores = student.subjects.map(s => s.totalScore).filter(s => s > 0);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const allAttendance = student.subjects.map(s => s.attendancePct).filter(a => a !== null);
    const avgAttendance = allAttendance.length
      ? allAttendance.reduce((a, b) => a + b, 0) / allAttendance.length : 0;

    const activityScores = student.subjects.map(s => s.overallActivityScore).filter(a => a !== null);
    const avgParticipationScore = activityScores.length
      ? Math.round(activityScores.reduce((a, b) => a + b, 0) / activityScores.length)
      : null;

    return { 
      ...student, 
      avgScore: Math.round(avgScore), 
      avgAttendance: Math.round(avgAttendance),
      avgParticipationScore
    };
  });
}

// Agent 3: Dropout Probability
async function computeDropoutProbability(students, classId, attendanceThreshold = 75, passingScoreThreshold = 40) {
  const results = [];
  for (const student of students) {
    const attendanceScore = student.avgAttendance >= 85 ? 0
      : student.avgAttendance >= 75 ? 10
      : student.avgAttendance >= 65 ? 18
      : student.avgAttendance >= 55 ? 22
      : 25;

    const scores = student.subjects.map(s => s.totalScore).filter(s => s > 0);
    const avgScore = scores.length ? scores.reduce((a,b) => a+b, 0) / scores.length : 0;
    const marksScore = avgScore >= 80 ? 0
      : avgScore >= 60 ? 5
      : avgScore >= passingScoreThreshold ? 12
      : avgScore >= 30 ? 18
      : 20;

    const participationScore = student.avgParticipationScore !== null
      ? (student.avgParticipationScore < 40 ? 20
        : student.avgParticipationScore < 60 ? 14
        : student.avgParticipationScore < 75 ? 8
        : 0)
      : 0;

    const prevInsight = await Insight.findOne({ studentId: student.studentId })
      .sort({ createdAt: -1 }).select('consecutiveAtRiskSemesters dropoutTier');
    const prevConsecutive = prevInsight?.consecutiveAtRiskSemesters || 0;
    const wasAtRisk = prevInsight && ['MEDIUM','HIGH','CRITICAL'].includes(prevInsight.dropoutTier);
    const newConsecutive = wasAtRisk ? prevConsecutive + 1 : 0;
    const consecutiveScore = newConsecutive === 0 ? 0
      : newConsecutive === 1 ? 8
      : newConsecutive === 2 ? 14
      : 20;

    const failedSubjects = student.subjects.filter(s => s.totalScore > 0 && s.totalScore < passingScoreThreshold).length;
    const failedScore = failedSubjects === 0 ? 0
      : failedSubjects === 1 ? 5
      : failedSubjects === 2 ? 10
      : 15;

    const dropoutProbabilityScore = Math.min(100, attendanceScore + marksScore + participationScore + consecutiveScore + failedScore);

    const dropoutTier = dropoutProbabilityScore >= 81 ? 'CRITICAL'
      : dropoutProbabilityScore >= 61 ? 'HIGH'
      : dropoutProbabilityScore >= 31 ? 'MEDIUM'
      : 'LOW';

    const predictedMin = Math.max(0, avgScore - 10);
    const predictedMax = Math.min(100, avgScore + 10);

    results.push({
      ...student,
      dropoutProbabilityScore,
      dropoutTier,
      riskLevel: dropoutTier,
      consecutiveAtRiskSemesters: newConsecutive,
      participationScore: student.avgParticipationScore || null,
      predictedScore: { min: predictedMin, max: predictedMax },
    });
  }
  return results;
}

// Agent 4: Recommendation Engine
async function generateRecommendations(students, classId, department, semester, facultyId) {
  const savedInsights = [];
  const ranked = [...students].sort((a, b) => b.avgScore - a.avgScore);
  const numStudents = ranked.length;

  for (let i = 0; i < numStudents; i++) {
    ranked[i].classRank = i + 1;
    ranked[i].classPercentile = Math.round(((numStudents - i) / numStudents) * 100);
    
    const badges = [];
    if (ranked[i].avgAttendance >= 95) badges.push({ id: 1, name: 'Attendance Pro', icon: 'Star', color: '#10b981', desc: '>=95% overall attendance' });
    if (ranked[i].classRank <= Math.ceil(numStudents * 0.1)) badges.push({ id: 2, name: 'Top 10%', icon: 'Award', color: '#f59e0b', desc: 'In top 10% of class' });
    if (ranked[i].avgScore >= 120) badges.push({ id: 3, name: 'High Achiever', icon: 'Zap', color: '#6366f1', desc: 'Score > 120/160' });
    ranked[i].badges = badges;
  }

  const queue = new PQueue({ concurrency: 3 });

  const processStudent = async (student) => {
    const isAtRisk = ['MEDIUM', 'HIGH', 'CRITICAL'].includes(student.dropoutTier);
    let aiOutput;

    if (!isAtRisk) {
      // Standardized high-quality template for LOW risk students (Saves API calls)
      aiOutput = {
        riskReason: "All academic parameters (attendance and marks) are within optimal ranges.",
        recommendations: [
          { title: "Maintain current momentum", description: "Keep up the excellent consistency in classes and assignments.", priority: "LOW" },
          { title: "Explore advanced topics", description: "Given the stable performance, consider participating in specialized workshops.", priority: "LOW" }
        ],
        resources: [],
        cgpa: parseFloat((student.avgScore / 16).toFixed(1)) || 8.0,
      };
    } else {
      const subjectSummary = student.subjects.map(s =>
        `${s.subject}: score ${s.totalScore}/160, attendance ${s.attendancePct}%`
      ).join('; ');

      const prompt = `
You are an academic advisor AI. Return ONLY a JSON object for a student with these fields:
- riskReason (1 sentence)
- recommendations (Array of 3: title, description, priority)
- resources (Array: subject, resource, type)
- cgpa (Number)

Student data:
- Risk: ${student.dropoutProbabilityScore}/100 (${student.dropoutTier} tier)
- Avg Score: ${student.avgScore}/160
- Avg Attendance: ${student.avgAttendance}%
- Subjects: ${subjectSummary}
`;
      try {
        aiOutput = await callGeminiJSON(prompt);
      } catch {
        aiOutput = {
          riskReason: `Identified ${student.dropoutTier} risk due to academic inconsistencies.`,
          recommendations: [
            { title: 'Urgent subject review', description: 'Immediate focus required on subjects with scores below 40.', priority: 'HIGH' },
            { title: 'Attendance improvement', description: 'Consult with faculty to resolve low attendance patterns.', priority: 'MEDIUM' },
          ],
          resources: [],
          cgpa: parseFloat((student.avgScore / 16).toFixed(1)) || 5.0,
        };
      }
    }

    const insight = await Insight.findOneAndUpdate(
      { studentId: student.studentId, classId },
      {
        studentId: student.studentId,
        classId, department, semester,
        cgpa: aiOutput.cgpa,
        predictedScore: student.predictedScore,
        classRank: student.classRank,
        classPercentile: student.classPercentile,
        badges: student.badges,
        riskLevel: student.dropoutTier,
        riskReason: aiOutput.riskReason,
        recommendations: aiOutput.recommendations,
        dropoutProbabilityScore: student.dropoutProbabilityScore,
        dropoutTier: student.dropoutTier,
        participationScore: student.participationScore,
        consecutiveAtRiskSemesters: student.consecutiveAtRiskSemesters,
        resources: aiOutput.resources,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    for (const sub of student.subjects) {
      await Marks.findOneAndUpdate(
        { studentId: student.studentId, classId, subject: sub.subject },
        { studentId: student.studentId, classId, subject: sub.subject, department, semester, scores: sub.scores, uploadedBy: facultyId },
        { upsert: true, new: true }
      );
      if (sub.attendanceTotal > 0) {
        await Attendance.findOneAndUpdate(
          { studentId: student.studentId, classId, subject: sub.subject },
          { studentId: student.studentId, classId, subject: sub.subject, department, semester, attended: sub.attendanceAttended, total: sub.attendanceTotal, percentage: sub.attendancePct },
          { upsert: true, new: true }
        );
      }
    }

    const userDoc = await User.findOne({ studentId: student.studentId });
    if (userDoc) {
      await Notification.create({
        userId: userDoc._id,
        type: isAtRisk ? 'warning' : 'info',
        title: 'New AI Insights Generated',
        message: `Your results were processed. Your academic tier is ${student.dropoutTier}.`,
      });

      if (student.dropoutTier === 'CRITICAL') {
        const facultyUser = await User.findById(facultyId);
        if (facultyUser) {
          await Intervention.create({
            studentId: student.studentId, facultyId, classId,
            riskAtSend: 'CRITICAL', sentAt: new Date(), outcome: 'pending', autoTriggered: true,
          });

          await Notification.create({
            userId: facultyId,
            type: 'system',
            title: `Critical Alert: ${userDoc.name}`,
            message: `${userDoc.name} reached CRITICAL dropout risk level.`,
            metadata: { studentId: student.studentId },
          });
        }
      }
    }

    return insight;
  };

  const tasks = ranked.map(student => () => processStudent(student));
  const results = await queue.addAll(tasks);
  return results;
}

// Main pipeline runner
export async function runPipeline({ csvRows, uploadId, classId, department, semester, facultyId }) {
  const startTime = Date.now();
  const emit = (agent, status) => {
    if (ioInstance) ioInstance.to(uploadId).emit('agent:update', { agent, status });
  };

  try {
    emit('Column Normaliser', 'running');
    const normRows = await normaliseColumns(csvRows);
    emit('Column Normaliser', 'complete');

    emit('Performance Analyser', 'running');
    const perfData = analysePerformance(normRows);
    emit('Performance Analyser', 'complete');

    emit('Risk Detector', 'running');
    const riskData = await computeDropoutProbability(perfData, classId, 75, 40);
    emit('Risk Detector', 'complete');

    emit('Recommendation Engine', 'running');
    const insights = await generateRecommendations(riskData, classId, department, semester, facultyId);
    emit('Recommendation Engine', 'complete');

    // ST004: Agent 5 Teaching Analyser
    emit('Teaching Analyser', 'running');
    try {
      await runTeacherEffectivenessAgent({ facultyId, classId, department, semester, students: riskData });
      emit('Teaching Analyser', 'complete');
    } catch (teacherErr) {
      console.warn('[Pipeline] Teaching Analyser failed (non-fatal):', teacherErr.message);
      emit('Teaching Analyser', 'skipped');
    }

    const durationMs = Date.now() - startTime;
    const studentCount = insights.length;
    const pendingAlerts = riskData.filter(s => s.dropoutTier !== 'LOW').map(s => s.studentId);

    await UploadLog.findOneAndUpdate(
      { uploadId },
      { status: 'complete', studentCount, durationMs, pendingAlerts },
      { new: true }
    );

    if (ioInstance) ioInstance.to(uploadId).emit('analysis:complete', { uploadId, studentCount, durationMs });
    return { insights, studentCount, durationMs, pendingAlerts };
  } catch (err) {
    await UploadLog.findOneAndUpdate({ uploadId }, { status: 'error', errorMessage: err.message });
    if (ioInstance) ioInstance.to(uploadId).emit('analysis:error', { message: err.message });
    throw err;
  }
}
