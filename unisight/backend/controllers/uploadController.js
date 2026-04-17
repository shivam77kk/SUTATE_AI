import { runPipeline, setIO } from '../agents/pipelineGraph.js';
import { findSuggestions } from '../utils/fuzzyMatch.js';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import UploadLog from '../models/UploadLog.js';
import Insight from '../models/Insight.js';

export const validateCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file provided' });
    const { department } = req.body;
    if (!department) return res.status(400).json({ error: 'Department is required for validation' });

    const csvRows = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const validationId = uuidv4();
    const mismatches = [];
    const validRows = [];
    let matchedCount = 0;

   
    const STUDENT_ID_HEADERS = [
      'Roll No', 'Roll_No', 'RollNo', 'roll_no', 'rollno', 'roll no',
      'Student ID', 'Student_ID', 'StudentID', 'student_id', 'studentId', 'studentid',
      'ID', 'id', 'Roll', 'roll', 'Registration No', 'Reg No', 'reg_no',
      'Enrollment No', 'enrollment_no', 'EnrollmentNo',
    ];

   
    const csvHeaders = csvRows.length > 0 ? Object.keys(csvRows[0]) : [];
    const studentIdHeader = csvHeaders.find(h => 
      STUDENT_ID_HEADERS.includes(h) || 
      STUDENT_ID_HEADERS.map(s => s.toLowerCase()).includes(h.toLowerCase())
    );

    const errors = [];
    const warnings = [];

    if (!studentIdHeader) {
      warnings.push(`No recognized student ID column found. Looked for: Roll No, Student ID, studentId, id. Found columns: ${csvHeaders.join(', ')}`);
    }

   
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const studentId = studentIdHeader ? row[studentIdHeader] : (row['Roll No'] || row['Student ID'] || row['studentId']);
      
      if (!studentId) {
        mismatches.push({
          row: i + 1,
          originalId: 'MISSING',
          suggestions: []
        });
        errors.push(`Row ${i + 1}: Missing student ID`);
        continue;
      }

      const exists = await User.findOne({ 
        studentId: studentId.trim(),
        role: 'student'
      });

      if (exists) {
        validRows.push(row);
        matchedCount++;
      } else {
       
        const suggestions = await findSuggestions(studentId, department);
        mismatches.push({
          row: i + 1,
          originalId: studentId,
          suggestions
        });
        errors.push(`Row ${i + 1}: Student ID "${studentId}" not registered in system`);
      }
    }

   
    if (matchedCount === 0 && csvRows.length > 0) {
      warnings.push(`None of the ${csvRows.length} student IDs in the CSV matched registered students. Make sure students are registered first via Admin → Users.`);
    }

   
    await UploadLog.create({
      uploadId: validationId,
      facultyId: req.user.userId,
      classId: req.body.classId || 'PENDING',
      department,
      semester: parseInt(req.body.semester) || 4,
      originalFilename: req.file.originalname,
      status: mismatches.length > 0 ? 'failed_validation' : 'validated',
      validationMetadata: {
        mismatchCount: mismatches.length,
        mismatches,
        matchedCount
      },
      tempData: JSON.stringify(validRows),
    });

    res.json({
      validationId,
      totalRows: csvRows.length,
      matchedCount,
      validRows: matchedCount,
      mismatchCount: mismatches.length,
      errorRows: mismatches.length,
      mismatches: mismatches.slice(0, 10),
      errors: errors.slice(0, 20),
      warnings,
      requiresApproval: mismatches.length > 0
    });

  } catch (err) {
    console.error('[Validate] Error:', err);
    res.status(500).json({ error: 'Validation failed: ' + err.message });
  }
};

export const uploadCSV = async (req, res) => {
  try {
    const { validationId, classId, department, semester } = req.body;
    if (!validationId) return res.status(400).json({ error: 'Validation ID is required' });

   
    const log = await UploadLog.findOne({ uploadId: validationId, facultyId: req.user.userId });
    if (!log) return res.status(404).json({ error: 'Validation session not found' });

    if (log.status === 'processing' || log.status === 'complete') {
      return res.status(400).json({ error: 'This file has already been processed' });
    }

   
    const validRows = JSON.parse(log.tempData || '[]');
    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid registered students found in this file to process.' });
    }

   
    log.status = 'processing';
    log.classId = classId;
    log.semester = parseInt(semester) || log.semester || 4;
    log.studentCount = validRows.length;
    await log.save();

   
    setIO(req.io);
    runPipeline({
      csvRows: validRows,
      uploadId: validationId,
      classId,
      department,
      semester: parseInt(semester) || log.semester || 4,
      facultyId: req.user.userId,
    }).catch(err => {
      console.error('[Pipeline] Error:', err);
      log.status = 'error';
      log.errorMessage = err.message;
      log.save();
    });

    res.json({ uploadId: validationId, message: `Processing ${validRows.length} matched students...` });
  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
};

export const getMismatchReport = async (req, res) => {
  try {
    const log = await UploadLog.findOne({ uploadId: req.params.id });
    if (!log) return res.status(404).json({ error: 'Log not found' });

    const headers = 'Row,Original Student ID,Suggestion 1,Suggestion 2,Suggestion 3';
    const rows = log.validationMetadata.mismatches.map(m => {
      const sugs = m.suggestions.map(s => `${s.studentId} (${s.name})`).join(',');
      return `${m.row},${m.originalId},${sugs}`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mismatch-report-${req.params.id}.csv"`);
    res.send([headers, ...rows].join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const getTemplateCSV = async (req, res) => {
  const headers = 'Roll No,Name,DBMS,OS,CN,DSA,Maths,Attendance %';
  const sample = 'S001,John Doe,85,78,92,88,76,82';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="unisight-template.csv"');
  res.send(`${headers}\n${sample}`);
};

export const getDataCompleteness = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student', department: req.user.department });
    const enrolledIds = await Insight.distinct('studentId', { department: req.user.department });
    const coverage = totalStudents > 0 ? Math.round((enrolledIds.length/totalStudents)*100) : 0;
    
    res.json({
      totalStudents,
      studentsWithData: enrolledIds.length,
      coveragePercent: coverage,
      lastUpload: await UploadLog.findOne({ facultyId: req.user.userId }).sort({ createdAt: -1 })
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUploadLogs = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { facultyId: req.user.userId };
    const logs = await UploadLog.find(query).sort({ createdAt: -1 }).limit(20);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

export const setAutoRerun = async (req, res) => {
  try {
    const { classId } = req.params;
    const { enabled, schedule } = req.body;
    await User.findByIdAndUpdate(req.user.userId, { autoRerunEnabled: enabled, autoRerunSchedule: schedule });
    res.json({ message: 'Auto re-analysis schedule updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAutoRerunStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ autoRerunEnabled: user.autoRerunEnabled, autoRerunSchedule: user.autoRerunSchedule });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
