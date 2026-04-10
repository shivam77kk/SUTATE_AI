import mongoose from 'mongoose';

const sheetsConfigSchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    spreadsheetId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('SheetsConfig', sheetsConfigSchema);
