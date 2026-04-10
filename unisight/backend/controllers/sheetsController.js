import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';
import SheetsConfig from '../models/SheetsConfig.js';
import UploadLog from '../models/UploadLog.js';
import { runPipeline } from '../agents/pipelineGraph.js';
import { v4 as uuidv4 } from 'uuid';

function transformToCsvUrl(sheetsUrl) {
  const match = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;
  const sheetId = match[1];
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
}

async function fetchSheetData(csvFetchUrl) {
  const response = await fetch(csvFetchUrl, { timeout: 15000 });
  if (!response.ok) throw new Error(`Failed to fetch sheet: HTTP ${response.status}. Make sure the sheet is public.`);
  const csvText = await response.text();
  return parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
}

export const saveSheetConfig = async (req, res) => {
  try {
    const { sheetUrl, classId, department, semester } = req.body;
    if (!sheetUrl || !classId || !department || !semester) return res.status(400).json({ error: 'All fields are required' });

    const csvFetchUrl = transformToCsvUrl(sheetUrl);
    if (!csvFetchUrl) return res.status(400).json({ error: 'Invalid Google Sheets URL' });

    let rows;
    try {
      rows = await fetchSheetData(csvFetchUrl);
    } catch (fetchErr) {
      return res.status(400).json({ error: `Cannot access sheet: ${fetchErr.message}. Make sure it is public.` });
    }

    await SheetsConfig.findOneAndUpdate(
      { facultyId: req.user.userId },
      { facultyId: req.user.userId, sheetUrl, csvFetchUrl, classId, department, semester: parseInt(semester), isActive: true, lastSyncStatus: 'never' },
      { upsert: true, new: true }
    );

    res.json({ message: `Sheet connected successfully. Found ${rows.length} rows. Auto-sync runs every Sunday at midnight.`, csvFetchUrl, rowCount: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSheetConfig = async (req, res) => {
  const config = await SheetsConfig.findOne({ facultyId: req.user.userId });
  res.json({ config });
};

export const removeSheetConfig = async (req, res) => {
  await SheetsConfig.findOneAndUpdate({ facultyId: req.user.userId }, { isActive: false });
  res.json({ message: 'Auto-sync disabled' });
};

export const manualSync = async (req, res) => {
  try {
    const config = await SheetsConfig.findOne({ facultyId: req.user.userId, isActive: true });
    if (!config) return res.status(404).json({ error: 'No active sheet config' });
    const result = await syncSheetForFaculty(config, req.user.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
};

export async function syncSheetForFaculty(config, facultyId) {
  const rows = await fetchSheetData(config.csvFetchUrl);
  const uploadId = uuidv4();
  
  await UploadLog.create({
    uploadId, facultyId, classId: config.classId, department: config.department, semester: config.semester,
    originalFilename: `sheets_sync_${new Date().toISOString().split('T')[0]}`,
    status: 'processing', attendanceThreshold: 75, passingScoreThreshold: 40,
  });

  runPipeline({
    csvRows: rows, uploadId, classId: config.classId, department: config.department,
    semester: config.semester, facultyId, attendanceThreshold: 75, passingScoreThreshold: 40,
  }).then(async () => {
    await SheetsConfig.findOneAndUpdate({ facultyId }, { lastSyncedAt: new Date(), lastSyncStatus: 'success', lastSyncError: null });
  }).catch(async (err) => {
    await SheetsConfig.findOneAndUpdate({ facultyId }, { lastSyncStatus: 'failed', lastSyncError: err.message });
  });

  await SheetsConfig.findOneAndUpdate({ facultyId }, { lastSyncStatus: 'processing' });
  return { uploadId, message: `Sync started. ${rows.length} rows found.`, rowCount: rows.length };
}
