import express from 'express';import './services/digestService.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import dns from 'dns';
dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import facultyRoutes from './routes/faculty.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import curriculumRoutes from './routes/curriculum.js';
import cohortRoutes from './routes/cohort.js';
import pollRoutes from './routes/polls.js';
import moodRoutes from './routes/mood.js';
import helpRoutes from './routes/helpRequests.js';
import notificationRoutes from './routes/notifications.js';
import sheetsRoutes from './routes/sheets.js';
import alertRoutes from './routes/alerts.js';
import interventionRoutes from './routes/interventions.js';
import feedbackRoutes from './routes/feedback.js';
import goalRoutes from './routes/goals.js';
import passwordRoutes from './routes/password.js';
import bulkRoutes from './routes/bulk.js';
import parentRoutes from './routes/parent.js';
import teacherInsightRoutes from './routes/teacherInsights.js';
import adminLogRoutes from './routes/adminLogs.js';
const app = express();
const server = createServer(app);
global.dbConnected = false;
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:3000',
        'https://sutate-ai.vercel.app',
        'https://sutate-ai.onrender.com',
        ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/$/, '')) : []),
        ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(o => o.trim().replace(/\/$/, '')) : [])
      ];
      const normalizedOrigin = origin ? origin.replace(/\/$/, '') : null;
      if (!origin || allowed.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },

    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

io.on('connection', (socket) => {
  socket.on('join-upload', (id) => socket.join(id));
  socket.on('join-faculty', (id) => socket.join(`faculty-${id}`));
  socket.on('join-class', (id) => socket.join(`class-${id}`));
  socket.on('join-user', (id) => socket.join(`user-${id}`));
  socket.on('disconnect', () => {});
});
const allowedOrigins = [
  'http://localhost:3000',
  'https://sutate-ai.vercel.app',
  'https://sutate-ai.onrender.com',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/$/, '')) : []),
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(o => o.trim().replace(/\/$/, '')) : [])
];


app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/$/, '') : null;
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Also update socket.io CORS
io.engine.on("initial_headers", (headers, req) => {
  if (req.headers.origin) {
    headers["Access-Control-Allow-Origin"] = req.headers.origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  req.io = io;
  next();
});
const geminiLimiter = rateLimit({
  windowMs: 60000,
  max: 15,
  message: { error: 'Too many AI requests. Please wait a moment.' },
});
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/help-requests', helpRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/curriculum', geminiLimiter, curriculumRoutes);
app.use('/api/admin/curriculum', geminiLimiter, curriculumRoutes);
app.use('/api/cohort', cohortRoutes);
app.use('/api/student/goals', goalRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/admin/bulk', bulkRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/teacher-insights', teacherInsightRoutes);
app.use('/api/admin/logs', adminLogRoutes);
app.get('/api/health', (_, res) => res.json({ 
  status: 'ok', 
  database: global.dbConnected ? 'connected' : 'disconnected',
  env: {
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV
  },
  time: new Date() 
}));

app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }));
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
})
  .then(() => {
    global.dbConnected = true;
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    global.dbConnected = false;
    console.warn('⚠️  MongoDB unavailable — running in DEMO/OFFLINE mode:', err.message);
  });
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
