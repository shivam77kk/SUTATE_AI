import mongoose from 'mongoose';
const activityDataSchema = new mongoose.Schema({
  studentId:            { type: String, required: true },
  classId:              { type: String, required: true },
  subject:              { type: String, required: true },
  department:           { type: String, required: true },
  semester:             { type: Number, required: true },
  assignmentPct:        { type: Number, default: null },
  participationScore:   { type: Number, default: null },
  labCompletionPct:     { type: Number, default: null },
  overallActivityScore: { type: Number, default: null },
  uploadedBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export default mongoose.model('ActivityData', activityDataSchema);
