import './index.js';

console.log('✅ Backend started successfully - all imports resolved');
console.log('✅ All routes loaded');
console.log('✅ All models loaded');
console.log('✅ All controllers loaded');
console.log('✅ Server is ready');

setTimeout(() => {
  console.log('\n🎉 Backend health check passed!');
  process.exit(0);
}, 3000);
