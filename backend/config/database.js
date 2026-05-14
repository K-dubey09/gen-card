require('dotenv').config();
const prisma = require('../prismaClient');

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message || error);
    process.exit(1);
  }
};

module.exports = connectDB;