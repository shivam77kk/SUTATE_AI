import { runPipeline } from '../agents/pipelineGraph.js';
import { findSuggestions } from '../utils/fuzzyMatch.js';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import UploadLog from '../models/UploadLog.js';
import Insight from '../models/Insight.js';

// POST /api/upload/validate
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

    // ── Check each row against registered students ──
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const studentId = row['Roll No'] || row['Student ID'] || row['studentId'];
      
      if (!studentId) {
        mismatches.push({
          row: i + 1,
          originalId: 'MISSING',
          suggestions: []
        });
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
        // Find fuzzy suggestions
        const suggestions = await findSuggestions(studentId, department);
        mismatches.push({
          row: i + 1,
          originalId: studentId,
          suggestions
        });
      }
    }

    // ── Create a 'pending_validation' log to store results ──
    await UploadLog.create({
      uploadId: validationId,
      facultyId: req.user.userId,
      classId: req.body.classId || 'PENDING',
      department,
      semester: Number(req.body.semester) || 0,
      originalFilename: req.file.originalname,
      status: mismatches.length > 0 ? 'failed_validation' : 'validated',
      validationMetadata: {
        mismatchCount: mismatches.length,
        mismatches,
        matchedCount
      },
      tempData: JSON.stringify(validRows), // Store ONLY valid rows for next step
    });

    res.json({
      validationId,
      totalRows: csvRows.length,
      matchedCount,
      mismatchCount: mismatches.length,
      mismatches: mismatches.slice(0, 10), // Return first 10 for UI preview
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

    // 1. Find the validation log
    const log = await UploadLog.findOne({ uploadId: validationId, facultyId: req.user.userId });
    if (!log) return res.status(404).json({ error: 'Validation session not found' });

    if (log.status === 'processing' || log.status === 'complete') {
      return res.status(400).json({ error: 'This file has already been processed' });
    }

    // 2. Parse the temporary valid rows
    const validRows = JSON.parse(log.tempData || '[]');
    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid registered students found in this file to process.' });
    }

    // 3. Update log status to processing
    log.status = 'processing';
    log.classId = classId;
    log.semester = Number(semester);
    log.studentCount = validRows.length;
    await log.save();

    // 4. Run pipeline
    runPipeline({
      csvRows: validRows,
      uploadId: validationId,
      classId,
      department,
      semester: Number(semester),
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

// GET /api/upload/mismatch-report/:id
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

// GET /api/faculty/template-csv
export const getTemplateCSV = async (req, res) => {
  const headers = 'Roll No,Name,DBMS,OS,CN,DSA,Maths,Attendance %';
  const sample = 'S001,John Doe,85,78,92,88,76,82';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="unisight-template.csv"');
  res.send(`${headers}\n${sample}`);
};

// GET /api/faculty/data-completeness
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
    const { enabled, schedule } = req.body; // schedule: 'daily' | 'weekly'
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
