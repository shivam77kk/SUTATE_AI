import mongoose from 'mongoose';

const sheetsConfigSchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sheetUrl: { type: String, required: true },
    csvFetchUrl: { type: String, required: true },
    classId: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    lastSyncStatus: { type: String, default: 'never' },
    lastSyncedAt: { type: Date },
    lastSyncError: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('SheetsConfig', sheetsConfigSchema);
