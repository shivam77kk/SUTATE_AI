import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const users = await User.find({}, 'email role studentId');
    console.log('Users in DB:');
    users.forEach(u => console.log(`- ${u.email} (${u.role}) ${u.studentId || ''}`));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Check failed:', err.message);
  }
}
check();
