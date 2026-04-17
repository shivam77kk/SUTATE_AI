import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import BulkImportLog from '../models/BulkImportLog.js';
import AdminLog from '../models/AdminLog.js';

function parseCSV(buffer) {
  const text = buffer.toString('utf-8');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map((line, idx) => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    obj._row = idx + 2;
    return obj;
  });
}

export const bulkImportUsers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const rows = parseCSV(req.file.buffer);
    const importId = uuidv4();
    const errors = [];
    let created = 0;

    for (const row of rows) {
      try {
        const { name, email, password, role, department, studentid } = row;
        const rowNum = row._row;

        if (!name || !email || !password || !role)
          throw new Error('Missing required field: name/email/password/role');

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) throw new Error('Email already exists');

        const hash = await bcrypt.hash(password, 10);
        await User.create({
          name, email: email.toLowerCase(), password: hash,
          role, department: department || 'University',
          studentId: studentid || null, isFirstLogin: true,
        });
        created++;
      } catch (err) {
        errors.push({ row: row._row, email: row.email || '', reason: err.message });
      }
    }

    const status = errors.length === 0 ? 'complete' : created === 0 ? 'failed' : 'partial';
    await BulkImportLog.create({ importId, adminId: req.user.userId, totalRows: rows.length, created, failed: errors.length, errors, status });
    await AdminLog.create({ adminId: req.user.userId, action: 'bulk_import', targetType: 'bulk_import', details: `Bulk imported ${created}/${rows.length} users`, ip: req.ip });

    res.json({ importId, total: rows.length, created, failed: errors.length, errors });
  } catch (err) {
    console.error('[BulkImport]', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBulkImportLogs = async (req, res) => {
  try {
    const logs = await BulkImportLog.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
