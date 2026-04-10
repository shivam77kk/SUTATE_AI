import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running UniSight Diagnostics...\n');

let issues = [];
let checks = 0;

function check(name, condition, fix) {
  checks++;
  if (!condition) {
    issues.push({ name, fix });
    console.log(`❌ ${name}`);
  } else {
    console.log(`✅ ${name}`);
  }
}

// Check required files
check('Backend index.js exists', fs.existsSync(path.join(__dirname, 'index.js')));
check('Backend package.json exists', fs.existsSync(path.join(__dirname, 'package.json')));
check('Backend .env exists', fs.existsSync(path.join(__dirname, '.env')), 'Create .env file with required variables');

// Check models
const modelsDir = path.join(__dirname, 'models');
const requiredModels = ['User.js', 'Marks.js', 'Attendance.js', 'Insight.js', 'Alert.js', 'Poll.js', 'ChatHistory.js'];
requiredModels.forEach(model => {
  check(`Model ${model} exists`, fs.existsSync(path.join(modelsDir, model)));
});

// Check controllers
const controllersDir = path.join(__dirname, 'controllers');
const requiredControllers = ['studentController.js', 'facultyController.js', 'adminController.js', 'authController.js', 'pollController.js'];
requiredControllers.forEach(controller => {
  check(`Controller ${controller} exists`, fs.existsSync(path.join(controllersDir, controller)));
});

// Check routes
const routesDir = path.join(__dirname, 'routes');
const requiredRoutes = ['student.js', 'faculty.js', 'admin.js', 'auth.js', 'polls.js', 'mood.js'];
requiredRoutes.forEach(route => {
  check(`Route ${route} exists`, fs.existsSync(path.join(routesDir, route)));
});

// Check node_modules
check('node_modules exists', fs.existsSync(path.join(__dirname, 'node_modules')), 'Run: npm install');

console.log('\n' + '='.repeat(50));
console.log(`Total Checks: ${checks}`);
console.log(`Passed: ${checks - issues.length}`);
console.log(`Failed: ${issues.length}`);
console.log('='.repeat(50));

if (issues.length > 0) {
  console.log('\n❌ Issues Found:');
  issues.forEach(({ name, fix }) => {
    console.log(`  - ${name}`);
    if (fix) console.log(`    Fix: ${fix}`);
  });
  console.log('\n⚠️  Please fix the issues above before starting the server.');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed! Backend is ready to start.');
  console.log('Run: npm run dev');
  process.exit(0);
}
