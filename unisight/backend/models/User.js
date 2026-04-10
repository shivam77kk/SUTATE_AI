import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, required: true },
  role:             { type: String, enum: ['student', 'faculty', 'admin'], required: true },
  department:       { type: String, required: true },
  studentId:        { type: String, default: null },
  lastLogin:        { type: Date, default: null },
  isFirstLogin:     { type: Boolean, default: true },
  resetToken:       { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  admissionYear:    { type: Number, default: null },
  active:           { type: Boolean, default: true },
  autoRerunEnabled: { type: Boolean, default: false },
  autoRerunSchedule:{ type: String, default: 'weekly' },
}, { timestamps: true });
export default mongoose.model('User', userSchema);

