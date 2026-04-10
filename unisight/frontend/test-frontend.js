import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

function checkFileExists(filePath, name) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`${name} exists`);
    return true;
  } else {
    log.error(`${name} missing`);
    return false;
  }
}

function checkDirectoryContents(dirPath, name) {
  const fullPath = path.join(__dirname, dirPath);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    log.success(`${name} exists (${files.length} files)`);
    return files.length;
  } else {
    log.error(`${name} missing`);
    return 0;
  }
}

function testConfiguration() {
  log.info('Testing Configuration Files...');
  let passed = 0;
  
  if (checkFileExists('package.json', 'package.json')) passed++;
  if (checkFileExists('next.config.mjs', 'Next.js config')) passed++;
  if (checkFileExists('tailwind.config.js', 'Tailwind config')) passed++;
  if (checkFileExists('.env.local', 'Environment variables')) passed++;
  
  return passed;
}

function testPages() {
  log.info('Testing Pages...');
  let passed = 0;
  
  const pages = [
    'app/page.js',
    'app/login/page.js',
    'app/register/page.js',
    'app/student/page.js',
    'app/faculty/page.js',
    'app/admin/page.js'
  ];
  
  pages.forEach(page => {
    if (checkFileExists(page, page)) passed++;
  });
  
  return passed;
}

function testComponents() {
  log.info('Testing Components...');
  
  const componentCount = checkDirectoryContents('components', 'Components directory');
  
  const criticalComponents = [
    'components/ui',
    'components/student',
    'components/faculty',
    'components/admin'
  ];
  
  let passed = 0;
  criticalComponents.forEach(comp => {
    if (checkDirectoryContents(comp, comp)) passed++;
  });
  
  return passed + (componentCount > 0 ? 1 : 0);
}

function testHooks() {
  log.info('Testing Custom Hooks...');
  return checkDirectoryContents('hooks', 'Hooks directory');
}

function testStore() {
  log.info('Testing State Management...');
  return checkDirectoryContents('store', 'Store directory');
}

function testLib() {
  log.info('Testing Utilities...');
  return checkDirectoryContents('lib', 'Lib directory');
}

function testPublicAssets() {
  log.info('Testing Public Assets...');
  return checkDirectoryContents('public', 'Public directory');
}

function testDependencies() {
  log.info('Testing Dependencies...');
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log.error('package.json not found');
    return 0;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = Object.keys(pkg.dependencies || {});
  
  const critical = [
    'next', 'react', 'react-dom', 'axios', 'socket.io-client',
    'zustand', '@tanstack/react-query', 'framer-motion', 'three',
    '@react-three/fiber', '@react-three/drei', 'lucide-react'
  ];
  
  let passed = 0;
  critical.forEach(dep => {
    if (deps.includes(dep)) {
      log.success(`${dep} installed`);
      passed++;
    } else {
      log.error(`${dep} missing`);
    }
  });
  
  return passed;
}

function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 FRONTEND VERIFICATION TEST SUITE');
  console.log('='.repeat(60) + '\n');

  const results = {
    passed: 0,
    total: 0
  };

  results.passed += testConfiguration();
  console.log('');
  
  results.passed += testPages();
  console.log('');
  
  results.passed += testComponents();
  console.log('');
  
  results.passed += testHooks();
  console.log('');
  
  results.passed += testStore();
  console.log('');
  
  results.passed += testLib();
  console.log('');
  
  results.passed += testPublicAssets();
  console.log('');
  
  results.passed += testDependencies();
  console.log('');

  console.log('\n' + '='.repeat(60));
  console.log('📊 FRONTEND TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`${colors.green}Components Verified: ${results.passed}${colors.reset}`);
  console.log('='.repeat(60) + '\n');
}

runAllTests();
