require('dotenv').config();
const prisma = require('../prismaClient');

const syncDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma database connection ready');
  } catch (error) {
    console.error('❌ Prisma database connection error:', error.message || error);
    process.exit(1);
  }
};

module.exports = {
  syncDatabase
};