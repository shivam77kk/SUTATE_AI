import mongoose from 'mongoose';
const bulkImportLogSchema = new mongoose.Schema({
  importId: { type: String, required: true, unique: true },
  adminId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalRows:{ type: Number, default: 0 },
  created:  { type: Number, default: 0 },
  failed:   { type: Number, default: 0 },
  errors:   [{ row: Number, email: String, reason: String }],
  status:   { type: String, enum: ['complete', 'partial', 'failed'], default: 'complete' },
}, { timestamps: true });
export default mongoose.model('BulkImportLog', bulkImportLogSchema);
