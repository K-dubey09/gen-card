const bcrypt = require('bcrypt');
require('dotenv').config();
const prisma = require('./prismaClient');

async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to PostgreSQL via Prisma...');
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL\n');

    console.log('📊 Checking schema and seed data...');

    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@cardmaker.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@cardmaker.com',
          password: hashedPassword,
          role: 'admin',
          credits: 1000,
          isActive: true
        }
      });

      await prisma.transaction.create({
        data: {
          userId: admin.id,
          type: 'credit_purchase',
          amount: 0,
          credits: 1000,
          status: 'completed',
          metadata: { description: 'Initial admin seed credits' }
        }
      });

      console.log('✅ Admin user created');
      console.log('   Email: admin@cardmaker.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    const [users, sessions, documents, transactions] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.document.count(),
      prisma.transaction.count()
    ]);

    console.log('\n📈 Table Statistics:');
    console.log(`   Users: ${users}`);
    console.log(`   Sessions: ${sessions}`);
    console.log(`   Documents: ${documents}`);
    console.log(`   Transactions: ${transactions}`);

    console.log('\n✨ Database initialization complete!\n');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Prisma connection closed');
    process.exit(process.exitCode || 0);
  }
}

initializeDatabase();