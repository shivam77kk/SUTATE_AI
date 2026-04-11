import HelpRequest from '../models/HelpRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

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

    // Notify Faculty of the department and all Admins
    const staffToNotify = await User.find({
      $or: [
        { role: 'faculty', department: req.user.department },
        { role: 'admin' }
      ]
    }).select('_id');

    if (staffToNotify.length > 0) {
      const notifications = staffToNotify.map(staff => ({
        userId: staff._id,
        type: 'alert',
        title: `New Help Request: ${subject}`,
        message: `${req.user.name} (${req.user.department}) submitted a ${urgency} help request.`,
        isRead: false,
        metadata: { requestId: request._id.toString(), type: 'help_request' }
      }));
      
      await Notification.insertMany(notifications);

      // Emit real-time events to staff rooms
      req.io?.to(`faculty-${req.user.department}`).emit('notification:new', {
        title: 'New Help Request',
        message: `${req.user.name} needs assistance with ${subject}`,
        urgency
      });
      req.io?.to('admin-room').emit('notification:new', {
        title: 'New Student Request',
        message: `[${req.user.department}] ${req.user.name}: ${subject}`,
        urgency
      });
    }

    res.status(201).json({ message: 'Help request submitted', helpRequestId: request._id });
  } catch {
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
    const { response, status = 'resolved' } = req.body;
    if (!response?.trim()) return res.status(400).json({ error: 'Response is required' });

    const validStatuses = ['in_progress', 'resolved'];
    const newStatus = validStatuses.includes(status) ? status : 'resolved';

    const request = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: newStatus,
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
        message: `${req.user.name} responded to your request about "${request.subject}"`,
        isRead: false,
        metadata: { requestId: request._id.toString() },
      });

      req.io?.to(`user-${request.studentUserId}`).emit('notification:new', {
        title: 'Faculty responded',
        message: `Response received for ${request.subject}`,
      });
    }

    res.json({ message: 'Response sent', request });
  } catch {
    res.status(500).json({ error: 'Failed to send response' });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'in_progress', 'resolved', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: open, in_progress, resolved, or pending' });
    }

    const request = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Status updated', request });
  } catch {
    res.status(500).json({ error: 'Failed to update status' });
  }
};
