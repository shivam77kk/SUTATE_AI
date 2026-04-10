import HelpRequest from '../models/HelpRequest.js';
import Notification from '../models/Notification.js';

export const submitRequest = async (req, res) => {
  try {
    const { subject, description, urgency = 'general' } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'subject and description required' });

    const request = await HelpRequest.create({
      studentId: req.user.studentId,
      studentName: req.user.name,
      studentUserId: req.user.userId,
      department: req.user.department,
      subject: subject.trim(),
      description: description.trim(),
      urgency,
      status: 'pending',
    });

    res.status(201).json({ message: 'Help request submitted', helpRequestId: request._id });
  } catch (err) {
    console.error('submitRequest error:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find({ studentId: req.user.studentId }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch {
    res.status(500).json({ error: 'Failed to load requests' });
  }
};

export const getFacultyQueue = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { department: req.user.department };
    const requests = await HelpRequest.find(filter).sort({ urgency: 1, createdAt: -1 });
    res.json({ requests });
  } catch {
    res.status(500).json({ error: 'Failed to load queue' });
  }
};

export const respondToRequest = async (req, res) => {
  try {
    const { response } = req.body;
    if (!response?.trim()) return res.status(400).json({ error: 'Response is required' });

    const request = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'responded',
        facultyResponse: response.trim(),
        respondedAt: new Date(),
        respondedBy: req.user.name,
      },
      { new: true },
    );

    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.studentUserId) {
      await Notification.create({
        userId: request.studentUserId,
        type: 'system',
        title: 'Faculty responded to your help request',
        message: `${req.user.name} responded to your request about ${request.subject}`,
        isRead: false,
        metadata: { requestId: request._id.toString() },
      });

      req.io?.to(`user-${request.studentUserId}`).emit('notification:new', {
        title: 'Faculty responded',
        message: `Response received for ${request.subject}`,
      });
    }

    res.json({ message: 'Response sent', request });
  } catch (err) {
    console.error('respondToRequest error:', err);
    res.status(500).json({ error: 'Failed to send response' });
  }
};
