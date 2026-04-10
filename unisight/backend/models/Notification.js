import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['marks_uploaded','risk_changed','alert_received','alert_acknowledged','goal_progress','system'], required: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  isRead:    { type: Boolean, default: false },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export default mongoose.model('Notification', notificationSchema);
