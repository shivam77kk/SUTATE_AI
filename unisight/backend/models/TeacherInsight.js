import mongoose from 'mongoose';

const teacherInsightSchema = new mongoose.Schema({
  facultyId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId:                { type: String, required: true },
  department:             { type: String, required: true },
  semester:               { type: Number, required: true },

  effectivenessScore:     { type: Number, min: 0, max: 100 },
  classPassRate:          { type: Number },
  deptAvgPassRate:        { type: Number },
  classAvgScore:          { type: Number },
  deptAvgScore:           { type: Number },
  atRiskResolutionRate:   { type: Number },
  avgParticipationScore:  { type: Number },

  effectivenessSummary:   { type: String },
  teachingRecommendations: [{
    title:       { type: String },
    description: { type: String },
    priority:    { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
  }],

  prevSemesterAvgScore:   { type: Number, default: null },
  scoreChangeVsPrevSem:   { type: Number, default: null },

  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('TeacherInsight', teacherInsightSchema);
