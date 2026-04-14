import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';

import User from '../models/User.js';
import Marks from '../models/Marks.js';
import Attendance from '../models/Attendance.js';
import Insight from '../models/Insight.js';
import Alert from '../models/Alert.js';
import Notification from '../models/Notification.js';
import UploadLog from '../models/UploadLog.js';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const CSE_SUBJECTS = ['Operating Systems', 'DBMS', 'Computer Networks', 'Software Engineering'];
const IT_SUBJECTS = ['Web Technologies', 'Data Structures', 'Computer Architecture', 'Python Programming'];

const cseStudents = [
  { name: 'Riya Shah', email: 'riya.shah@student.edu', studentId: 'S001' },
  { name: 'Priya Patel', email: 'priya.patel@student.edu', studentId: 'S002' },
  { name: 'Rahul Singh', email: 'rahul.singh@student.edu', studentId: 'S003' },
  { name: 'Anjali Desai', email: 'anjali.desai@student.edu', studentId: 'S004' },
  { name: 'Vikram Joshi', email: 'vikram.joshi@student.edu', studentId: 'S005' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@student.edu', studentId: 'S006' },
  { name: 'Pooja Nair', email: 'pooja.nair@student.edu', studentId: 'S007' },
  { name: 'Dev Sharma', email: 'dev.sharma@student.edu', studentId: 'S008' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@student.edu', studentId: 'S009' },
  { name: 'Pooja Verma', email: 'pooja.verma@student.edu', studentId: 'S010' },
  { name: 'Aditya Kumar', email: 'aditya.kumar@student.edu', studentId: 'S011' },
  { name: 'Arjun Mehta', email: 'arjun.mehta@student.edu', studentId: 'S012' },
  { name: 'Nikhil Jain', email: 'nikhil.jain@student.edu', studentId: 'S013' },
  { name: 'Meera Iyer', email: 'meera.iyer@student.edu', studentId: 'S014' },
  { name: 'Suraj Pillai', email: 'suraj.pillai@student.edu', studentId: 'S015' },
];

const itStudents = [
  { name: 'Akash Tiwari', email: 'akash.tiwari@student.edu', studentId: 'T001' },
  { name: 'Ritu Choudhary', email: 'ritu.choudhary@student.edu', studentId: 'T002' },
  { name: 'Sanjay Mishra', email: 'sanjay.mishra@student.edu', studentId: 'T003' },
  { name: 'Pallavi Rao', email: 'pallavi.rao@student.edu', studentId: 'T004' },
  { name: 'Karan Malhotra', email: 'karan.malhotra@student.edu', studentId: 'T005' },
  { name: 'Shreya Pandey', email: 'shreya.pandey@student.edu', studentId: 'T006' },
  { name: 'Mohit Saxena', email: 'mohit.saxena@student.edu', studentId: 'T007' },
  { name: 'Nisha Aggarwal', email: 'nisha.aggarwal@student.edu', studentId: 'T008' },
  { name: 'Varun Bhatia', email: 'varun.bhatia@student.edu', studentId: 'T009' },
  { name: 'Deepa Nambiar', email: 'deepa.nambiar@student.edu', studentId: 'T010' },
];

const cseProfiles = [
  { ut1: 18, mid: 28, ut2: 19, end: 55, att: 88 }, { ut1: 20, mid: 30, ut2: 22, end: 62, att: 92 },
  { ut1: 22, mid: 32, ut2: 24, end: 68, att: 90 }, { ut1: 15, mid: 24, ut2: 17, end: 50, att: 82 },
  { ut1: 19, mid: 29, ut2: 21, end: 58, att: 86 }, { ut1: 13, mid: 20, ut2: 14, end: 38, att: 76 },
  { ut1: 9, mid: 14, ut2: 10, end: 25, att: 62 }, { ut1: 7, mid: 11, ut2: 8, end: 22, att: 58 },
  { ut1: 11, mid: 17, ut2: 13, end: 34, att: 70 }, { ut1: 12, mid: 18, ut2: 12, end: 36, att: 72 },
  { ut1: 10, mid: 16, ut2: 11, end: 30, att: 68 }, { ut1: 21, mid: 31, ut2: 23, end: 65, att: 89 },
  { ut1: 17, mid: 26, ut2: 18, end: 52, att: 83 }, { ut1: 23, mid: 33, ut2: 25, end: 70, att: 94 },
  { ut1: 16, mid: 25, ut2: 16, end: 48, att: 80 },
];

const itProfiles = [
  { ut1: 19, mid: 29, ut2: 20, end: 58, att: 88 }, { ut1: 21, mid: 31, ut2: 22, end: 63, att: 91 },
  { ut1: 14, mid: 22, ut2: 15, end: 42, att: 78 }, { ut1: 18, mid: 28, ut2: 19, end: 55, att: 85 },
  { ut1: 16, mid: 24, ut2: 17, end: 48, att: 80 }, { ut1: 20, mid: 30, ut2: 21, end: 60, att: 87 },
  { ut1: 8, mid: 12, ut2: 9, end: 24, att: 60 }, { ut1: 22, mid: 32, ut2: 23, end: 66, att: 92 },
  { ut1: 15, mid: 23, ut2: 16, end: 45, att: 77 }, { ut1: 17, mid: 27, ut2: 18, end: 52, att: 83 },
];

const scoreToTier = (score) => (score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH' : score >= 31 ? 'MEDIUM' : 'LOW');
const hash = (pw) => bcrypt.hash(pw, 10);

function computeRisk(profile) {
  let score = 0;
  if (profile.att < 60) score += 25;
  else if (profile.att < 70) score += 18;
  else if (profile.att < 75) score += 12;
  else if (profile.att < 80) score += 6;
  const cgpa = (profile.ut1 + profile.mid + profile.ut2 + profile.end) / 16;
  if (cgpa < 4) score += 20;
  else if (cgpa < 5) score += 14;
  else if (cgpa < 6) score += 8;
  else if (cgpa < 7) score += 4;
  const total = profile.ut1 + profile.mid + profile.ut2 + profile.end;
  if (total < 40) score += 20;
  else if (total < 60) score += 10;
  return Math.min(100, score);
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Marks.deleteMany({}),
    Attendance.deleteMany({}),
    Insight.deleteMany({}),
    Alert.deleteMany({}),
    Notification.deleteMany({}),
    UploadLog.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const admin = await User.create({
    name: 'Shivam Sharma',
    email: 'shivam77@gmail.com',
    password: await hash('9082249120'),
    role: 'admin',
    department: 'Administration',
    isFirstLogin: false,
  });
  console.log('Admin created:', admin.email);

  const faculty1 = await User.create({
    name: 'Prof. Rajesh Sharma',
    email: 'prof.sharma@faculty.edu',
    password: await hash('faculty123'),
    role: 'faculty',
    department: 'CSE',
    isFirstLogin: false,
  });
  const faculty2 = await User.create({
    name: 'Prof. Anita Kulkarni',
    email: 'prof.kulkarni@faculty.edu',
    password: await hash('faculty123'),
    role: 'faculty',
    department: 'IT',
    isFirstLogin: false,
  });
  await User.create({
    name: 'Prof. Suresh Mehta',
    email: 'prof.mehta@faculty.edu',
    password: await hash('faculty123'),
    role: 'faculty',
    department: 'CSE',
    isFirstLogin: false,
  });
  console.log('Faculty created: 3 accounts');

  const cseUsers = await Promise.all(cseStudents.map(async (s) => User.create({
    ...s, password: await hash('student123'), role: 'student', department: 'CSE', isFirstLogin: false,
  })));
  console.log('CSE students created: 15 accounts');

  const itUsers = await Promise.all(itStudents.map(async (s) => User.create({
    ...s, password: await hash('student123'), role: 'student', department: 'IT', isFirstLogin: false,
  })));
  console.log('IT students created: 10 accounts');

  for (let i = 0; i < cseUsers.length; i++) {
    const p = cseProfiles[i];
    const user = cseUsers[i];
    for (const subject of CSE_SUBJECTS) {
      const v = Math.floor(Math.random() * 4) - 2;
      await Marks.create({
        studentId: user.studentId,
        classId: 'CSE-2024-SEM4',
        department: 'CSE',
        semester: 4,
        subject,
        scores: {
          ut1: Math.max(0, p.ut1 + v),
          midSem: Math.max(0, p.mid + v * 2),
          ut2: Math.max(0, p.ut2 + v),
          endSem: Math.max(0, p.end + v * 3),
        },
      });
      await Attendance.create({
        studentId: user.studentId, classId: 'CSE-2024-SEM4', department: 'CSE', semester: 4, subject,
        percentage: Math.min(100, Math.max(0, p.att + Math.floor(Math.random() * 6) - 3)),
        attended: Math.round((p.att / 100) * 24), total: 24,
      });
    }
    const risk = computeRisk(p);
    const cgpa = Math.min(10, Math.round(((p.ut1 + p.mid + p.ut2 + p.end) / 160) * 100) / 10);
    await Insight.create({
      studentId: user.studentId,
      classId: 'CSE-2024-SEM4',
      department: 'CSE',
      semester: 4,
      cgpa,
      riskLevel: scoreToTier(risk),
      dropoutProbabilityScore: risk,
      dropoutTier: scoreToTier(risk),
      classRank: i + 1,
      predictedScore: { min: Math.max(0, p.end - 8), max: Math.min(70, p.end + 8) },
      riskReason: 'Risk factors calculated from attendance and assessments.',
      recommendations: [
        { title: 'Improve attendance immediately', description: 'Attend all upcoming classes to stay above threshold.', priority: 'HIGH' },
        { title: 'Focus on internal assessments', description: 'Prepare for UT and mid-sem to improve stability.', priority: 'MEDIUM' },
        { title: 'Use AI advisor for doubt resolution', description: 'Ask the advisor for weekly support plans.', priority: 'LOW' },
      ],
      generatedAt: new Date(),
    });
  }
  console.log('CSE marks and attendance seeded');

  for (let i = 0; i < itUsers.length; i++) {
    const p = itProfiles[i];
    const user = itUsers[i];
    for (const subject of IT_SUBJECTS) {
      const v = Math.floor(Math.random() * 3) - 1;
      await Marks.create({
        studentId: user.studentId,
        classId: 'IT-2024-SEM4',
        department: 'IT',
        semester: 4,
        subject,
        scores: {
          ut1: Math.max(0, p.ut1 + v),
          midSem: Math.max(0, p.mid + v),
          ut2: Math.max(0, p.ut2 + v),
          endSem: Math.max(0, p.end + v * 2),
        },
      });
      await Attendance.create({
        studentId: user.studentId, classId: 'IT-2024-SEM4', department: 'IT', semester: 4, subject,
        percentage: Math.min(100, p.att + Math.floor(Math.random() * 5) - 2),
        attended: Math.round((p.att / 100) * 22), total: 22,
      });
    }
    const risk = computeRisk(p);
    const cgpa = Math.min(10, Math.round(((p.ut1 + p.mid + p.ut2 + p.end) / 160) * 100) / 10);
    await Insight.create({
      studentId: user.studentId,
      classId: 'IT-2024-SEM4',
      department: 'IT',
      semester: 4,
      cgpa,
      riskLevel: scoreToTier(risk),
      dropoutProbabilityScore: risk,
      dropoutTier: scoreToTier(risk),
      classRank: i + 1,
      predictedScore: { min: Math.max(0, p.end - 8), max: Math.min(70, p.end + 8) },
      riskReason: 'Risk factors calculated from attendance and assessments.',
      recommendations: [
        { title: 'Improve attendance immediately', description: 'Attend all upcoming classes to stay above threshold.', priority: 'HIGH' },
        { title: 'Focus on internal assessments', description: 'Prepare for UT and mid-sem to improve stability.', priority: 'MEDIUM' },
        { title: 'Use AI advisor for doubt resolution', description: 'Ask the advisor for weekly support plans.', priority: 'LOW' },
      ],
      generatedAt: new Date(),
    });
  }
  console.log('IT marks and attendance seeded');

  // Create upload logs so faculty dashboard KPI cards show data
  await UploadLog.create({
    uploadId: 'seed-upload-cse-001',
    facultyId: faculty1._id,
    classId: 'CSE-2024-SEM4',
    department: 'CSE',
    semester: 4,
    originalFilename: 'cse_marks_sem4.csv',
    studentCount: 15,
    pendingAlerts: ['S007', 'S008', 'S009'],
    status: 'complete',
    durationMs: 2340,
  });
  await UploadLog.create({
    uploadId: 'seed-upload-it-001',
    facultyId: faculty2._id,
    classId: 'IT-2024-SEM4',
    department: 'IT',
    semester: 4,
    originalFilename: 'it_marks_sem4.csv',
    studentCount: 10,
    pendingAlerts: ['T007'],
    status: 'complete',
    durationMs: 1890,
  });
  console.log('Upload logs created');

  const sampleAlerts = [
    { studentId: 'S007', studentEmail: 'pooja.nair@student.edu', facultyId: faculty1._id, emailSubject: 'Academic Performance Concern', emailBody: 'Body...', sentAt: new Date(Date.now() - 3 * 86400000) },
    { studentId: 'S008', studentEmail: 'dev.sharma@student.edu', facultyId: faculty1._id, emailSubject: 'Low Attendance Alert', emailBody: 'Body...', sentAt: new Date(Date.now() - 5 * 86400000) },
    { studentId: 'T007', studentEmail: 'mohit.saxena@student.edu', facultyId: faculty2._id, emailSubject: 'Mid-Sem Alert', emailBody: 'Body...', sentAt: new Date(Date.now() - 2 * 86400000) },
  ];

  const createdAlerts = await Alert.insertMany(sampleAlerts);
  console.log('Sample alerts seeded');

  const sampleInterventions = [
    { 
      studentId: 'S007', facultyId: faculty1._id, alertId: createdAlerts[0]._id, classId: 'CSE-2024-SEM4', 
      riskAtSend: 'HIGH', outcome: 'improved', resolvedAt: new Date() 
    },
    { 
      studentId: 'S008', facultyId: faculty1._id, alertId: createdAlerts[1]._id, classId: 'CSE-2024-SEM4', 
      riskAtSend: 'HIGH', outcome: 'pending' 
    },
    { 
      studentId: 'T007', facultyId: faculty2._id, alertId: createdAlerts[2]._id, classId: 'IT-2024-SEM4', 
      riskAtSend: 'MEDIUM', outcome: 'pending' 
    },
  ];
  const InterventionModel = (await import('../models/Intervention.js')).default; // This one is not at top
  await InterventionModel.insertMany(sampleInterventions);
  console.log('Sample interventions seeded');



  await Notification.create({
    userId: cseUsers[0]._id,
    type: 'marks_uploaded',
    title: 'New marks uploaded',
    message: 'Prof. Sharma uploaded Semester 4 marks. Your dashboard has been updated.',
    isRead: false,
    metadata: { classId: 'CSE-2024-SEM4' },
  });
  await Notification.create({
    userId: cseUsers[0]._id,
    type: 'risk_changed',
    title: 'Risk level changed',
    message: 'Your academic risk level has been updated based on latest analysis.',
    isRead: true,
    metadata: { tier: 'MEDIUM' },
  });
  console.log('Sample notifications created');
  
  const Poll = (await import('../models/Poll.js')).default;
  await Poll.deleteMany({});
  const polls = [
    { 
      pollId: 'p1', code: 'A1B2C3', facultyId: faculty1._id, classId: 'CSE-2024-SEM4', department: 'CSE', 
      question: 'How clear was today\'s session on Memory Management?', isActive: false, 
      responses: [
        { studentId: 'S001', rating: 5 }, { studentId: 'S002', rating: 4 }, { studentId: 'S003', rating: 5 },
        { studentId: 'S004', rating: 3 }, { studentId: 'S005', rating: 4 }
      ],
      closedAt: new Date(Date.now() - 86400000)
    },
    { 
      pollId: 'p2', code: 'D4E5F6', facultyId: faculty1._id, classId: 'CSE-2024-SEM4', department: 'CSE', 
      question: 'Rate your understanding of Page Replacement Algorithms', isActive: false, 
      responses: [
        { studentId: 'S001', rating: 4 }, { studentId: 'S002', rating: 5 }, { studentId: 'S003', rating: 4 },
        { studentId: 'S004', rating: 5 }, { studentId: 'S005', rating: 5 }, { studentId: 'S006', rating: 4 }
      ],
      closedAt: new Date(Date.now() - 172800000)
    }
  ];
  await Poll.insertMany(polls);
  console.log('Sample polls seeded');

  console.log('SEEDING COMPLETE');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
