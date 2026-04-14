import mongoose from 'mongoose';
import 'dotenv/config';
import TeacherInsight from './models/TeacherInsight.js';
import User from './models/User.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unisight');
  let insights = await TeacherInsight.find().populate('facultyId', 'name department').sort({ effectivenessScore: -1 });
  console.log('Insights:', JSON.stringify(insights, null, 2));
  let faculties = await User.find({role: 'faculty'}).select('name email');
  console.log('Faculties:', faculties);
  process.exit();
}
test();
