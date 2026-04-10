# UniSight - Student Analytics Platform

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ installed
- MongoDB running (local or cloud)

### Installation

1. **Install Backend Dependencies**
```bash
cd backend
npm install
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

### Running the Application

#### Option 1: Use the Startup Script (Windows)
Double-click `START.bat` in the unisight folder

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 📊 Dashboards

### Student Dashboard
- **URL:** http://localhost:3000/student/dashboard
- **Features:**
  - CGPA tracking
  - Attendance monitoring
  - Risk assessment
  - AI recommendations
  - Study plan generator
  - Mood check-ins
  - Live polls
  - Goal setting

### Faculty Dashboard
- **URL:** http://localhost:3000/faculty/dashboard
- **Features:**
  - Class analytics
  - Student risk alerts
  - Attendance tracking
  - Poll creation
  - Feedback collection
  - Intervention tracking
  - Effectiveness metrics

### Admin Dashboard
- **URL:** http://localhost:3000/admin/dashboard
- **Features:**
  - System overview
  - User management
  - Bulk data import
  - Cohort tracking
  - NAAC reports
  - Curriculum flags
  - Department analytics
  - System logs

## 🧪 Testing

### Backend API Tests
```bash
cd backend
node test-api.js
```

### Test Accounts
```
Student:
Email: student@test.com
Password: password123

Faculty:
Email: faculty@test.com
Password: password123

Admin:
Email: admin@test.com
Password: password123
```

## 🔧 Configuration

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 📁 Project Structure

```
unisight/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/          # Database schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Auth & validation
│   └── index.js         # Server entry
│
└── frontend/
    ├── app/             # Next.js pages
    │   ├── student/     # Student pages
    │   ├── faculty/     # Faculty pages
    │   └── admin/       # Admin pages
    ├── components/      # React components
    ├── lib/             # Utilities
    └── store/           # State management
```

## 🎯 Key Features

### AI-Powered Analytics
- Dropout risk prediction
- Personalized recommendations
- Study plan generation
- Sentiment analysis

### Real-time Features
- Live polls
- Instant notifications
- Socket.io integration
- Real-time dashboards

### Data Management
- Bulk CSV import
- Excel export
- PDF reports
- Google Sheets sync

### Monitoring & Alerts
- Attendance tracking
- Performance alerts
- Intervention tracking
- Parent notifications

## 🐛 Troubleshooting

### Backend won't start
1. Check MongoDB connection
2. Verify .env file exists
3. Run `npm install` again
4. Check port 5000 is available

### Frontend won't start
1. Check .env.local file exists
2. Verify backend is running
3. Run `npm install` again
4. Check port 3000 is available

### Database connection issues
1. Verify MongoDB is running
2. Check MONGODB_URI in .env
3. Test connection: `node backend/check-db.js`

## 📝 API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout

### Student
- GET /api/student/dashboard
- GET /api/student/marks-trend
- GET /api/student/attendance
- GET /api/student/insights
- POST /api/student/chat

### Faculty
- GET /api/faculty/dashboard
- GET /api/faculty/classes
- POST /api/polls/create
- GET /api/faculty/alerts

### Admin
- GET /api/admin/dashboard
- GET /api/admin/users
- POST /api/admin/bulk/import
- GET /api/admin/logs

## 🔒 Security
- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- Input validation

## 📊 Database Models
- User (students, faculty, admin)
- Marks
- Attendance
- Insight (AI predictions)
- Alert
- Poll
- Intervention
- Notification
- ChatHistory
- StudentGoal

## 🚀 Deployment
1. Build frontend: `cd frontend && npm run build`
2. Set production environment variables
3. Use PM2 for backend: `pm2 start backend/index.js`
4. Serve frontend with Nginx or Vercel

## 📞 Support
For issues or questions, check the logs:
- Backend: `backend/debug.log`
- Frontend: Browser console

## ✅ All Features Working
- ✅ Student Dashboard - All features functional
- ✅ Faculty Dashboard - All features functional
- ✅ Admin Dashboard - All features functional
- ✅ Authentication - Working
- ✅ Database Connection - Working
- ✅ API Endpoints - All tested
- ✅ Real-time Features - Socket.io working
- ✅ AI Features - Gemini integration working
- ✅ File Upload - Working
- ✅ Notifications - Working
- ✅ Reports - PDF generation working
