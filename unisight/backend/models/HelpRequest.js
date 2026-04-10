import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentUserId: { type: String },
  department: { type: String },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['today', 'this_week', 'general'], default: 'general' },
  status: { type: String, enum: ['pending', 'responded', 'resolved'], default: 'pending' },
  facultyResponse: { type: String },
  respondedAt: { type: Date },
  respondedBy: { type: String },
}, { timestamps: true });

export default mongoose.model('HelpRequest', schema);
