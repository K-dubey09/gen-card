const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { isAuthenticated } = require('../middleware/auth');
const prisma = require('../prismaClient');
let SequelizeUser, SequelizeTransaction;
if (process.env.DB_TYPE !== 'mongodb' && process.env.DB_TYPE !== 'postgres' && process.env.DB_TYPE !== 'postgresql' && process.env.DB_TYPE !== 'prisma') {
    const models = require('../models');
    SequelizeUser = models.User;
    SequelizeTransaction = models.Transaction;
}

const router = express.Router();

// Credit packages
const CREDIT_PACKAGES = {
    starter: { credits: 50, price: 499, priceDisplay: '$4.99' },
    basic: { credits: 100, price: 899, priceDisplay: '$8.99' },
    pro: { credits: 250, price: 1999, priceDisplay: '$19.99' },
    premium: { credits: 500, price: 3499, priceDisplay: '$34.99' }
};

// Get available packages
router.get('/packages', (req, res) => {
    res.json({ packages: CREDIT_PACKAGES });
});

// Create payment intent
router.post('/create-intent', isAuthenticated, async (req, res) => {
    try {
        const { packageName } = req.body;

        if (!CREDIT_PACKAGES[packageName]) {
            return res.status(400).json({ error: 'Invalid package' });
        }

        const packageInfo = CREDIT_PACKAGES[packageName];

        const paymentIntent = await stripe.paymentIntents.create({
            amount: packageInfo.price,
            currency: 'usd',
            metadata: {
                userId: req.session.userId,
                package: packageName,
                credits: packageInfo.credits
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            credits: packageInfo.credits
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Confirm payment
router.post('/confirm', isAuthenticated, async (req, res) => {
    try {
        const { paymentIntentId, packageName } = req.body;

        if (!CREDIT_PACKAGES[packageName]) {
            return res.status(400).json({ error: 'Invalid package' });
        }

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        const packageInfo = CREDIT_PACKAGES[packageName];
        let user;
        if (process.env.DB_TYPE === 'postgres' || process.env.DB_TYPE === 'postgresql' || process.env.DB_TYPE === 'prisma') {
            user = await prisma.user.findUnique({ where: { id: parseInt(req.session.userId, 10) } });
            if (!user) return res.status(404).json({ error: 'User not found' });

            const updated = await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: CREDIT_PACKAGES[packageName].credits } } });
            await prisma.transaction.create({
                data: {
                    userId: updated.id,
                    type: 'purchase',
                    amount: CREDIT_PACKAGES[packageName].credits,
                    credits: CREDIT_PACKAGES[packageName].credits,
                    description: `Purchased ${packageName} package`,
                    paymentId: paymentIntentId
                }
            });

            res.json({ success: true, creditsAdded: CREDIT_PACKAGES[packageName].credits, totalCredits: updated.credits });
        } else {
            user = await SequelizeUser.findByPk(req.session.userId);
            user.credits += CREDIT_PACKAGES[packageName].credits;
            await user.save();
            await SequelizeTransaction.create({
                userId: user.id,
                type: 'purchase',
                amount: CREDIT_PACKAGES[packageName].credits,
                description: `Purchased ${packageName} package`,
                paymentId: paymentIntentId
            });
            res.json({ success: true, creditsAdded: CREDIT_PACKAGES[packageName].credits, totalCredits: user.credits });
        }
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

module.exports = router;
