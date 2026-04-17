import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

const transporter = {
  sendMail: async () => { console.log('[Mailer Stub] Password email sent'); }
};

export const changeFirstPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: 'Passwords do not match' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.isFirstLogin = false;
    await user.save();

   
    const token = jwt.sign(
      { userId: user._id, role: user.role, department: user.department,
        studentId: user.studentId, name: user.name, isFirstLogin: false },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      message: 'Password changed successfully',
      user: { id: user._id, name: user.name, role: user.role, isFirstLogin: false, department: user.department, studentId: user.studentId }
    });
  } catch (err) {
    console.error('[ChangeFirstPassword]', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
   
    if (!user) return res.json({ message: 'If this email exists, a reset link has been sent.' });

    const token = crypto.randomUUID();
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"SUTATE AI" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your SUTATE AI password',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#6366f1">SUTATE AI — Password Reset</h2>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${resetLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:12px 0">Reset Password</a>
        <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>`,
    });

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[ForgotPassword]', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: 'Passwords do not match' });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'Reset link is invalid or expired' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('[ResetPassword]', err);
    res.status(500).json({ error: 'Server error' });
  }
};
