const mongoose = require('mongoose');
const User = require('../models/mongodb/User');
require('dotenv').config();

async function testAuth() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Card-Maker');
    console.log('✅ Connected to MongoDB\n');

    // Check if admin exists
    const admin = await User.findOne({ email: 'admin@cardmaker.com' });
    console.log('Admin user:', admin ? 'EXISTS' : 'NOT FOUND');
    
    if (admin) {
      console.log('Admin details:');
      console.log('  Username:', admin.username);
      console.log('  Email:', admin.email);
      console.log('  Role:', admin.role);
      console.log('  Credits:', admin.credits);
      console.log('  Active:', admin.isActive);
      
      // Test password
      const testPassword = 'admin123';
      const isValid = await admin.comparePassword(testPassword);
      console.log('\n🔐 Password test (admin123):', isValid ? '✅ VALID' : '❌ INVALID');
    } else {
      console.log('\n⚠️  Creating admin user...');
      const newAdmin = await User.create({
        username: 'admin',
        email: 'admin@cardmaker.com',
        password: 'admin123',
        role: 'admin',
        credits: 1000,
        isActive: true
      });
      console.log('✅ Admin user created successfully');
      console.log('   Username: admin');
      console.log('   Email: admin@cardmaker.com');
      console.log('   Password: admin123');
    }

    // Check if test user exists
    console.log('\n---');
    const testUser = await User.findOne({ email: 'test@test.com' });
    console.log('Test user:', testUser ? 'EXISTS' : 'NOT FOUND');
    
    if (!testUser) {
      console.log('⚠️  Creating test user...');
      await User.create({
        username: 'testuser',
        email: 'test@test.com',
        password: 'test123',
        role: 'user',
        credits: 50,
        isActive: true
      });
      console.log('✅ Test user created');
      console.log('   Username: testuser');
      console.log('   Email: test@test.com');
      console.log('   Password: test123');
    }

    console.log('\n✅ Authentication test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAuth();
