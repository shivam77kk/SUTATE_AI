import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  department: String,
  studentId: String,
  isFirstLogin: Boolean,
  active: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Connecting to:', uri.replace(/:([^@]+)@/, ':***@'));
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');

    const total = await User.countDocuments();
    const users = await User.find({}, '-password').sort({ role: 1 }).limit(30);
    console.log(`\nTotal users: ${total}`);
    console.log('\n--- Users ---');
    users.forEach(u => {
      console.log(`[${u.role.toUpperCase()}] ${u.name} | ${u.email} | dept: ${u.department} | studentId: ${u.studentId || 'N/A'} | firstLogin: ${u.isFirstLogin}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUsers();
