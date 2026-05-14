const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// User Model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    credits: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    }
}, {
    timestamps: true,
    tableName: 'users'
});

// Transaction Model
const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('purchase', 'usage', 'bonus'),
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING
    },
    paymentId: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true,
    tableName: 'transactions'
});

// CardGeneration Model
const CardGeneration = sequelize.define('CardGeneration', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    cardsGenerated: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    creditsUsed: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fileName: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true,
    tableName: 'card_generations'
});

// Relationships
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CardGeneration, { foreignKey: 'userId' });
CardGeneration.belongsTo(User, { foreignKey: 'userId' });

// Sync database
const syncDatabase = async () => {
    // Skip SQLite sync if using MongoDB or Postgres (Prisma will manage schema)
    if (process.env.DB_TYPE === 'mongodb' || process.env.DB_TYPE === 'postgres' || process.env.DB_TYPE === 'postgresql' || process.env.DB_TYPE === 'prisma') {
        console.log('ℹ️  Using alternative DB - Skipping SQLite sync');
        return;
    }
    
    try {
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized');
    } catch (error) {
        console.error('❌ Database sync error:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Transaction,
    CardGeneration,
    syncDatabase
};
