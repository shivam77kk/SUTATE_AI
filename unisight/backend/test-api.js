import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let testResults = { passed: 0, failed: 0, errors: [] };

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testResults.passed++;
  } catch (err) {
    console.error(`❌ ${name}: ${err.message}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error: err.message });
  }
};

async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  // Health check
  await test('Health Check', async () => {
    const { data } = await axios.get(`${API_URL}/health`);
    if (data.status !== 'ok') throw new Error('Health check failed');
  });

  // Auth endpoints
  await test('Login - Student', async () => {
    const { data } = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@test.com',
      password: 'password123'
    });
    if (!data.token) throw new Error('No token received');
    authToken = data.token;
  });

  const headers = { Authorization: `Bearer ${authToken}` };

  // Student endpoints
  await test('Student Dashboard', async () => {
    const { data } = await axios.get(`${API_URL}/student/dashboard`, { headers });
    if (data.cgpa === undefined) throw new Error('No CGPA data');
  });

  await test('Student Profile', async () => {
    const { data } = await axios.get(`${API_URL}/student/me`, { headers });
    if (!data.student) throw new Error('No student data');
  });

  await test('Student Marks Trend', async () => {
    await axios.get(`${API_URL}/student/marks-trend`, { headers });
  });

  await test('Student Radar', async () => {
    await axios.get(`${API_URL}/student/radar`, { headers });
  });

  await test('Student Attendance', async () => {
    await axios.get(`${API_URL}/student/attendance`, { headers });
  });

  await test('Student Insights', async () => {
    await axios.get(`${API_URL}/student/insights`, { headers });
  });

  await test('Student Timeline', async () => {
    await axios.get(`${API_URL}/student/timeline`, { headers });
  });

  await test('Student Activity', async () => {
    await axios.get(`${API_URL}/student/activity`, { headers });
  });

  await test('Student Goals', async () => {
    await axios.get(`${API_URL}/student/goals`, { headers });
  });

  await test('Student Longitudinal', async () => {
    await axios.get(`${API_URL}/student/longitudinal`, { headers });
  });

  await test('Student Study Plan', async () => {
    await axios.get(`${API_URL}/student/study-plan`, { headers });
  });

  // Mood check-in
  await test('Mood Status', async () => {
    await axios.get(`${API_URL}/mood/status`, { headers });
  });

  // Polls
  await test('Active Polls', async () => {
    await axios.get(`${API_URL}/polls/active`, { headers });
  });

  // Notifications
  await test('Notifications', async () => {
    await axios.get(`${API_URL}/notifications`, { headers });
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log('='.repeat(50));

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
