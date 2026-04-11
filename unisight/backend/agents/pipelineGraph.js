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

let ioInstance = null;
export function setIO(io) { ioInstance = io; }

const transporter = {
  sendMail: async () => {}
};

// Agent 1: Column Normaliser
function normaliseColumns(rawRows) {
  if (!rawRows.length) throw new Error('CSV is empty');

  // Rule-based mapping — covers all common CSV header variants
  const RULES = [
    { keys: ['roll no', 'roll_no', 'rollno', 'student id', 'student_id', 'studentid', 'id', 'regno', 'reg no'], target: 'studentId' },
    { keys: ['name', 'student name', 'student_name', 'full name', 'fullname'], target: 'name' },
    { keys: ['subject', 'subject name', 'course', 'paper'], target: 'subject' },
    { keys: ['ut1', 'unit test 1', 'unit_test_1', 'ut-1', 'ut 1', 'test1', 'test 1', 'ia1', 'ia 1'], target: 'ut1' },
    { keys: ['midsem', 'mid sem', 'mid-sem', 'midterm', 'mid term', 'mid semester', 'mid-semester', 'midexam'], target: 'midSem' },
    { keys: ['ut2', 'unit test 2', 'unit_test_2', 'ut-2', 'ut 2', 'test2', 'test 2', 'ia2', 'ia 2'], target: 'ut2' },
    { keys: ['endsem', 'end sem', 'end-sem', 'endterm', 'end term', 'end semester', 'final', 'final exam', 'semester exam'], target: 'endSem' },
    { keys: ['attendance %', 'attendance%', 'att %', 'att%', 'attendance percent', 'attendance percentage', 'overall attendance'], target: 'attendancePct' },
    { keys: ['attended', 'classes attended', 'attendance attended', 'present'], target: 'attendanceAttended' },
    { keys: ['total classes', 'total', 'attendance total', 'classes held'], target: 'attendanceTotal' },
    { keys: ['activity score', 'overall activity', 'participation', 'participation score', 'activity'], target: 'overallActivityScore' },
  ];

  const headers = Object.keys(rawRows[0]);

  // Build mapping: original header → standardised field
  const mapping = {};
  for (const header of headers) {
    const lh = header.toLowerCase().trim();
    for (const rule of RULES) {
      if (rule.keys.includes(lh)) {
        mapping[header] = rule.target;
        break;
      }
    }
  }

  return rawRows.map(row => {
    const norm = {};
    for (const [original, standardised] of Object.entries(mapping)) {
      if (row[original] !== undefined) norm[standardised] = row[original];
    }
    // If attendancePct is present but attendanceAttended/Total are not, derive them
    if (norm.attendancePct !== undefined && norm.attendanceAttended === undefined) {
      norm.attendanceAttended = Math.round((Number(norm.attendancePct) / 100) * 24);
      norm.attendanceTotal = 24;
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
    const totalScore = (Number(row.ut1)||0) + (Number(row.midSem)||0) +
                       (Number(row.ut2)||0) + (Number(row.endSem)||0);
    const attendancePct = row.attendanceTotal > 0
      ? (Number(row.attendanceAttended) / Number(row.attendanceTotal)) * 100
      : null;
    studentMap[id].subjects.push({
      subject: row.subject || 'Unknown',
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

  for (const student of ranked) {
    const subjectSummary = student.subjects.map(s =>
      `${s.subject}: score ${s.totalScore}/160, attendance ${s.attendancePct}%`
    ).join('; ');

    const prompt = `
You are an academic advisor AI for a university student.

Student data:
- Current dropout probability: ${student.dropoutProbabilityScore}/100 (${student.dropoutTier} tier)
- Average score: ${student.avgScore}/160
- Average attendance: ${student.avgAttendance}%
- Participation score: ${student.participationScore || 'not available'}
- Consecutive at-risk semesters: ${student.consecutiveAtRiskSemesters}
- Subjects: ${subjectSummary}
${student.consecutiveAtRiskSemesters > 0
  ? `- IMPORTANT: This student has been at MEDIUM or higher risk for ${student.consecutiveAtRiskSemesters} consecutive semester(s). This is a pattern, not a one-off.`
  : ''}

Return ONLY a JSON object with these EXACT fields:
{
  "riskReason": "One specific sentence explaining their dropout probability score. Mention which signals (attendance, marks, participation) are driving it.",
  "recommendations": [
    {
      "title": "Action title (5 words max)",
      "description": "Specific action in 15 words. Mention subject name.",
      "priority": "HIGH"
    },
    { "title": "...", "description": "...", "priority": "MEDIUM" },
    { "title": "...", "description": "...", "priority": "LOW" }
  ],
  "resources": [
    { "subject": "Maths", "resource": "Specific Named YouTube Playlist or Book", "type": "video" }
  ],
  "cgpa": 7.2
}

RULES:
1. Return ONLY the JSON object.
2. NO comments (// or /*) inside JSON.
3. NO trailing commas.

Resources: suggest ONE specific named resource per weak subject (YouTube channel name, book name + chapter, or website URL). Only include subjects where score is below 60.
`;

    let aiOutput;
    try {
      aiOutput = await callGeminiJSON(prompt);
    } catch {
      aiOutput = {
        riskReason: `Risk level ${student.dropoutTier} based on score and attendance analysis.`,
        recommendations: [
          { title: 'Attend classes regularly', description: 'Aim for above 75% attendance in all subjects.', priority: 'HIGH' },
          { title: 'Revise weak subjects', description: 'Focus on subjects where score is below 40.', priority: 'MEDIUM' },
        ],
        resources: [],
        cgpa: parseFloat((student.avgScore / 16).toFixed(1)),
      };
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
        riskLevel: student.dropoutTier, // retro-compat
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
        user: userDoc._id,
        type: ['HIGH','CRITICAL'].includes(student.dropoutTier) ? 'warning' : 'info',
        title: 'New AI Insights Generated',
        message: `Your marks for ${classId} were processed. Your current tier is ${student.dropoutTier}.`,
      });

      const prevInterventions = await Intervention.find({ studentId: student.studentId, status: 'pending' });
      for (const inv of prevInterventions) {
        inv.status = 'resolved';
        inv.riskAfter = student.dropoutTier;
        inv.resolvedAt = new Date();
        if (student.dropoutTier === 'LOW' && inv.riskAtSend !== 'LOW') inv.outcome = 'improved';
        else if (student.dropoutTier === 'CRITICAL' && inv.riskAtSend !== 'CRITICAL') inv.outcome = 'worsened';
        else inv.outcome = 'unchanged';
        await inv.save();
      }

      const goal = await StudentGoal.findOne({ studentId: student.studentId });
      if (goal) {
        goal.currentCgpa = aiOutput.cgpa;
        goal.onTrack = aiOutput.cgpa >= goal.targetCgpa;
        await goal.save();
      }

      // ST004 Auto-Alert for CRITICAL tier
      if (student.dropoutTier === 'CRITICAL') {
        const facultyUser = await User.findById(facultyId);
        if (facultyUser) {
          // Internal intervention log
          await Intervention.create({
            studentId: student.studentId,
            facultyId: facultyId,
            alertId: null,
            classId,
            riskAtSend: 'CRITICAL',
            sentAt: new Date(),
            outcome: 'pending',
            autoTriggered: true,
          });

          await Notification.create({
            user: facultyId,
            type: 'system',
            title: `Auto-alert sent to ${userDoc.name}`,
            message: `${userDoc.name} reached CRITICAL dropout probability (${student.dropoutProbabilityScore}%). An alert was automatically generated.`,
            metadata: { studentId: student.studentId, score: student.dropoutProbabilityScore },
          });

          // ST004 Parent Email Logic
          const parentContact = await ParentContact.findOne({ studentId: student.studentId, isActive: true });
          if (parentContact) {
            try {
              await transporter.sendMail({
                from: `"UniSight Academic Alerts" <${process.env.EMAIL_USER}>`,
                to: parentContact.parentEmail,
                subject: `Academic update for ${userDoc.name} — Action needed`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
                    <h2 style="color:#7C3AED">UniSight Academic Alert</h2>
                    <p>Dear ${parentContact.parentName},</p>
                    <p>This is an automated update for <strong>${userDoc.name}</strong>.</p>
                    <p>Their current academic risk has reached a critical level (Probability: ${student.dropoutProbabilityScore}%).</p>
                    <ul>
                      ${aiOutput.recommendations.slice(0,2).map(r => `<li>${r.title}: ${r.description}</li>`).join('')}
                    </ul>
                    <p>Please encourage them to speak with their faculty advisor.</p>
                    <p style="color:#999;font-size:12px">Sent by UniSight. Student controls this notification setting.</p>
                  </div>
                `
              });
              await ParentContact.findOneAndUpdate(
                { studentId: student.studentId },
                { lastDigestSent: new Date(), $inc: { digestCount: 1 } }
              );
            } catch (err) {
              console.error("Failed to send parent email", err);
            }
          }
        }
      }
    }

    savedInsights.push(insight);
  }
  return savedInsights;
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
    await runTeacherEffectivenessAgent({ facultyId, classId, department, semester, students: riskData });
    emit('Teaching Analyser', 'complete');

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
