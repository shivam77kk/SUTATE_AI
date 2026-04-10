import mongoose from 'mongoose';

const cohortTrackingSchema = new mongoose.Schema({
  cohortId:     { type: String, required: true, unique: true },
  department:   { type: String, required: true },
  admissionYear:{ type: Number, required: true },
  totalStudents:{ type: Number, default: 0 },

  semesterData: [{
    semester:       { type: Number },
    avgCgpa:        { type: Number },
    atRiskPercent:  { type: Number },
    passPercent:    { type: Number },
    dropoutCount:   { type: Number, default: 0 },
    recordedAt:     { type: Date, default: Date.now },
  }],

  predictedDropouts:    { type: Number, default: null },
  retentionRiskLevel:   { type: String, enum: ['low', 'moderate', 'high'], default: 'low' },
  aiRetentionSummary:   { type: String, default: null },

  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('CohortTracking', cohortTrackingSchema);
