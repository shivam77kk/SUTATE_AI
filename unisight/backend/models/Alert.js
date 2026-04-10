import mongoose from 'mongoose';
const alertSchema = new mongoose.Schema({
  studentId:    { type: String, required: true },
  studentEmail: { type: String, required: true },
  facultyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  emailSubject: { type: String },
  emailBody:    { type: String },
  sentAt:       { type: Date, default: Date.now },
  status:       { type: String, enum: ['sent', 'failed'], default: 'sent' },
}, { timestamps: true });
export default mongoose.model('Alert', alertSchema);
