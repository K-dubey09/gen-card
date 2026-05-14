const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/mongodb/User');
const Session = require('./models/mongodb/Session');
const Document = require('./models/mongodb/Document');
const Transaction = require('./models/mongodb/Transaction');

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Card-Maker');
    console.log('✅ Connected to MongoDB\n');

    // Create indexes
    console.log('📊 Creating indexes...');
    
    await User.createIndexes();
    console.log('✓ User indexes created');
    
    await Session.createIndexes();
    console.log('✓ Session indexes created');
    
    await Document.createIndexes();
    console.log('✓ Document indexes created');
    
    await Transaction.createIndexes();
    console.log('✓ Transaction indexes created');

    // Create admin user if doesn't exist
    console.log('\n👤 Checking for admin user...');
    const adminExists = await User.findOne({ email: 'admin@cardmaker.com' });
    
    if (!adminExists) {
      const bcrypt = require('bcrypt');
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        username: 'admin',
        email: 'admin@cardmaker.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
        credits: 1000,
        isActive: true
      });
      console.log('✅ Admin user created');
      console.log('   Email: admin@cardmaker.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Display collection stats
    console.log('\n📈 Collection Statistics:');
    const stats = {
      users: await User.countDocuments(),
      sessions: await Session.countDocuments(),
      documents: await Document.countDocuments(),
      transactions: await Transaction.countDocuments()
    };

    console.log(`   Users: ${stats.users}`);
    console.log(`   Sessions: ${stats.sessions}`);
    console.log(`   Documents: ${stats.documents}`);
    console.log(`   Transactions: ${stats.transactions}`);

    // Display indexes
    console.log('\n🔍 Indexes Created:');
    const userIndexes = await User.collection.getIndexes();
    const sessionIndexes = await Session.collection.getIndexes();
    
    console.log('\n   User Collection:');
    Object.keys(userIndexes).forEach(index => {
      console.log(`   - ${index}`);
    });

    console.log('\n   Session Collection:');
    Object.keys(sessionIndexes).forEach(index => {
      console.log(`   - ${index}`);
    });

    console.log('\n✨ Database initialization complete!\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run initialization
initializeDatabase();
