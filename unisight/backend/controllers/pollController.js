import Poll from '../models/Poll.js';
import ActivityData from '../models/ActivityData.js';
import Insight from '../models/Insight.js';
import { io } from '../index.js';
import { v4 as uuidv4 } from 'uuid';
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
export const createPoll = async (req, res) => {
  try {
    const { question, classId } = req.body;
    if (!question || !classId) return res.status(400).json({ error: 'question and classId are required' });
    await Poll.updateMany({ facultyId: req.user.userId, isActive: true }, { isActive: false, closedAt: new Date() });
    const pollId = uuidv4();
    let code = generateCode();
    while (await Poll.findOne({ code })) { code = generateCode(); }
    await Poll.create({ pollId, code, facultyId: req.user.userId, classId, department: req.user.department, question, isActive: true, responses: [] });
    io.to(`class-${classId}`).emit('poll:new', { pollId, code, question, facultyId: req.user.userId });
    res.status(201).json({ pollId, code, question, classId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findOne({ pollId: req.params.pollId, facultyId: req.user.userId });
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    poll.isActive = false;
    poll.closedAt = new Date();
    await poll.save();
    io.to(`class-${poll.classId}`).emit('poll:closed', { pollId: poll.pollId });
    const avgRating = poll.responses.length ? (poll.responses.reduce((s, r) => s + r.rating, 0) / poll.responses.length).toFixed(1) : 0;
    res.json({ message: 'Poll closed', totalResponses: poll.responses.length, avgRating });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const getMyActivePolls = async (req, res) => {
  try {
    const insights = await Insight.findOne({ studentId: req.user.studentId }).sort({ createdAt: -1 });
    if (!insights) return res.json({ activePoll: null });
    const poll = await Poll.findOne({ classId: insights.classId, isActive: true }).populate('facultyId', 'name');
    if (!poll) return res.json({ activePoll: null });
    const alreadyResponded = poll.responses.some(r => r.studentId === req.user.studentId);
    res.json({
      activePoll: alreadyResponded ? null : {
        pollId: poll.pollId,
        question: poll.question,
        code: poll.code,
        facultyName: poll.facultyId?.name || 'Your faculty',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const submitPollResponse = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    const poll = await Poll.findOne({ pollId: req.params.pollId, isActive: true });
    if (!poll) return res.status(404).json({ error: 'Poll not found or already closed' });
    if (poll.responses.some(r => r.studentId === req.user.studentId)) return res.status(409).json({ error: 'You have already responded to this poll' });
    poll.responses.push({ studentId: req.user.studentId, rating, respondedAt: new Date() });
    await poll.save();
    const totalResponses = poll.responses.length;
    const avgRating = (poll.responses.reduce((s, r) => s + r.rating, 0) / totalResponses).toFixed(1);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    poll.responses.forEach(r => distribution[r.rating]++);
    io.to(`faculty-${poll.facultyId.toString()}`).emit('poll:update', { pollId: poll.pollId, totalResponses, avgRating: parseFloat(avgRating), distribution });
    await ActivityData.findOneAndUpdate(
      { studentId: req.user.studentId, classId: poll.classId },
      { $set: { participationScore: rating * 20 }, $setOnInsert: { studentId: req.user.studentId, classId: poll.classId, department: req.user.department, semester: 4 } },
      { upsert: true }
    );
    res.json({ message: 'Response recorded. Thank you!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const getPollResults = async (req, res) => {
  try {
    const pollIdParam = req.params.pollId;
    const poll = await Poll.findOne({ 
      $or: [{ pollId: pollIdParam }, { classId: pollIdParam, isActive: true }]
    }).sort({ createdAt: -1 });
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    poll.responses.forEach(r => distribution[r.rating]++);
    const avgRating = poll.responses.length ? (poll.responses.reduce((s, r) => s + r.rating, 0) / poll.responses.length).toFixed(1) : 0;
    const classSize = await Insight.countDocuments({ classId: poll.classId });
    const responseRate = classSize > 0 ? Math.round((poll.responses.length / classSize) * 100) : 0;
    res.json({ pollId: poll.pollId, question: poll.question, isActive: poll.isActive, totalResponses: poll.responses.length, avgRating: parseFloat(avgRating), distribution, responseRate, createdAt: poll.createdAt });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const getMyPolls = async (req, res) => {
  try {
    const facultyId = req.user.userId;
    const polls = await Poll.find({ facultyId }).sort({ createdAt: -1 }).limit(30);
    const formatted = polls.map(poll => {
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      poll.responses.forEach(r => {
        if (distribution[r.rating] !== undefined) distribution[r.rating]++;
      });
      const avgRating = poll.responses.length 
        ? (poll.responses.reduce((s, r) => s + (r.rating || 0), 0) / poll.responses.length)
        : null;
      return {
        pollId: poll.pollId,
        question: poll.question,
        classId: poll.classId,
        className: poll.classId,
        isActive: poll.isActive,
        totalResponses: poll.responses.length,
        avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
        distribution,
        createdAt: poll.createdAt,
        closedAt: poll.closedAt,
      };
    });
    res.json({ polls: formatted });
  } catch (err) {
    console.error('[GetMyPolls] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
export const getPollResultsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const poll = await Poll.findOne({ classId }).sort({ createdAt: -1 });
    if (!poll) return res.status(404).json({ error: 'No polls found for this class' });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    poll.responses.forEach(r => distribution[r.rating]++);
    const avgRating = poll.responses.length ? (poll.responses.reduce((s, r) => s + r.rating, 0) / poll.responses.length).toFixed(1) : 0;
    const chartData = Object.keys(distribution).map(rating => ({
      rating: `Rating ${rating}`,
      count: distribution[rating]
    }));
    res.json({
      pollId: poll.pollId,
      question: poll.question,
      isActive: poll.isActive,
      totalResponses: poll.responses.length,
      avgRating: parseFloat(avgRating),
      distribution: chartData,
      createdAt: poll.createdAt
    });
  } catch (err) {
    console.error('[GetPollResultsByClass] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
