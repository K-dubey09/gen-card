require('dotenv').config();
const prisma = require('../prismaClient');

const connectPrisma = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to PostgreSQL');
  } catch (err) {
    console.error('❌ Prisma connection error:', err.message || err);
    process.exit(1);
  }
};

module.exports = { prisma, connectPrisma };
